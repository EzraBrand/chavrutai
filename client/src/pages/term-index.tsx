import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";

const CSV_URL =
  "https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/docs/glossary/glossary_initial_v4.csv";

interface GlossaryRow {
  term: string;
  categories: string;
  variant_names: string;
  talmud_corpus_count: string;
  wikipedia_en: string;
  wikipedia_he: string;
  selected_anchor_text: string;
  hebrew_term: string;
  chavrutai_search_url: string;
  wiki_match_source: string;
  wikidata_id: string;
  father: string;
  student_of: string;
  affiliation: string;
  student: string;
  date_of_birth: string;
  place_of_birth: string;
  date_of_death: string;
  place_of_death: string;
  __search: string;
  __categories: string[];
}

type SortKey = keyof Omit<GlossaryRow, "__search" | "__categories">;
type SortDir = "asc" | "desc";

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = "";
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r.length === headers.length).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (r[i] || "").trim(); });
    return obj;
  });
}

function wikiTitleFromUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const title = parts[parts.length - 1];
    return decodeURIComponent(title).replace(/_/g, " ");
  } catch {
    return url;
  }
}

function ExternalLinkCell({ href, label }: { href: string; label: string }) {
  if (!href || !label) return <span className="text-muted-foreground/50">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs"
    >
      {label}
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  );
}

function CategoryBadges({ categories }: { categories: string }) {
  const cats = categories.split(";").map(c => c.trim()).filter(Boolean);
  if (!cats.length) return <span className="text-muted-foreground/50">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {cats.map(c => (
        <span
          key={c}
          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium whitespace-nowrap"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 ml-1 inline" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary ml-1 inline" />
    : <ArrowDown className="w-3 h-3 text-primary ml-1 inline" />;
}

const COLUMNS: { key: SortKey; label: string; tooltip?: string; minWidth?: string }[] = [
  { key: "term", label: "Term", minWidth: "140px" },
  { key: "categories", label: "Category", minWidth: "100px" },
  { key: "variant_names", label: "Variants", minWidth: "120px" },
  { key: "talmud_corpus_count", label: "Count", tooltip: "Approximate occurrences in the Steinsaltz English corpus.", minWidth: "60px" },
  { key: "wikipedia_en", label: "Wikipedia EN", tooltip: "Mapped English Wikipedia page, if available.", minWidth: "140px" },
  { key: "wikipedia_he", label: "Wikipedia HE", tooltip: "Mapped Hebrew Wikipedia page, if available.", minWidth: "140px" },
  { key: "hebrew_term", label: "Hebrew Term", tooltip: "Hebrew label as it appears in the Talmud.", minWidth: "100px" },
  { key: "wikidata_id", label: "Wikidata ID", tooltip: "Wikidata item ID derived from the mapped Wikipedia page.", minWidth: "90px" },
  { key: "father", label: "Father", tooltip: "Wikidata field: father.", minWidth: "100px" },
  { key: "student_of", label: "Teacher(s)", tooltip: "Wikidata field: student_of.", minWidth: "120px" },
  { key: "affiliation", label: "Affiliation", tooltip: "Wikidata field: affiliation.", minWidth: "110px" },
  { key: "student", label: "Student(s)", tooltip: "Wikidata field: student.", minWidth: "120px" },
  { key: "date_of_birth", label: "Birth Date", tooltip: "Wikidata field: date_of_birth.", minWidth: "80px" },
  { key: "place_of_birth", label: "Birth Place", tooltip: "Wikidata field: place_of_birth.", minWidth: "100px" },
  { key: "date_of_death", label: "Death Date", tooltip: "Wikidata field: date_of_death.", minWidth: "80px" },
  { key: "place_of_death", label: "Death Place", tooltip: "Wikidata field: place_of_death.", minWidth: "100px" },
];

export default function TermIndexPage() {
  useSEO({
    title: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
    description: "Comprehensive index of personal names, place names, and key terms in the Babylonian Talmud. Includes corpus counts, Wikipedia links, Hebrew terms, and biographical data.",
    ogTitle: "Talmud Term Index - Names, Places & Key Terms",
    ogDescription: "Comprehensive index of personal names, place names, and key terms in the Babylonian Talmud with corpus counts and Wikipedia links.",
    canonical: `${window.location.origin}/term-index`,
    robots: "index, follow",
  });

  const [rawData, setRawData] = useState<GlossaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("term");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(CSV_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const parsed = parseCsv(text);
        if (cancelled) return;
        const rows: GlossaryRow[] = parsed.map(r => {
          const cats = (r.categories || "").split(";").map(c => c.trim()).filter(Boolean);
          return {
            ...(r as unknown as GlossaryRow),
            __search: Object.values(r).join(" ").toLowerCase(),
            __categories: cats,
          };
        });
        setRawData(rows);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => r.__categories.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [rawData]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return rawData.filter(r => {
      const textOk = needle ? r.__search.includes(needle) : true;
      const catOk = categoryFilter ? r.__categories.includes(categoryFilter) : true;
      return textOk && catOk;
    });
  }, [rawData, searchQuery, categoryFilter]);

  const sorted = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const sign = sortDir === "asc" ? 1 : -1;
      if (sortKey === "talmud_corpus_count") {
        const av = parseInt(a.talmud_corpus_count || "0", 10) || 0;
        const bv = parseInt(b.talmud_corpus_count || "0", 10) || 0;
        if (av !== bv) return (av - bv) * sign;
        return a.term.localeCompare(b.term);
      }
      const ax = (a[sortKey] || "").toString().toLowerCase();
      const bx = (b[sortKey] || "").toString().toLowerCase();
      const cmp = ax.localeCompare(bx, undefined, { numeric: true, sensitivity: "base" });
      if (cmp !== 0) return cmp * sign;
      return a.term.localeCompare(b.term);
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "talmud_corpus_count" ? "desc" : "asc");
    }
  }

  function renderCell(row: GlossaryRow, key: SortKey, idx: number): React.ReactNode {
    switch (key) {
      case "term":
        return row.term ? (
          <Link
            href={`/search?q=${encodeURIComponent(row.term)}`}
            className="font-medium text-primary hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {row.term}
          </Link>
        ) : <span className="text-muted-foreground/50">—</span>;
      case "categories":
        return <CategoryBadges categories={row.categories} />;
      case "variant_names": {
        const items = (row.variant_names || "").split(";").map(v => v.trim()).filter(Boolean);
        if (!items.length) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="text-xs space-y-0.5">
            {items.map((v, i) => (
              <a
                key={i}
                href={`https://chavrutai.com/search?q=${encodeURIComponent(v)}&type=talmud`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5 mr-1"
              >
                {v}
                {i < items.length - 1 && <span className="text-muted-foreground">;</span>}
              </a>
            ))}
          </div>
        );
      }
      case "talmud_corpus_count":
        return (row.talmud_corpus_count === "0" || !row.talmud_corpus_count)
          ? <span className="text-muted-foreground/50">—</span>
          : <span className="font-mono text-sm">{row.talmud_corpus_count}</span>;
      case "wikipedia_en":
        return <ExternalLinkCell href={row.wikipedia_en} label={wikiTitleFromUrl(row.wikipedia_en)} />;
      case "wikipedia_he":
        return <ExternalLinkCell href={row.wikipedia_he} label={wikiTitleFromUrl(row.wikipedia_he)} />;
      case "hebrew_term":
        return row.hebrew_term
          ? <span dir="rtl" className="font-hebrew text-sm">{row.hebrew_term}</span>
          : <span className="text-muted-foreground/50">—</span>;
      case "wikidata_id":
        return row.wikidata_id
          ? <ExternalLinkCell href={`https://www.wikidata.org/wiki/${encodeURIComponent(row.wikidata_id)}`} label={row.wikidata_id} />
          : <span className="text-muted-foreground/50">—</span>;
      default: {
        const val = row[key];
        return val ? <span className="text-sm">{val}</span> : <span className="text-muted-foreground/50">—</span>;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-10 h-10 object-cover" />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Index of Names, Places &amp; Key Terms
          </h1>
          <p className="text-sm text-muted-foreground">
            Canonicalized glossary of Talmudic and Biblical terms with variants, corpus counts, and Wikipedia links.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search terms, variants, names…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-72 max-w-[50vw]"
            />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none border border-input rounded-md bg-background px-3 py-2 pr-8 text-sm text-foreground min-w-[180px] focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <span className="text-sm text-muted-foreground ml-auto">
            {isLoading ? "Loading…" : `${sorted.length.toLocaleString()} / ${rawData.length.toLocaleString()} rows`}
          </span>
        </div>

        {/* Table */}
        <div
          ref={tableWrapRef}
          className="flex-1 border border-border rounded-lg overflow-auto bg-card shadow-sm"
          style={{ minHeight: 0, maxHeight: "calc(100vh - 260px)" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading glossary data…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-destructive text-sm">
              Error: {error}
            </div>
          ) : (
            <table className="border-collapse text-sm" style={{ minWidth: "2200px", width: "100%", tableLayout: "fixed" }}>
              <thead className="sticky top-0 z-20">
                <tr>
                  <th
                    className="text-right text-muted-foreground font-medium border-b border-border px-2 py-2.5 text-xs w-10"
                    style={{ position: "sticky", left: 0, zIndex: 30, background: "var(--muted)" }}
                  >
                    #
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      title={col.tooltip}
                      className="text-left font-semibold border-b border-border px-3 py-2.5 cursor-pointer select-none text-xs whitespace-nowrap transition-colors"
                      style={{
                        minWidth: col.minWidth,
                        background: "var(--muted)",
                        ...(col.key === "term" ? { position: "sticky", left: "40px", zIndex: 30, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.12)" } : {}),
                      }}
                    >
                      {col.label}
                      <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      {col.tooltip && (
                        <span
                          title={col.tooltip}
                          className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground/60 text-[9px] cursor-help"
                        >
                          ?
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} className="text-center text-muted-foreground py-10 text-sm">
                      No results found. Try a different search term or category.
                    </td>
                  </tr>
                ) : (
                  sorted.map((row, idx) => (
                    <tr
                      key={`${row.term}-${idx}`}
                      onClick={() => setSelectedRow(selectedRow === idx ? null : idx)}
                      className={`cursor-pointer border-b border-border/50 transition-colors ${
                        selectedRow === idx
                          ? "bg-primary/15"
                          : idx % 2 === 0
                          ? "bg-card hover:bg-muted/40"
                          : "bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <td
                        className="text-right text-muted-foreground/60 text-xs px-2 py-2 font-mono"
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                          background: selectedRow === idx ? "color-mix(in srgb, var(--primary) 15%, var(--card))" : idx % 2 === 0 ? "var(--card)" : "var(--muted)",
                        }}
                      >
                        {idx + 1}
                      </td>
                      {COLUMNS.map(col => (
                        <td
                          key={col.key}
                          className="px-3 py-2 align-top"
                          style={{
                            minWidth: col.minWidth,
                            ...(col.key === "term" ? {
                              position: "sticky",
                              left: "40px",
                              zIndex: 10,
                              boxShadow: "2px 0 4px -2px rgba(0,0,0,0.10)",
                              background: selectedRow === idx ? "color-mix(in srgb, var(--primary) 15%, var(--card))" : idx % 2 === 0 ? "var(--card)" : "var(--muted)",
                            } : {}),
                          }}
                        >
                          {renderCell(row, col.key, idx)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { ExternalLink } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlossaryRow {
  term: string;
  categories: string;
  variant_names: string;
  talmud_corpus_count: string;
  wikipedia_en: string;
  wikipedia_he: string;
  hebrew_term: string;
  father: string;
  student_of: string;
  affiliation: string;
  student: string;
  date_of_birth: string;
  place_of_birth: string;
  date_of_death: string;
  place_of_death: string;
  // derived
  __categories: string[];
  __corpusCount: number;
  __wikiEnUrl: string;
  __wikiEnTitle: string;
  __wikiHeUrl: string;
  __wikiHeTitle: string;
  __variants: string[];
  __search: string;
}

interface SearchResult {
  ref: string;
  text: string;
  highlight?: string;
  type: "talmud" | "bible" | "other";
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  names: "Names",
  talmudToponyms: "Places",
  biblicalNames: "Biblical Names",
  concepts: "Concepts",
  biblicalNations: "Nations",
  biblicalPlaces: "Biblical Places",
};

const TAB_ORDER = ["all", "names", "talmudToponyms", "biblicalNames", "concepts", "biblicalNations", "biblicalPlaces"];
const DISPLAY_LIMIT = 120;

type SortOption = "count-desc" | "count-asc" | "alpha-asc" | "alpha-desc";
const SORT_LABELS: Record<SortOption, string> = {
  "count-desc": "Count: high to low",
  "count-asc": "Count: low to high",
  "alpha-asc": "A to Z",
  "alpha-desc": "Z to A",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function wikiTitleFromUrl(url: string): string {
  if (!url) return "";
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]).replace(/_/g, " ");
  } catch { return url; }
}

function cleanList(raw: string): string {
  if (!raw) return "";
  return raw.split(";").map(s => s.trim()).filter(s => s && !s.startsWith("Q")).join("; ");
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function buildRow(obj: Record<string, string>): GlossaryRow {
  const cats = (obj.categories || "").split(";").map(c => c.trim()).filter(Boolean);
  const variants = (obj.variant_names || "").split(";").map(v => v.trim()).filter(Boolean);
  return {
    ...(obj as unknown as GlossaryRow),
    __categories: cats,
    __corpusCount: parseInt(obj.talmud_corpus_count || "0", 10) || 0,
    __wikiEnUrl: obj.wikipedia_en || "",
    __wikiEnTitle: wikiTitleFromUrl(obj.wikipedia_en),
    __wikiHeUrl: obj.wikipedia_he || "",
    __wikiHeTitle: wikiTitleFromUrl(obj.wikipedia_he),
    __variants: variants,
    __search: [obj.term, obj.variant_names, obj.hebrew_term].join(" ").toLowerCase(),
  };
}

// ── HighlightedText ───────────────────────────────────────────────────────────

function HighlightedText({ result }: { result: SearchResult }) {
  const raw = result.highlight || result.text;
  const parts = raw.split(/(<(?:em|mark)>[^<]*<\/(?:em|mark)>)/g);
  return (
    <span className="text-sm text-foreground leading-relaxed">
      {parts.map((part, i) => {
        if (/^<(em|mark)>/.test(part)) {
          const inner = part.replace(/<\/?(?:em|mark)>/g, "");
          return <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 px-px rounded not-italic">{inner}</mark>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────

function DetailPanel({ row, onClose }: { row: GlossaryRow; onClose: () => void }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    setSearchError(false);
    setResults([]);
    const params = new URLSearchParams({ query: row.term, page: "1", pageSize: "10", type: "talmud", exact: "false" });
    fetch(`/api/search/text?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<SearchResponse>; })
      .then(data => { if (!cancelled) { setResults(data.results); setTotal(data.total); setSearching(false); } })
      .catch(() => { if (!cancelled) { setSearchError(true); setSearching(false); } });
    return () => { cancelled = true; };
  }, [row.term]);

  const teacher = cleanList(row.student_of);
  const student = cleanList(row.student);
  const father = cleanList(row.father);
  const isNames = row.__categories.includes("names");
  const isPlace = row.__categories.includes("talmudToponyms") || row.__categories.includes("biblicalPlaces");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-lg text-foreground">{row.term}</span>
            {row.hebrew_term && (
              <span dir="rtl" className="text-base text-muted-foreground" style={{ fontFamily: "serif" }}>{row.hebrew_term}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {row.__categories.map(c => (
              <span key={c} className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                {CATEGORY_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-lg leading-none px-1"
        >
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {row.__variants.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-muted-foreground/70">Also known as: </span>{row.__variants.join(", ")}
          </p>
        )}

        {row.__corpusCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {row.__corpusCount.toLocaleString()} occurrences in the Steinsaltz English corpus
          </p>
        )}

        {/* Bio / place details */}
        {isNames && (father || teacher || student || row.affiliation || row.date_of_birth) && (
          <div className="rounded-md bg-muted/50 px-4 py-3 text-sm space-y-1">
            {father && <div><span className="text-muted-foreground">Father: </span>{father}</div>}
            {teacher && <div><span className="text-muted-foreground">Teacher: </span>{teacher}</div>}
            {student && <div><span className="text-muted-foreground">Student: </span>{student}</div>}
            {row.affiliation && <div><span className="text-muted-foreground">Affiliation: </span>{row.affiliation}</div>}
            {row.date_of_birth && (
              <div>
                <span className="text-muted-foreground">Born: </span>
                {row.date_of_birth}{row.place_of_birth ? `, ${row.place_of_birth}` : ""}
              </div>
            )}
            {row.date_of_death && (
              <div>
                <span className="text-muted-foreground">Died: </span>
                {row.date_of_death}{row.place_of_death ? `, ${row.place_of_death}` : ""}
              </div>
            )}
          </div>
        )}

        {isPlace && row.affiliation && (
          <div className="rounded-md bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Region: </span>{row.affiliation}
          </div>
        )}

        {/* Wikipedia */}
        {(row.__wikiEnUrl || row.__wikiHeUrl) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {row.__wikiEnUrl && (
              <a href={row.__wikiEnUrl} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1">
                Wikipedia (EN): {row.__wikiEnTitle}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {row.__wikiHeUrl && (
              <a href={row.__wikiHeUrl} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1">
                ויקיפדיה (HE): {row.__wikiHeTitle}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Corpus passages */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">
              Corpus passages
              {!searching && !searchError && (
                <span className="font-normal text-muted-foreground ml-1.5">({total.toLocaleString()} total)</span>
              )}
            </span>
            <Link
              href={`/search?q=${encodeURIComponent(row.term)}&type=talmud`}
              className="text-xs text-primary hover:underline"
            >
              View all in search →
            </Link>
          </div>

          {searching && <p className="text-sm text-muted-foreground py-4">Loading passages…</p>}
          {searchError && <p className="text-sm text-destructive py-2">Could not load passages.</p>}
          {!searching && !searchError && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No passages found.</p>
          )}

          <div className="space-y-2">
            {results.map((result, i) => (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(row.term)}&type=talmud`}
                className="block border border-border rounded-md px-3 py-2.5 hover:bg-accent/50 transition-colors"
              >
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {result.type === "talmud" ? "Talmud" : result.type === "bible" ? "Bible" : "Other"}
                  {" · "}
                  <span className="normal-case tracking-normal">{result.ref}</span>
                </div>
                <HighlightedText result={result} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TermCard ──────────────────────────────────────────────────────────────────

function TermCard({
  row, activeTab, isSelected, onClick,
}: {
  row: GlossaryRow;
  activeTab: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isNames = activeTab === "names" || (activeTab === "all" && row.__categories.includes("names"));
  const isPlace = activeTab === "talmudToponyms" || activeTab === "biblicalPlaces" ||
    (activeTab === "all" && (row.__categories.includes("talmudToponyms") || row.__categories.includes("biblicalPlaces")));
  const teacher = cleanList(row.student_of);
  const student = cleanList(row.student);
  const father = cleanList(row.father);

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-3.5 cursor-pointer transition-all ${
        isSelected
          ? "border-foreground bg-muted/40 shadow-sm"
          : "border-border bg-card hover:border-muted-foreground/40 hover:shadow-sm"
      }`}
    >
      {/* Term + Hebrew */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="font-medium text-foreground text-sm leading-snug">{row.term}</span>
          {row.__variants.length > 0 && (
            <div className="text-xs text-muted-foreground/70 mt-0.5">
              also: {row.__variants.slice(0, 3).join(", ")}
              {row.__variants.length > 3 && ` +${row.__variants.length - 3}`}
            </div>
          )}
        </div>
        {row.hebrew_term && (
          <span dir="rtl" className="text-sm text-muted-foreground flex-shrink-0 leading-snug" style={{ fontFamily: "serif" }}>
            {row.hebrew_term}
          </span>
        )}
      </div>

      {/* Corpus count */}
      {row.__corpusCount > 0 && (
        <p className="text-xs text-muted-foreground/70 mb-2">
          {row.__corpusCount.toLocaleString()} occurrences
        </p>
      )}

      {/* Category badge for All tab */}
      {activeTab === "all" && row.__categories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {row.__categories.slice(0, 2).map(c => (
            <span key={c} className="text-xs border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground/80">
              {CATEGORY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}

      {/* Biographical (names) */}
      {isNames && (father || teacher || student) && (
        <div className="border-t border-border/50 pt-2 mt-1 text-xs text-muted-foreground space-y-0.5">
          {father && <div><span className="text-muted-foreground/60">Father: </span>{father}</div>}
          {teacher && <div><span className="text-muted-foreground/60">Teacher: </span>{teacher}</div>}
          {student && <div><span className="text-muted-foreground/60">Student: </span>{student}</div>}
        </div>
      )}

      {/* Place */}
      {isPlace && row.affiliation && (
        <div className="border-t border-border/50 pt-2 mt-1 text-xs text-muted-foreground">
          <span className="text-muted-foreground/60">Region: </span>{row.affiliation}
        </div>
      )}

      {/* Wikipedia links */}
      {(row.__wikiEnUrl || row.__wikiHeUrl) && (
        <div className="mt-2 flex gap-3 flex-wrap">
          {row.__wikiEnUrl && (
            <a
              href={row.__wikiEnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
              onClick={e => e.stopPropagation()}
            >
              Wikipedia EN
            </a>
          )}
          {row.__wikiHeUrl && (
            <a
              href={row.__wikiHeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
              onClick={e => e.stopPropagation()}
            >
              ויקיפדיה HE
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TermIndexPage() {
  useSEO({
    title: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
    description: "Glossary of personal names, place names, and key terms in the Babylonian Talmud. Includes corpus counts, Wikipedia links, Hebrew terms, and biographical data.",
    ogTitle: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
    ogDescription: "Glossary of personal names, place names, and key terms in the Babylonian Talmud with corpus counts, Wikipedia links, and biographical data.",
    canonical: `${window.location.origin}/term-index`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Talmud Term Index",
      description: "Glossary of personal names, place names, and key terms in the Babylonian Talmud with corpus counts and Wikipedia mappings.",
      url: `${window.location.origin}/term-index`,
      license: "https://opensource.org/licenses/MIT",
      creator: { "@type": "Person", name: "Ezra Brand", url: "https://www.ezrabrand.com/" },
      publisher: { "@type": "Organization", name: "ChavrutAI", url: window.location.origin },
      about: { "@type": "Thing", name: "Babylonian Talmud" },
      keywords: "Talmud, glossary, rabbinic names, place names, Aramaic, Hebrew, Babylonian Talmud, NLP, corpus",
    },
  });

  const [rawData, setRawData] = useState<GlossaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("names");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortOption>("count-desc");
  const [selected, setSelected] = useState<GlossaryRow | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  // Load from shared/data via API
  useEffect(() => {
    let cancelled = false;
    fetch("/api/glossary")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: { fields: string[]; rows: string[][] }) => {
        if (cancelled) return;
        const rows = data.rows.map(row => {
          const obj: Record<string, string> = {};
          data.fields.forEach((f, i) => { obj[f] = row[i] || ""; });
          return buildRow(obj);
        });
        setRawData(rows);
        setIsLoading(false);
      })
      .catch(e => { if (!cancelled) { setLoadError(e.message); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawData.length };
    TAB_ORDER.forEach(cat => {
      if (cat !== "all") counts[cat] = rawData.filter(r => r.__categories.includes(cat)).length;
    });
    return counts;
  }, [rawData]);

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return rawData.filter(r => {
      const catOk = activeTab === "all" || r.__categories.includes(activeTab);
      const textOk = needle ? r.__search.includes(needle) : true;
      return catOk && textOk;
    });
  }, [rawData, activeTab, debouncedSearch]);

  const sortedFiltered = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      switch (sort) {
        case "count-desc": return b.__corpusCount !== a.__corpusCount ? b.__corpusCount - a.__corpusCount : a.term.localeCompare(b.term);
        case "count-asc": return a.__corpusCount !== b.__corpusCount ? a.__corpusCount - b.__corpusCount : a.term.localeCompare(b.term);
        case "alpha-asc": return a.term.localeCompare(b.term, undefined, { sensitivity: "base" });
        case "alpha-desc": return b.term.localeCompare(a.term, undefined, { sensitivity: "base" });
      }
    });
  }, [filtered, sort]);

  const displayed = showAll ? sortedFiltered : sortedFiltered.slice(0, DISPLAY_LIMIT);

  const handleTabChange = useCallback((cat: string) => {
    setActiveTab(cat); setShowAll(false); setSelected(null);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val); setShowAll(false);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm flex-shrink-0">
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

      {/* ── Page title ── */}
      <div className="border-b border-border px-6 py-5 flex-shrink-0 bg-card">
        <h1 className="text-xl font-semibold text-foreground">Index of Names, Places &amp; Key Terms</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Glossary of Talmudic and Biblical terms with variants, corpus counts, and Wikipedia links.{" "}
          <a
            href="https://www.ezrabrand.com/p/introducing-a-new-talmudic-glossary"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Learn more <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* ── Toolbar (search + sort) ── */}
      <div className="px-6 py-2.5 border-b border-border/60 bg-muted/40 flex items-center gap-3 flex-shrink-0 flex-wrap">
        <input
          type="search"
          placeholder="Search terms, Hebrew, variants…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="border border-input rounded-md px-3 py-1.5 text-sm w-64 bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground text-foreground"
        />
        <div className="ml-auto">
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortOption); setShowAll(false); }}
            className="border border-input rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabs + count ── */}
      <div className="border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center px-6">
          <div className="flex overflow-x-auto flex-1">
            {TAB_ORDER.map(cat => (
              <button
                key={cat}
                onClick={() => handleTabChange(cat)}
                className={`px-3.5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === cat
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
                {!isLoading && (
                  <span className={`ml-1.5 text-xs ${activeTab === cat ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                    {tabCounts[cat]?.toLocaleString() ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
          {!isLoading && (
            <span className="text-xs text-muted-foreground flex-shrink-0 pl-4 whitespace-nowrap">
              {sortedFiltered.length.toLocaleString()} of {tabCounts[activeTab]?.toLocaleString() ?? 0} shown
            </span>
          )}
        </div>
      </div>

      {/* ── Content area (flex-1, fills between tabs and footer) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Cards column */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-20">Loading glossary data…</div>
          ) : loadError ? (
            <div className="text-sm text-destructive text-center py-20">Error loading data: {loadError}</div>
          ) : sortedFiltered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-20">No terms match your search.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {displayed.map(row => (
                  <TermCard
                    key={row.term}
                    row={row}
                    activeTab={activeTab}
                    isSelected={selected?.term === row.term}
                    onClick={() => setSelected(selected?.term === row.term ? null : row)}
                  />
                ))}
              </div>

              {!showAll && sortedFiltered.length > DISPLAY_LIMIT && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Showing {DISPLAY_LIMIT} of {sortedFiltered.length.toLocaleString()} terms.
                    {!search && " Use search to narrow down."}
                  </p>
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-sm border border-border rounded-md px-4 py-1.5 text-foreground hover:bg-accent transition-colors"
                  >
                    Show all {sortedFiltered.length.toLocaleString()}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-96 border-l border-border bg-card flex-shrink-0 overflow-hidden flex flex-col">
            <DetailPanel row={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

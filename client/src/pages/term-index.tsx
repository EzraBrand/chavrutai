import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { ExternalLink } from "lucide-react";
import { getTractateSlug } from "@shared/tractates";
import { getBookBySlug } from "@shared/bible-books";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlossaryRow {
  term: string;
  categories: string;
  variant_names: string;
  talmud_corpus_count: string;
  wikipedia_en: string;
  wikipedia_he: string;
  hebrew_term: string;
  wikidata_id: string;
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
  __wikidataUrl: string;
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
const DISPLAY_LIMIT = 20;

type SortOption = "count-desc" | "count-asc" | "alpha-asc" | "alpha-desc";
const SORT_LABELS: Record<SortOption, string> = {
  "count-desc": "Count ↓",
  "count-asc": "Count ↑",
  "alpha-asc": "A → Z",
  "alpha-desc": "Z → A",
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
  const wdId = (obj.wikidata_id || "").trim();
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
    __wikidataUrl: wdId && wdId.startsWith("Q") ? `https://www.wikidata.org/wiki/${wdId}` : "",
  };
}

// ── Link builder (mirrors search page logic) ──────────────────────────────────

function getPassageLink(result: SearchResult): string {
  const ref = result.ref;
  if (result.type === "talmud") {
    const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])(?::(\d+)(?:-\d+)?)?$/);
    if (match) {
      const tractate = getTractateSlug(match[1].trim());
      const folio = match[2];
      const side = match[3];
      const section = match[4];
      const anchor = section ? `#section-${section}` : "";
      return `/talmud/${tractate}/${folio}${side}${anchor}`;
    }
  } else if (result.type === "bible") {
    const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/);
    if (match) {
      const bookInfo = getBookBySlug(match[1].trim());
      const book = bookInfo ? bookInfo.slug : match[1].trim().replace(/\s+/g, "_");
      const chapter = match[2];
      const verse = match[3];
      const anchor = verse ? `#${verse}` : "";
      return `/bible/${book}/${chapter}${anchor}`;
    }
  }
  return `/search?q=${encodeURIComponent(ref)}&type=talmud`;
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
              <span dir="rtl" className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Assistant', sans-serif" }}>{row.hebrew_term}</span>
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
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Variants + count */}
        <div className="space-y-1">
          {row.__variants.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="text-muted-foreground/60">Also known as: </span>{row.__variants.join("; ")}
            </p>
          )}
          {row.__corpusCount > 0 && (
            <p className="text-sm font-medium text-foreground/80">
              {row.__corpusCount.toLocaleString()} occurrences in the Steinsaltz English corpus
            </p>
          )}
        </div>

        {/* Biography */}
        {isNames && (father || teacher || student || row.affiliation || row.date_of_birth || row.date_of_death) && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium mb-2.5">Biography</p>
            <div className="space-y-1.5 text-sm">
              {father && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Father</span>
                  <span className="text-foreground/80">{father}</span>
                </div>
              )}
              {teacher && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Teacher</span>
                  <span className="text-foreground/80">{teacher}</span>
                </div>
              )}
              {student && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Student</span>
                  <span className="text-foreground/80">{student}</span>
                </div>
              )}
              {row.affiliation && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Affiliation</span>
                  <span className="text-foreground/80">{row.affiliation}</span>
                </div>
              )}
              {row.date_of_birth && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Born</span>
                  <span className="text-foreground/80">{row.date_of_birth}{row.place_of_birth ? `, ${row.place_of_birth}` : ""}</span>
                </div>
              )}
              {row.date_of_death && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Died</span>
                  <span className="text-foreground/80">{row.date_of_death}{row.place_of_death ? `, ${row.place_of_death}` : ""}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Place geography */}
        {isPlace && row.affiliation && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium mb-2.5">Geography</p>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground/55 w-[5.5rem] flex-shrink-0 text-xs pt-px">Region</span>
              <span className="text-foreground/80">{row.affiliation}</span>
            </div>
          </div>
        )}

        {/* External links */}
        {(row.__wikiEnUrl || row.__wikiHeUrl || row.__wikidataUrl) && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium mb-2.5">External Links</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {row.__wikiEnUrl && (
                <a href={row.__wikiEnUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  Wikipedia (EN): {row.__wikiEnTitle}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {row.__wikiHeUrl && (
                <a href={row.__wikiHeUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  ויקיפדיה (HE): {row.__wikiHeTitle}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {row.__wikidataUrl && (
                <a href={row.__wikidataUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  Wikidata ({row.wikidata_id})
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Corpus passages */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium">
              Corpus passages
              {!searching && !searchError && (
                <span className="normal-case tracking-normal font-normal text-muted-foreground ml-1.5">
                  ({total.toLocaleString()} total)
                </span>
              )}
            </p>
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
                href={getPassageLink(result)}
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
      className={`group border rounded-lg p-3.5 cursor-pointer transition-all ${
        isSelected
          ? "border-foreground bg-muted/40 shadow-sm"
          : "border-border bg-card hover:border-muted-foreground/40 hover:shadow-sm hover:bg-accent/40"
      }`}
    >
      {/* Term + Hebrew + Variants */}
      <div>
        <span className="font-medium text-foreground text-sm leading-snug">{row.term}</span>
        {row.hebrew_term && (
          <div dir="rtl" className="text-sm font-semibold text-foreground mt-0.5" style={{ fontFamily: "'Assistant', sans-serif" }}>
            {row.hebrew_term}
          </div>
        )}
        {row.__variants.length > 0 && (
          <div className="text-xs text-muted-foreground/60 mt-0.5">
            also: {row.__variants.slice(0, 3).join("; ")}
            {row.__variants.length > 3 && ` +${row.__variants.length - 3}`}
          </div>
        )}
      </div>

      {/* Category badge for All tab */}
      {activeTab === "all" && row.__categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {row.__categories.slice(0, 2).map(c => (
            <span key={c} className="text-xs border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground/80">
              {CATEGORY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}

      {/* Biographical (names) */}
      {isNames && (father || teacher || student) && (
        <>
          <hr className="border-border/40 mt-2.5 mb-2" />
          <div className="space-y-0.5 text-xs">
            {father && (
              <div className="flex gap-3">
                <span className="text-muted-foreground/50 w-14 flex-shrink-0">Father</span>
                <span className="text-muted-foreground">{father}</span>
              </div>
            )}
            {teacher && (
              <div className="flex gap-3">
                <span className="text-muted-foreground/50 w-14 flex-shrink-0">Teacher</span>
                <span className="text-muted-foreground">{teacher}</span>
              </div>
            )}
            {student && (
              <div className="flex gap-3">
                <span className="text-muted-foreground/50 w-14 flex-shrink-0">Student</span>
                <span className="text-muted-foreground">{student}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Place */}
      {isPlace && row.affiliation && (
        <>
          <hr className="border-border/40 mt-2.5 mb-2" />
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground/50 w-14 flex-shrink-0">Region</span>
            <span className="text-muted-foreground">{row.affiliation}</span>
          </div>
        </>
      )}

      {/* Wikipedia links */}
      {(row.__wikiEnUrl || row.__wikiHeUrl) && (
        <>
          <hr className="border-border/40 mt-2.5 mb-2" />
          <div className="flex gap-3 flex-wrap">
            {row.__wikiEnUrl && (
              <a href={row.__wikiEnUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5"
                onClick={e => e.stopPropagation()}
              >Wikipedia EN<ExternalLink className="w-3 h-3" /></a>
            )}
            {row.__wikiHeUrl && (
              <a href={row.__wikiHeUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5"
                onClick={e => e.stopPropagation()}
              >ויקיפדיה HE<ExternalLink className="w-3 h-3" /></a>
            )}
          </div>
        </>
      )}

      {/* Click affordance */}
      {!isSelected && (
        <div className="mt-3 pt-2 border-t border-border/30 flex justify-between items-center">
          {row.__corpusCount > 0 ? (
            <span className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
              {row.__corpusCount.toLocaleString()} corpus passages
            </span>
          ) : <span />}
          <span className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
            View details ›
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TermIndexPage() {
  useSEO({
    title: "Talmud Glossary: Names, Places & Terms | ChavrutAI",
    description: "Searchable glossary of around 5,000 Talmudic and Biblical terms — rabbinic names, Aramaic place names, concepts, and nations. Includes Hebrew text, Wikipedia links, Wikidata, corpus counts, and biographical data (teachers, students, dates).",
    ogTitle: "Talmud Glossary: Names, Places & Terms | ChavrutAI",
    ogDescription: "Around 5,000 Talmudic and Biblical terms with Hebrew text, Wikipedia links, Wikidata, corpus counts, and biographical data from the Babylonian Talmud.",
    ogUrl: `${window.location.origin}/term-index`,
    canonical: `${window.location.origin}/term-index`,
    keywords: "Talmud glossary, Talmudic names, rabbinic names, Babylonian Talmud terms, Aramaic glossary, Hebrew glossary, Talmud place names, Talmud concepts, Amoraim, Tannaim, Wikidata Talmud, ChavrutAI",
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Talmudic Glossary — Names, Places & Key Terms",
      alternateName: "Talmud Term Index",
      description: "Structured glossary of 4,904 terms from the Babylonian Talmud: personal names (Amoraim, Tannaim), place names, Biblical figures, nations, and concepts. Includes Hebrew/Aramaic text, variant spellings, corpus occurrence counts in the Steinsaltz English translation, Wikipedia links, and Wikidata identifiers.",
      url: `${window.location.origin}/term-index`,
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
      inLanguage: ["en", "he"],
      version: "4",
      creator: {
        "@type": "Person",
        name: "Ezra Brand",
        url: "https://www.ezrabrand.com/",
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Thing",
        name: "Babylonian Talmud",
        sameAs: "https://en.wikipedia.org/wiki/Talmud",
      },
      keywords: [
        "Talmud", "Babylonian Talmud", "glossary", "rabbinic names",
        "Amoraim", "Tannaim", "place names", "Aramaic", "Hebrew",
        "Wikidata", "NLP", "corpus", "Steinsaltz",
      ],
      temporalCoverage: "0200/0600",
      spatialCoverage: {
        "@type": "Place",
        name: "Babylonia and the Land of Israel",
      },
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${window.location.origin}/api/glossary`,
          name: "Glossary JSON (columnar format, 4,904 entries)",
        },
      ],
      measurementTechnique: "Natural language processing on the Steinsaltz English Talmud corpus; entity linking via Wikidata",
    },
  });

  const [rawData, setRawData] = useState<GlossaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("names");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("count-desc");
  const [selected, setSelected] = useState<GlossaryRow | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [displayCount, setDisplayCount] = useState(DISPLAY_LIMIT);
  const [colCount, setColCount] = useState(1);
  const cardsRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 250);

  // Escape key closes the detail panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll while detail panel is open (prevents double scrollbar)
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  // Load from shared/data via API
  useEffect(() => {
    let cancelled = false;
    fetch("/api/glossary?v=4")
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

  // Track column count via ResizeObserver on the cards container
  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    const compute = (w: number) => {
      if (selected) return 1;
      if (w >= 1280) return 4;
      if (w >= 1024) return 3;
      if (w >= 640) return 2;
      return 1;
    };
    const obs = new ResizeObserver(([entry]) => setColCount(compute(entry.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, [selected]);

  // Group the current page of items into rows of colCount (virtualizer works on rows)
  const rows = useMemo<GlossaryRow[][]>(() => {
    const out: GlossaryRow[][] = [];
    // displayed is defined below — reference sortedFiltered + displayCount directly here
    const slice = sortedFiltered.slice(0, displayCount);
    for (let i = 0; i < slice.length; i += colCount) {
      out.push(slice.slice(i, i + colCount));
    }
    return out;
  }, [sortedFiltered, displayCount, colCount]);

  // Virtualizer over rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => cardsRef.current,
    estimateSize: () => 130,
    overscan: 4,
  });

  // Reset pagination and scroll to top whenever the result set changes
  useEffect(() => {
    setDisplayCount(DISPLAY_LIMIT);
    cardsRef.current?.scrollTo({ top: 0 });
  }, [activeTab, debouncedSearch, sort]);

  const displayed = sortedFiltered.slice(0, displayCount);
  const remaining = sortedFiltered.length - displayCount;

  const handleTabChange = useCallback((cat: string) => {
    setActiveTab(cat); setSelected(null);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
  }, []);

  return (
    <div className="min-h-screen md:h-screen bg-background flex flex-col md:overflow-hidden">
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
      <div className="border-b border-border px-6 py-4 flex-shrink-0 bg-card">
        <h1 className="text-xl font-semibold text-foreground">Index of Names, Places &amp; Key Terms in the Talmud</h1>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="mt-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {showInfo ? "▲" : "▼"} About this index
        </button>

        {showInfo && (
          <div className="mt-4 text-sm text-foreground leading-relaxed space-y-3 max-w-3xl border-t border-border/60 pt-4">
            <p className="text-muted-foreground italic">
              Note: This page is a work in progress. Data may be incomplete or contain errors.
            </p>
            <p>
              This is a structured glossary of 4,904 terms appearing in the Babylonian Talmud — personal names,
              place names, Biblical figures, nations, and key concepts. Each entry includes variant spellings,
              Hebrew/Aramaic text, occurrence counts in the Steinsaltz English Talmud corpus, and links to
              Wikipedia where available.
            </p>
            <p>
              Biographical data (teachers, students, father, dates, affiliation) is sourced from{" "}
              <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5">
                Wikidata <ExternalLink className="w-3 h-3" />
              </a>{" "}
              and is available for entries that have a corresponding Wikidata item (Q-ID). This data is
              community-maintained and may not be complete or fully accurate for all figures.
            </p>
            <p>
              Corpus occurrence counts reflect how often each term appears in the full Steinsaltz English
              translation as indexed in the ChavrutAI search corpus.
            </p>
            <p>
              <a
                href="https://www.ezrabrand.com/p/introducing-a-new-talmudic-glossary"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                Read a writeup on how an initial version of this glossary was built
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky controls: toolbar + tabs ── */}
      <div className="sticky top-[72px] z-40 flex flex-col flex-shrink-0 bg-background">

        {/* Toolbar (search + sort) */}
        <div className="px-6 py-2.5 border-b border-border/60 bg-muted flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <input
              type="search"
              placeholder="Search terms, Hebrew, variants…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="border border-input rounded-md pl-3 pr-7 py-1.5 text-sm w-full bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground text-foreground"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex-shrink-0">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="border border-input rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile category selector — hidden on md+ */}
        <div className="md:hidden border-b border-border/60 bg-muted flex items-center gap-2 px-4 py-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">Category:</span>
          <select
            value={activeTab}
            onChange={e => handleTabChange(e.target.value)}
            className="flex-1 border border-input rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {TAB_ORDER.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ?? cat}{!isLoading ? ` (${(tabCounts[cat] ?? 0).toLocaleString()})` : ""}
              </option>
            ))}
          </select>
        </div>
        {/* Mobile search result count — hidden on md+ */}
        {!isLoading && debouncedSearch && (
          <div className="md:hidden px-4 py-1.5 text-xs text-muted-foreground bg-muted border-b border-border/40">
            {sortedFiltered.length.toLocaleString()} result{sortedFiltered.length !== 1 ? "s" : ""} in {CATEGORY_LABELS[activeTab] ?? activeTab}
          </div>
        )}

      </div>

      {/* ── Content area (flex-1, fills between sticky controls and footer) ── */}
      <div className="flex-1 flex md:overflow-hidden min-h-0">

        {/* Category sidebar — desktop only */}
        <aside className="hidden md:flex flex-col flex-shrink-0 w-44 border-r border-border bg-card overflow-y-auto">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
            Category
          </div>
          {TAB_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => handleTabChange(cat)}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left border-l-2 transition-colors ${
                activeTab === cat
                  ? "border-foreground bg-muted font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{CATEGORY_LABELS[cat] ?? cat}</span>
              {!isLoading && (
                <span className="text-xs text-muted-foreground/60 tabular-nums ml-2">
                  {(tabCounts[cat] ?? 0).toLocaleString()}
                </span>
              )}
            </button>
          ))}
          {!isLoading && debouncedSearch && (
            <div className="px-4 py-2.5 mt-auto border-t border-border/60 text-xs text-muted-foreground">
              {sortedFiltered.length.toLocaleString()} result{sortedFiltered.length !== 1 ? "s" : ""}
            </div>
          )}
        </aside>

        {/* Cards column — virtualised */}
        <div ref={cardsRef} className="flex-1 overflow-y-auto p-5 min-w-0">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-20">Loading glossary data…</div>
          ) : loadError ? (
            <div className="text-sm text-destructive text-center py-20">Error loading data: {loadError}</div>
          ) : sortedFiltered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-20">No terms match your search.</div>
          ) : (
            <>
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => (
                  <div
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: "10px",
                    }}
                  >
                    <div className={`grid gap-2.5 ${colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-2" : colCount === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                      {rows[virtualRow.index]?.map(row => (
                        <TermCard
                          key={row.term}
                          row={row}
                          activeTab={activeTab}
                          isSelected={selected?.term === row.term}
                          onClick={() => setSelected(selected?.term === row.term ? null : row)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {remaining > 0 ? (
                <div className="mt-6 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Showing {displayed.length.toLocaleString()} of {sortedFiltered.length.toLocaleString()} terms.
                  </p>
                  <button
                    onClick={() => setDisplayCount(c => c + 20)}
                    className="text-sm border border-border rounded-md px-4 py-1.5 text-foreground hover:bg-accent transition-colors"
                  >
                    Show 20 more
                    <span className="text-muted-foreground ml-1.5">({remaining.toLocaleString()} remaining)</span>
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-4 mt-6 mb-4 mx-1">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {sortedFiltered.length.toLocaleString()} {sortedFiltered.length === 1 ? "term" : "terms"}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel — full-screen overlay on mobile, side panel on md+ */}
        {selected && (
          <div className="fixed inset-0 z-50 flex flex-col bg-card overflow-hidden md:relative md:inset-auto md:z-auto md:w-96 md:border-l md:border-border md:flex-shrink-0">
            <DetailPanel row={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

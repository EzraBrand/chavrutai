import { useState, useEffect, useMemo, useCallback } from "react";

const CSV_PATH = "/__mockup/glossary_v4.csv";
const DISPLAY_LIMIT = 120;
const SEARCH_API = "/api/search/text";

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
  hebrewRef?: string;
  text: string;
  highlight?: string;
  type: "talmud" | "bible" | "other";
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}

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

type SortOption = "count-desc" | "count-asc" | "alpha-asc" | "alpha-desc";
const SORT_LABELS: Record<SortOption, string> = {
  "count-desc": "Count: high to low",
  "count-asc": "Count: low to high",
  "alpha-asc": "A to Z",
  "alpha-desc": "Z to A",
};

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else { cell += ch; }
      continue;
    }
    if (ch === '"') { inQuotes = true; }
    else if (ch === ',') { row.push(cell); cell = ""; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== '\r') { cell += ch; }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, ""));
  return rows.slice(1).filter(r => r.length === headers.length).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || "").trim(); });
    return obj;
  });
}

function wikiTitleFromUrl(url: string): string {
  if (!url) return "";
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]).replace(/_/g, " ");
  } catch { return url; }
}

function buildRows(text: string): GlossaryRow[] {
  return parseCsv(text).map(r => {
    const cats = (r.categories || "").split(";").map(c => c.trim()).filter(Boolean);
    const variants = (r.variant_names || "").split(";").map(v => v.trim()).filter(Boolean);
    return {
      ...(r as unknown as GlossaryRow),
      __categories: cats,
      __corpusCount: parseInt(r.talmud_corpus_count || "0", 10) || 0,
      __wikiEnUrl: r.wikipedia_en || "",
      __wikiEnTitle: wikiTitleFromUrl(r.wikipedia_en),
      __wikiHeUrl: r.wikipedia_he || "",
      __wikiHeTitle: wikiTitleFromUrl(r.wikipedia_he),
      __variants: variants,
      __search: [r.term, r.variant_names, r.hebrew_term].join(" ").toLowerCase(),
    };
  });
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

function HighlightedText({ result }: { result: SearchResult }) {
  const raw = result.highlight || result.text;
  const parts = raw.split(/(<(?:em|mark)>[^<]*<\/(?:em|mark)>)/g);
  return (
    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
      {parts.map((part, i) => {
        if (/^<(em|mark)>/.test(part)) {
          const inner = part.replace(/<\/?(?:em|mark)>/g, "");
          return <mark key={i} style={{ background: "#fef08a", padding: "0 1px", borderRadius: 2, fontStyle: "normal" }}>{inner}</mark>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

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
    fetch(`${SEARCH_API}?${params}`)
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

  const fullSearchUrl = `/search?q=${encodeURIComponent(row.term)}&type=talmud`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
      {/* Panel header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 18, color: "#111" }}>{row.term}</span>
            {row.hebrew_term && (
              <span dir="rtl" style={{ fontSize: 16, color: "#555", fontFamily: "serif" }}>{row.hebrew_term}</span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {row.__categories.map(c => (
              <span key={c} style={{ fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, padding: "1px 6px", color: "#6b7280" }}>
                {CATEGORY_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: "2px 6px", lineHeight: 1 }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {/* Variants */}
        {row.__variants.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Also known as: </span>
            <span style={{ fontSize: 12, color: "#374151" }}>{row.__variants.join(", ")}</span>
          </div>
        )}

        {/* Corpus count */}
        {row.__corpusCount > 0 && (
          <div style={{ marginBottom: 14, fontSize: 13, color: "#6b7280" }}>
            {row.__corpusCount.toLocaleString()} occurrences in the Steinsaltz English corpus
          </div>
        )}

        {/* Biographical (names) */}
        {isNames && (father || teacher || student || row.affiliation || row.date_of_birth || row.place_of_birth) && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "#f9fafb", borderRadius: 6, fontSize: 13, lineHeight: 1.7 }}>
            {father && <div><span style={{ color: "#9ca3af" }}>Father: </span><span style={{ color: "#374151" }}>{father}</span></div>}
            {teacher && <div><span style={{ color: "#9ca3af" }}>Teacher: </span><span style={{ color: "#374151" }}>{teacher}</span></div>}
            {student && <div><span style={{ color: "#9ca3af" }}>Student: </span><span style={{ color: "#374151" }}>{student}</span></div>}
            {row.affiliation && <div><span style={{ color: "#9ca3af" }}>Affiliation: </span><span style={{ color: "#374151" }}>{row.affiliation}</span></div>}
            {row.date_of_birth && <div><span style={{ color: "#9ca3af" }}>Born: </span><span style={{ color: "#374151" }}>{row.date_of_birth}{row.place_of_birth ? `, ${row.place_of_birth}` : ""}</span></div>}
            {row.date_of_death && <div><span style={{ color: "#9ca3af" }}>Died: </span><span style={{ color: "#374151" }}>{row.date_of_death}{row.place_of_death ? `, ${row.place_of_death}` : ""}</span></div>}
          </div>
        )}

        {/* Place details */}
        {isPlace && row.affiliation && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "#f9fafb", borderRadius: 6, fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>Region: </span><span style={{ color: "#374151" }}>{row.affiliation}</span>
          </div>
        )}

        {/* Wikipedia links */}
        {(row.__wikiEnUrl || row.__wikiHeUrl) && (
          <div style={{ marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap" }}>
            {row.__wikiEnUrl && (
              <a href={row.__wikiEnUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                Wikipedia (EN): {row.__wikiEnTitle}
              </a>
            )}
            {row.__wikiHeUrl && (
              <a href={row.__wikiHeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                ויקיפדיה (HE): {row.__wikiHeTitle}
              </a>
            )}
          </div>
        )}

        {/* Search results */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
              Corpus passages
              {!searching && !searchError && <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}>({total.toLocaleString()} total)</span>}
            </span>
            <a
              href={fullSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              View all in search →
            </a>
          </div>

          {searching && (
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "20px 0" }}>Loading passages…</div>
          )}
          {searchError && (
            <div style={{ fontSize: 13, color: "#ef4444", padding: "10px 0" }}>Could not load passages.</div>
          )}
          {!searching && !searchError && results.length === 0 && (
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "10px 0" }}>No passages found.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((result, i) => (
              <a
                key={i}
                href={`/search?q=${encodeURIComponent(row.term)}&type=talmud`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px", textDecoration: "none", background: "#fff" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {result.type === "talmud" ? "Talmud" : result.type === "bible" ? "Bible" : "Other"}
                  {" · "}
                  <span style={{ textTransform: "none", letterSpacing: 0 }}>{result.ref}</span>
                </div>
                <HighlightedText result={result} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TabbedCards() {
  const [rawData, setRawData] = useState<GlossaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("names");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortOption>("count-desc");
  const [selected, setSelected] = useState<GlossaryRow | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    let cancelled = false;
    fetch(CSV_PATH)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => { if (!cancelled) { setRawData(buildRows(text)); setIsLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setIsLoading(false); } });
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

  const handleTabChange = useCallback((cat: string) => { setActiveTab(cat); setShowAll(false); setSelected(null); }, []);
  const handleSearch = useCallback((val: string) => { setSearch(val); setShowAll(false); }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "system-ui, sans-serif", background: "#fff" }}>
      {/* Left: main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #e5e7eb", padding: "20px 24px 16px", flexShrink: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>Index of Names, Places &amp; Key Terms</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            Glossary of Talmudic and Biblical terms with variants, corpus counts, and Wikipedia links.
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "10px 24px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search terms, Hebrew, variants…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "6px 12px", fontSize: 13, width: 220, background: "#fff", outline: "none", color: "#111" }}
          />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortOption); setShowAll(false); }}
              style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "6px 8px", fontSize: 13, background: "#fff", color: "#374151", outline: "none" }}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs + count */}
        <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 24px" }}>
            <div style={{ display: "flex", overflowX: "auto", flex: 1 }}>
              {TAB_ORDER.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleTabChange(cat)}
                  style={{
                    padding: "10px 14px", fontSize: 13, fontWeight: 500, border: "none", borderBottom: activeTab === cat ? "2px solid #111" : "2px solid transparent",
                    color: activeTab === cat ? "#111" : "#6b7280", background: "none", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                  {!isLoading && (
                    <span style={{ marginLeft: 5, fontSize: 11, color: activeTab === cat ? "#6b7280" : "#9ca3af" }}>
                      {tabCounts[cat]?.toLocaleString() ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {!isLoading && (
              <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0, paddingLeft: 16, whiteSpace: "nowrap" }}>
                {sortedFiltered.length.toLocaleString()} of {tabCounts[activeTab]?.toLocaleString() ?? 0} shown
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "80px 0", fontSize: 13, color: "#9ca3af" }}>Loading glossary data…</div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "80px 0", fontSize: 13, color: "#ef4444" }}>Error: {error}</div>
          ) : sortedFiltered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", fontSize: 13, color: "#9ca3af" }}>No terms match your search.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
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
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                    Showing {DISPLAY_LIMIT} of {sortedFiltered.length.toLocaleString()} terms.{!search && " Use search to narrow down."}
                  </p>
                  <button
                    onClick={() => setShowAll(true)}
                    style={{ fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, padding: "6px 16px", color: "#374151", background: "#fff", cursor: "pointer" }}
                  >
                    Show all {sortedFiltered.length.toLocaleString()}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div style={{
          width: 380, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column",
          flexShrink: 0, overflow: "hidden",
        }}>
          <DetailPanel row={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function TermCard({ row, activeTab, isSelected, onClick }: { row: GlossaryRow; activeTab: string; isSelected: boolean; onClick: () => void }) {
  const isNames = activeTab === "names";
  const isPlace = activeTab === "talmudToponyms" || activeTab === "biblicalPlaces";
  const teacher = cleanList(row.student_of);
  const student = cleanList(row.student);
  const father = cleanList(row.father);

  return (
    <div
      onClick={onClick}
      style={{
        border: isSelected ? "1px solid #374151" : "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "14px 14px 12px",
        background: isSelected ? "#f9fafb" : "#fff",
        cursor: "pointer",
        transition: "border-color 0.1s, box-shadow 0.1s",
        boxShadow: isSelected ? "0 0 0 1px #374151" : "none",
      }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#9ca3af"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; } }}
    >
      {/* Term + Hebrew */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <div>
          <span style={{ fontWeight: 500, fontSize: 15, color: "#111", lineHeight: 1.3 }}>{row.term}</span>
          {row.__variants.length > 0 && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              also: {row.__variants.slice(0, 3).join(", ")}{row.__variants.length > 3 ? ` +${row.__variants.length - 3}` : ""}
            </div>
          )}
        </div>
        {row.hebrew_term && (
          <span dir="rtl" style={{ fontSize: 14, color: "#6b7280", flexShrink: 0, lineHeight: 1.3, fontFamily: "serif" }}>{row.hebrew_term}</span>
        )}
      </div>

      {/* Corpus count */}
      {row.__corpusCount > 0 && (
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
          {row.__corpusCount.toLocaleString()} occurrences
        </div>
      )}

      {/* Biographical — names */}
      {isNames && (father || teacher || student) && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 4, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
          {father && <div><span style={{ color: "#9ca3af" }}>Father: </span>{father}</div>}
          {teacher && <div><span style={{ color: "#9ca3af" }}>Teacher: </span>{teacher}</div>}
          {student && <div><span style={{ color: "#9ca3af" }}>Student: </span>{student}</div>}
        </div>
      )}

      {/* Place */}
      {isPlace && row.affiliation && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 4, fontSize: 12, color: "#6b7280" }}>
          <span style={{ color: "#9ca3af" }}>Region: </span>{row.affiliation}
        </div>
      )}

      {/* Wikipedia links */}
      {(row.__wikiEnUrl || row.__wikiHeUrl) && (
        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {row.__wikiEnUrl && (
            <a
              href={row.__wikiEnUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              Wikipedia EN
            </a>
          )}
          {row.__wikiHeUrl && (
            <a
              href={row.__wikiHeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              ויקיפדיה HE
            </a>
          )}
        </div>
      )}
    </div>
  );
}

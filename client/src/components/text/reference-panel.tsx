import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ALL_BIBLE_BOOKS } from "@shared/bible-books";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import { usePreferences } from "@/context/preferences-context";

interface BibleCitation {
  book: string;
  chapter: number;
  verse: number;
  slug: string;
  fullRef: string;
}

interface VerseData {
  ref: string;
  hebrew: string;
  english: string;
  slug: string;
  chapter: number;
  verse: number;
}

interface TermOnPage {
  term: string;
  hebrew: string;
  category: HighlightCategory;
  desc: string;
  variants: string;
  corpusCount: number;
  pageCount: number;
  father?: string;
  studentOf?: string;
  affiliation?: string;
}

interface GlossaryEntry {
  term: string;
  categories: string;
  variant_names: string;
  talmud_corpus_count: string;
  hebrew_term: string;
  father: string;
  student_of: string;
  affiliation: string;
}

interface GlossaryData {
  fields: string[];
  rows: string[][];
}

interface ReferencePanelProps {
  englishSections: string[];
}

const BIBLE_NAME_TO_SLUG: Record<string, string> = {};
const BIBLE_NAME_TO_HEBREW: Record<string, string> = {};
for (const book of ALL_BIBLE_BOOKS) {
  BIBLE_NAME_TO_SLUG[book.name] = book.slug;
  BIBLE_NAME_TO_HEBREW[book.name] = book.hebrew;
}

const BIBLE_BOOK_NAMES_SORTED = ALL_BIBLE_BOOKS.map(b => b.name)
  .sort((a, b) => b.length - a.length);

const CITATION_REGEX = new RegExp(
  `(${BIBLE_BOOK_NAMES_SORTED.map(n => n.replace(/\s+/g, '\\s+')).join('|')})\\s+(\\d+):(\\d+)`,
  'g'
);

function extractCitations(sections: string[]): BibleCitation[] {
  const seen = new Set<string>();
  const citations: BibleCitation[] = [];

  for (const section of sections) {
    if (!section) continue;
    CITATION_REGEX.lastIndex = 0;
    let match;
    while ((match = CITATION_REGEX.exec(section)) !== null) {
      const book = match[1].replace(/\s+/g, ' ');
      const chapter = parseInt(match[2]);
      const verse = parseInt(match[3]);
      const key = `${book} ${chapter}:${verse}`;
      if (!seen.has(key)) {
        seen.add(key);
        citations.push({
          book,
          chapter,
          verse,
          slug: BIBLE_NAME_TO_SLUG[book] || book,
          fullRef: key,
        });
      }
    }
  }

  return citations;
}

function mapHighlightCategoryToGlossary(cat: string): HighlightCategory | null {
  if (cat === "concepts") return "concept";
  if (cat === "names" || cat === "biblical_names") return "name";
  if (cat === "biblical_places" || cat === "talmud_toponyms" || cat === "biblical_nations") return "place";
  return null;
}

export function ReferencePanel({ englishSections }: ReferencePanelProps) {
  const [panelTab, setPanelTab] = useState<"verses" | "terms" | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "concept" | "name" | "place">("all");
  const { preferences } = usePreferences();
  const highlightingEnabled = preferences.highlighting.enabled;
  const { data: gazetteerData } = useGazetteerData(highlightingEnabled);

  const citations = useMemo(() => extractCitations(englishSections), [englishSections]);

  const verseQueries = useQuery({
    queryKey: ['/api/bible/verses-batch', citations.map(c => c.fullRef).join(',')],
    queryFn: async (): Promise<VerseData[]> => {
      if (citations.length === 0) return [];

      const grouped: Record<string, { slug: string; chapter: number; verses: number[] }> = {};
      for (const c of citations) {
        const key = `${c.slug}/${c.chapter}`;
        if (!grouped[key]) {
          grouped[key] = { slug: c.slug, chapter: c.chapter, verses: [] };
        }
        grouped[key].verses.push(c.verse);
      }

      const results: VerseData[] = [];
      const entries = Object.values(grouped);

      await Promise.all(entries.map(async (group) => {
        try {
          const resp = await fetch(`/api/bible/text?book=${encodeURIComponent(group.slug)}&chapter=${group.chapter}`);
          if (!resp.ok) return;
          const data = await resp.json();

          const versesArr = data.verses || [];
          for (const v of group.verses) {
            const verseObj = versesArr.find((vv: any) => vv.verseNumber === v);
            if (verseObj) {
              const bookName = ALL_BIBLE_BOOKS.find(b => b.slug === group.slug)?.name || group.slug;
              const hebrewText = (verseObj.hebrewSegments || []).join(' ');
              const englishText = (verseObj.englishSegments || []).join(' ');
              if (hebrewText || englishText) {
                results.push({
                  ref: `${bookName} ${group.chapter}:${v}`,
                  hebrew: stripHtml(hebrewText),
                  english: stripHtml(englishText),
                  slug: group.slug,
                  chapter: group.chapter,
                  verse: v,
                });
              }
            }
          }
        } catch {
        }
      }));

      const order = citations.map(c => c.fullRef);
      results.sort((a, b) => order.indexOf(a.ref) - order.indexOf(b.ref));
      return results;
    },
    enabled: citations.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: glossaryData } = useQuery<GlossaryData>({
    queryKey: ['/api/glossary'],
    queryFn: async () => {
      const resp = await fetch('/api/glossary?v=4');
      return resp.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: highlightingEnabled,
  });

  const glossaryMap = useMemo(() => {
    if (!glossaryData?.rows) return new Map<string, GlossaryEntry>();
    const map = new Map<string, GlossaryEntry>();
    for (const row of glossaryData.rows) {
      const entry: GlossaryEntry = {
        term: row[0] || '',
        categories: row[1] || '',
        variant_names: row[2] || '',
        talmud_corpus_count: row[3] || '',
        hebrew_term: row[6] || '',
        father: row[8] || '',
        student_of: row[9] || '',
        affiliation: row[10] || '',
      };
      map.set(entry.term.toLowerCase(), entry);
    }
    return map;
  }, [glossaryData]);

  const termsOnPage = useMemo((): TermOnPage[] => {
    if (!gazetteerData || !preferences.highlighting.enabled) return [];

    const enabledCategories: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) enabledCategories.push('concept');
    if (preferences.highlighting.names) enabledCategories.push('name');
    if (preferences.highlighting.places) enabledCategories.push('place');
    if (enabledCategories.length === 0) return [];

    const highlighter = new TextHighlighter(gazetteerData);
    const termCounts = new Map<string, { count: number; category: HighlightCategory }>();

    for (const section of englishSections) {
      if (!section) continue;
      const matches = highlighter.findMatches(section, enabledCategories);
      for (const m of matches) {
        const key = m.term.toLowerCase();
        const existing = termCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          termCounts.set(key, { count: 1, category: m.category });
        }
      }
    }

    const result: TermOnPage[] = [];
    for (const [key, { count, category }] of termCounts) {
      const glossary = glossaryMap.get(key);
      result.push({
        term: glossary?.term || key,
        hebrew: glossary?.hebrew_term || '',
        category,
        desc: '',
        variants: glossary?.variant_names || '',
        corpusCount: parseInt(glossary?.talmud_corpus_count || '0') || 0,
        pageCount: count,
        father: glossary?.father,
        studentOf: glossary?.student_of,
        affiliation: glossary?.affiliation,
      });
    }

    result.sort((a, b) => b.pageCount - a.pageCount);
    return result;
  }, [englishSections, gazetteerData, glossaryMap, preferences.highlighting]);

  const filteredTerms = useMemo(() => {
    if (categoryFilter === "all") return termsOnPage;
    return termsOnPage.filter(t => t.category === categoryFilter);
  }, [termsOnPage, categoryFilter]);

  const termCategoryCounts = useMemo(() => {
    const counts = { name: 0, concept: 0, place: 0 };
    for (const t of termsOnPage) {
      counts[t.category]++;
    }
    return counts;
  }, [termsOnPage]);

  const verses = verseQueries.data || [];
  const versesLoading = verseQueries.isLoading;

  const hasVerses = citations.length > 0;
  const hasTerms = termsOnPage.length > 0;

  const activeTab = panelTab ?? (hasVerses ? "verses" : hasTerms ? "terms" : "verses");

  if (!hasVerses && !hasTerms) return null;

  return (
    <div className="mt-6 border-t border-border bg-card rounded-b-lg">
      {/* Panel Header with Tabs */}
      <div className="flex items-center justify-between px-4 sm:px-6 border-b border-border/50">
        <div className="flex gap-0">
          {hasVerses && (
            <button
              onClick={() => { setPanelTab("verses"); setPanelOpen(true); }}
              className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                activeTab === "verses" && panelOpen
                  ? "font-semibold text-[hsl(20,60%,35%)] border-[hsl(20,60%,35%)]"
                  : "font-normal text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Bible Verses ({citations.length})
            </button>
          )}
          {hasTerms && (
            <button
              onClick={() => { setPanelTab("terms"); setPanelOpen(true); }}
              className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                activeTab === "terms" && panelOpen
                  ? "font-semibold text-[hsl(20,60%,35%)] border-[hsl(20,60%,35%)]"
                  : "font-normal text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Key Terms (beta) ({termsOnPage.length})
            </button>
          )}
        </div>
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
        >
          {panelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel Content */}
      {panelOpen && (
        <div className="max-h-[380px] overflow-y-auto px-4 sm:px-6 py-4">
          {/* Bible Verses Tab */}
          {activeTab === "verses" && (
            <div className="space-y-3">
              {versesLoading && (
                <div className="text-sm text-muted-foreground text-center py-6">Loading verse text...</div>
              )}
              {!versesLoading && verses.length === 0 && citations.length > 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Could not load verse text.</div>
              )}
              {verses.map((verse, idx) => (
                <div key={idx} className="bg-background border border-border/60 rounded-md px-4 py-3">
                  <div className="flex items-baseline justify-between mb-2.5">
                    <span className="font-semibold text-sm text-[hsl(20,60%,35%)]">{verse.ref}</span>
                    <a
                      href={`/bible/${verse.slug}/${verse.chapter}#${verse.verse}`}
                      className="text-xs text-[hsl(207,70%,45%)] hover:underline"
                    >
                      Open in Bible Reader
                    </a>
                  </div>
                  <div className="flex gap-5">
                    <p className="flex-1 text-sm leading-relaxed text-foreground/85">{verse.english}</p>
                    <p className="text-base leading-loose font-bold text-foreground/90" dir="rtl" style={{ flex: '0.6' }}>{verse.hebrew}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key Terms Tab */}
          {activeTab === "terms" && (
            <div>
              {/* Category filters */}
              <div className="flex gap-2 mb-3">
                {(["all", "name", "concept", "place"] as const).map((cat) => {
                  const count = cat === "all" ? termsOnPage.length : termCategoryCounts[cat];
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        isActive
                          ? "bg-[hsl(20,60%,35%)] text-white border-[hsl(20,60%,35%)]"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                      }`}
                    >
                      {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1) + "s"} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Terms list */}
              <div className="border border-border/60 rounded-md overflow-hidden divide-y divide-border/40">
                {filteredTerms.map((term, idx) => (
                  <div key={idx} className="bg-background px-4 py-3">
                    <div className="flex items-baseline gap-2.5 mb-1">
                      <span className="font-semibold text-sm">{term.term}</span>
                      {term.hebrew && (
                        <span className="text-sm font-bold text-foreground/70" dir="rtl">{term.hebrew}</span>
                      )}
                      <span className={`text-[10px] uppercase tracking-wide px-1.5 py-px rounded ${getCategoryStyle(term.category)}`}>
                        {term.category}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {term.pageCount}× on page
                      </span>
                    </div>
                    {term.variants && (
                      <p className="text-xs text-muted-foreground">Also: {term.variants}</p>
                    )}
                    {term.studentOf && (
                      <p className="text-xs text-muted-foreground">
                        {term.studentOf && `Student of: ${term.studentOf}`}
                        {term.studentOf && term.affiliation && ' · '}
                        {term.affiliation && term.affiliation}
                      </p>
                    )}
                  </div>
                ))}
                {filteredTerms.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    No {categoryFilter === "all" ? "" : categoryFilter + " "}terms found on this page.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryStyle(category: HighlightCategory): string {
  switch (category) {
    case "concept": return "bg-blue-100/60 text-blue-800/80 dark:bg-blue-900/20 dark:text-blue-300/80";
    case "name": return "bg-yellow-100/60 text-yellow-800/80 dark:bg-yellow-900/20 dark:text-yellow-300/80";
    case "place": return "bg-green-100/60 text-green-800/80 dark:bg-green-900/20 dark:text-green-300/80";
    default: return "";
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

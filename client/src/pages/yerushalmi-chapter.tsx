import { useEffect, useMemo, useCallback, useState, useTransition } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink as ExternalLinkIcon, Link as LinkIcon, Check } from "lucide-react";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO } from "@/hooks/use-seo";
import { processHebrewText, processEnglishText, linkBibleCitations, replaceTerms } from "@/lib/text-processing";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import {
  normalizeYerushalmiTractateName,
  isValidYerushalmiTractate,
  getYerushalmiTractateInfo,
  getYerushalmiTractateSlug,
  YERUSHALMI_HEBREW_NAMES,
} from "@shared/yerushalmi-data";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

interface YerushalmiTextData {
  tractate: string;
  chapter: number;
  totalChapters: number;
  hebrewSections: string[];
  englishSections: string[];
  sefariaRef: string;
  halakhotCount: number;
  sectionRefs?: string[];
}

interface FootnoteEntry {
  num: string;
  noteHtml: string;
}

// Parse halakhah (H) and segment (S) from a sectionRef like "Jerusalem_Talmud_Berakhot.1.6.1"
function parseRef(ref: string | undefined): { h: number; s: number } | null {
  if (!ref) return null;
  const parts = ref.split('.');
  if (parts.length < 4) return null;
  const h = parseInt(parts[parts.length - 2], 10);
  const s = parseInt(parts[parts.length - 1], 10);
  if (isNaN(h) || isNaN(s)) return null;
  return { h, s };
}

function convertNoteLinks(html: string): string {
  return html
    // 1. Yerushalmi → /yerushalmi/{tractate}/{chapter}
    .replace(
      /href="\/Jerusalem_Talmud_([^."]+(?:_[^."]+)*)\.(\d+)[^"]*"/g,
      (_match, tractate, chapter) => `href="/yerushalmi/${tractate}/${chapter}"`
    )
    // 2. Bavli → /talmud/{tractate}/{daf}  (tractate names have no underscores)
    .replace(
      /href="\/([A-Z][a-zA-Z]+)\.(\d+[ab])[^"]*"/g,
      (_match, tractate, daf) => `href="/talmud/${tractate}/${daf}"`
    )
    // 3. Bible → /bible/{book}/{chapter}#verse  (book may have underscores: I_Samuel)
    .replace(
      /href="\/([A-Z][a-zA-Z_]*)\.(\d+)(?![ab])(?:\.(\d+)[\d\-]*)?[^"]*"/g,
      (_match, book, chapter, verse) => verse
        ? `href="/bible/${book}/${chapter}#${verse}"`
        : `href="/bible/${book}/${chapter}"`
    )
    // 4. Any remaining Sefaria relative links → absolute sefaria.org.il
    .replace(/href="(\/(?!(?:yerushalmi|talmud|bible)\/)[^"]+)"/g, (_match, path) => {
      return `href="https://www.sefaria.org.il${path}"`;
    });
}

function splitLineByColons(line: string): string[] {
  const parts = line.split(/(?<!\d): /);
  if (parts.length <= 1) return [line];
  return parts.map((part, i) => (i < parts.length - 1 ? part + ':' : part)).filter(s => s.trim());
}

function parseSectionFootnotes(html: string): { cleanedHtml: string; footnotes: FootnoteEntry[] } {
  const footnotes: FootnoteEntry[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild as HTMLElement;

    const sups = Array.from(container.querySelectorAll('sup.footnote-marker, sup[class*="footnote"]'));
    for (const sup of sups) {
      const num = sup.textContent?.trim() || '';
      let sibling = sup.nextSibling;
      while (sibling && sibling.nodeType === Node.TEXT_NODE && (sibling.textContent || '').trim() === '') {
        sibling = sibling.nextSibling;
      }
      if (
        sibling &&
        sibling.nodeName === 'I' &&
        (sibling as Element).classList.contains('footnote')
      ) {
        footnotes.push({ num, noteHtml: convertNoteLinks(replaceTerms((sibling as Element).innerHTML)) });
        sibling.remove();
      }
      const newSup = doc.createElement('sup');
      newSup.className = 'text-[10px] text-blue-500 cursor-pointer hover:text-blue-700 transition-colors';
      newSup.title = `Jump to note ${num}`;
      newSup.setAttribute('data-note-ref', num);
      newSup.textContent = num;
      sup.replaceWith(newSup);
    }

    return { cleanedHtml: container.innerHTML, footnotes };
  } catch {
    return { cleanedHtml: html, footnotes };
  }
}

export default function YerushalmiChapter() {
  const { tractate, chapter } = useParams<{ tractate: string; chapter: string }>();
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const tractateDisplayName = tractate ? normalizeYerushalmiTractateName(tractate) : null;
  const chapterNum = chapter ? parseInt(chapter, 10) : NaN;
  const tractateInfo = tractateDisplayName ? getYerushalmiTractateInfo(tractateDisplayName) : null;

  const isInvalidTractate = tractate && !isValidYerushalmiTractate(tractate);
  const isStrictChapter = chapter ? /^\d+$/.test(chapter) : false;
  const isInvalidChapter = !isStrictChapter || (tractateInfo && (isNaN(chapterNum) || chapterNum < 1 || chapterNum > tractateInfo.chapters));

  const hebrewName = tractateDisplayName ? (YERUSHALMI_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName) : "";
  const tractateSlug = tractateDisplayName ? getYerushalmiTractateSlug(tractateDisplayName) : "";

  useSEO({
    title: tractateDisplayName && !isNaN(chapterNum)
      ? `Jerusalem Talmud ${tractateDisplayName} Chapter ${chapterNum} - Hebrew & English | ChavrutAI`
      : "Jerusalem Talmud | ChavrutAI",
    description: tractateDisplayName && !isNaN(chapterNum)
      ? `Study Jerusalem Talmud ${tractateDisplayName} Chapter ${chapterNum} with parallel Hebrew-English text (Guggenheimer translation). Free on ChavrutAI.`
      : "Study the Jerusalem Talmud with Hebrew-English text on ChavrutAI.",
    canonical: tractateDisplayName && !isNaN(chapterNum)
      ? `${window.location.origin}/yerushalmi/${tractateSlug}/${chapterNum}`
      : `${window.location.origin}/yerushalmi`,
    robots: "index, follow",
  });

  const { data: gazetteerData } = useGazetteerData(preferences.highlighting.enabled);

  const enabledCategories = useMemo((): HighlightCategory[] => {
    if (!preferences.highlighting.enabled) return [];
    const cats: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) cats.push('concept');
    if (preferences.highlighting.names) cats.push('name');
    if (preferences.highlighting.places) cats.push('place');
    return cats;
  }, [preferences.highlighting.enabled, preferences.highlighting.concepts, preferences.highlighting.names, preferences.highlighting.places]);

  const highlighter = useMemo(() => {
    if (!gazetteerData || enabledCategories.length === 0) return null;
    return new TextHighlighter(gazetteerData);
  }, [gazetteerData, enabledCategories]);

  const [, startTransition] = useTransition();
  const [deferredCategories, setDeferredCategories] = useState<HighlightCategory[]>([]);

  useEffect(() => {
    if (enabledCategories.length === 0) {
      setDeferredCategories([]);
    } else {
      startTransition(() => setDeferredCategories(enabledCategories));
    }
  }, [enabledCategories]);

  const applyHighlighting = useCallback((inputText: string): string => {
    if (!highlighter || deferredCategories.length === 0) return inputText;
    try {
      return highlighter.applyHighlighting(inputText, deferredCategories);
    } catch {
      return inputText;
    }
  }, [highlighter, deferredCategories]);

  const { data: textData, isLoading, error, refetch } = useQuery<YerushalmiTextData>({
    queryKey: ['/api/yerushalmi', tractateSlug, chapterNum],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/yerushalmi/${encodeURIComponent(tractateSlug)}/${chapterNum}`);
      return response.json();
    },
    enabled: !isInvalidTractate && !isInvalidChapter && !!tractateDisplayName && !isNaN(chapterNum),
  });

  const processedSections = useMemo(() => {
    if (!textData) return [];
    const maxSections = Math.max(textData.hebrewSections.length, textData.englishSections.length);
    return Array.from({ length: maxSections }, (_, index) => {
      const hebrewSection = textData.hebrewSections[index] || '';
      const englishSection = textData.englishSections[index] || '';
      if (!hebrewSection.trim() && !englishSection.trim()) return null;

      const { cleanedHtml: rawCleanedHtml, footnotes: sectionFootnotes } = parseSectionFootnotes(englishSection);
      const cleanedHtml = convertNoteLinks(rawCleanedHtml);

      const englishLines = cleanedHtml.trim()
        ? processEnglishText(cleanedHtml).split('\n').flatMap((line: string) => splitLineByColons(line)).filter((line: string) => line.trim()).map((line: string) => applyHighlighting(linkBibleCitations(line.trim())))
        : [];

      const hebrewLines = hebrewSection.trim()
        ? processHebrewText(hebrewSection).split('\n').filter((line: string) => line.trim()).map((line: string) => applyHighlighting(line.trim()))
        : [];

      return { englishLines, sectionFootnotes, hebrewLines };
    });
  }, [textData, applyHighlighting]);

  // Group sections by halakhah using sectionRefs
  const halakhotGroups = useMemo(() => {
    const groups: Array<{
      h: number;
      items: Array<{ index: number; h: number; s: number; section: typeof processedSections[number] }>;
    }> = [];
    let currentH = -1;

    processedSections.forEach((section, index) => {
      const ref = parseRef(textData?.sectionRefs?.[index]);
      const h = ref?.h ?? 1;
      const s = ref?.s ?? (index + 1);

      if (h !== currentH) {
        groups.push({ h, items: [] });
        currentH = h;
      }
      groups[groups.length - 1].items.push({ index, h, s, section });
    });

    return groups;
  }, [processedSections, textData]);

  // Unique halakhot for jump bar — one entry per halakhah with its first anchor
  const halakhotJumpTargets = useMemo(() => {
    return halakhotGroups.map(({ h, items }) => ({
      h,
      anchor: items.length > 0 ? `${items[0].h}-${items[0].s}` : `${h}-1`,
    }));
  }, [halakhotGroups]);

  const handleLocationChange = (_newLocation: TalmudLocation) => {
    setLocation('/');
  };

  const toggleNotes = (sectionIndex: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  };

  const copySectionUrl = (h: number, s: number) => {
    const key = `${h}-${s}`;
    const url = `${window.location.origin}${window.location.pathname}#${key}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSection(key);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  // Scroll to hash anchor after data loads — supports both "#H-S" and legacy "#N"
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && /^#[\d]+([-][\d]+)?$/.test(hash)) {
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [textData]);

  if (isInvalidTractate || isInvalidChapter) {
    return <NotFound />;
  }

  if (!tractateDisplayName || isNaN(chapterNum)) {
    return <NotFound />;
  }

  const hasPrev = chapterNum > 1;
  const hasNext = tractateInfo ? chapterNum < tractateInfo.chapters : false;

  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasNext && (
                <Link href={`/yerushalmi/${tractateSlug}/${chapterNum + 1}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-2">
                    <ChevronLeft className="w-3 h-3" />
                    <span className="text-xs">Next ({chapterNum + 1})</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="text-center">
                <Link href={`/yerushalmi/${tractateSlug}`} className="text-sm font-semibold text-primary hover:underline">
                  {tractateDisplayName}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Chapter {chapterNum}{tractateInfo ? ` of ${tractateInfo.chapters}` : ''}
                </div>
                <div className="text-xs text-muted-foreground/70">Jerusalem Talmud</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasPrev && (
                <Link href={`/yerushalmi/${tractateSlug}/${chapterNum - 1}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-2">
                    <span className="text-xs">Previous ({chapterNum - 1})</span>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont} layout-${preferences.layout}`}>
        <h1 className="sr-only">Jerusalem Talmud {tractateDisplayName} Chapter {chapterNum}</h1>

        <BreadcrumbNavigation
          items={[
            { label: "Home", href: "/" },
            { label: "Jerusalem Talmud", href: "/yerushalmi" },
            { label: tractateDisplayName, href: `/yerushalmi/${tractateSlug}` },
            { label: `Chapter ${chapterNum}` },
          ]}
        />

        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load text. Please try again.
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4 mb-6">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        )}

        {textData && !isLoading && (
          <div className="space-y-6">
            {halakhotJumpTargets.length > 1 && (
              <>
                <p className="text-center text-xs text-muted-foreground mb-1">Jump to halakhah:</p>
                <div className="flex flex-wrap gap-2 justify-center py-3">
                  {halakhotJumpTargets.map(({ h, anchor }) => (
                    <a
                      key={h}
                      href={`#${anchor}`}
                      className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      title={`Jump to Halakhah ${h}`}
                    >
                      {h}
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'SUP' || !target.dataset.noteRef) return;
                  const num = target.dataset.noteRef;
                  const halakhahDiv = target.closest('[data-halakhah-index]') as HTMLElement | null;
                  if (!halakhahDiv) return;
                  const sectionIndex = parseInt(halakhahDiv.dataset.halakhahIndex || '0', 10);
                  setExpandedNotes(prev => new Set([...prev, sectionIndex]));
                  setTimeout(() => {
                    const noteEl = document.getElementById(`note-${sectionIndex}-${num}`);
                    if (noteEl) noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
              >
                {halakhotGroups.map(({ h, items }, groupIdx) => (
                  <div key={h}>
                    {/* Halakhah divider header */}
                    <div className={`flex items-center gap-3 ${groupIdx === 0 ? 'mb-6' : 'my-8'}`}>
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase px-3 py-1 rounded-full border border-border/60">
                        Halakhah {h}
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>

                    {/* Segments within this halakhah */}
                    <div className="space-y-8">
                      {items.map(({ index, h: itemH, s, section }) => {
                        const sectionRef = textData.sectionRefs?.[index];
                        const sefariaUrl = sectionRef
                          ? `https://www.sefaria.org.il/${sectionRef}`
                          : `https://www.sefaria.org.il/${textData.sefariaRef.replace(/ /g, '_')}`;
                        const sectionKey = `${itemH}-${s}`;

                        return (
                          <div
                            key={index}
                            id={sectionKey}
                            data-halakhah-index={index}
                            className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
                          >
                            <div className="flex items-center justify-center gap-3 mb-4">
                              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold font-mono">
                                {itemH}:{s}
                              </span>
                              <button
                                onClick={() => copySectionUrl(itemH, s)}
                                className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                                title={`Copy link to ${itemH}:${s}`}
                              >
                                {copiedSection === sectionKey ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span className="text-green-500 text-xs">Copied!</span>
                                  </>
                                ) : (
                                  <LinkIcon className="w-3 h-3" />
                                )}
                              </button>
                              <span className="w-px h-4 bg-border" />
                              <a
                                href={sefariaUrl}
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                                title={`View ${itemH}:${s} on Sefaria`}
                              >
                                Sefaria
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                            </div>

                            {!section ? (
                              <p className="text-center text-xs text-muted-foreground italic py-2">
                                Text not available for this segment.
                              </p>
                            ) : (
                              <>
                                <div className="yerushalmi-text-display text-display flex flex-col lg:flex-row gap-6">
                                  <div className="text-column space-y-3 lg:order-1">
                                    {section.englishLines.length > 0 ? (
                                      <div className="english-text text-foreground space-y-1.5">
                                        {section.englishLines.map((line, lineIndex) => (
                                          <div
                                            key={lineIndex}
                                            dangerouslySetInnerHTML={{ __html: line }}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">English translation not available.</p>
                                    )}
                                  </div>

                                  <div className="text-column space-y-3 lg:order-2">
                                    {section.hebrewLines.length > 0 ? (
                                      <div className={`hebrew-text text-foreground ${getHebrewFontClass()} space-y-3`}>
                                        {section.hebrewLines.map((line, lineIndex) => (
                                          <div key={lineIndex}>
                                            <p className="leading-relaxed">
                                              <span dangerouslySetInnerHTML={{ __html: line }} />
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic text-right" dir="rtl">טקסט עברי אינו זמין.</p>
                                    )}
                                  </div>
                                </div>

                                {section.sectionFootnotes.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-border/40">
                                    <button
                                      onClick={() => toggleNotes(index)}
                                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <span>{expandedNotes.has(index) ? '▼' : '▶'}</span>
                                      {expandedNotes.has(index)
                                        ? 'Hide notes'
                                        : `Notes (${section.sectionFootnotes.length})`}
                                    </button>
                                    {expandedNotes.has(index) && (
                                      <div className="mt-3 space-y-2 text-sm text-muted-foreground max-w-prose">
                                        {section.sectionFootnotes.map((fn, fnIdx) => (
                                          <div key={fnIdx} id={`note-${index}-${fn.num}`} className="flex gap-2 scroll-mt-24">
                                            <sup className="text-[10px] leading-5 flex-shrink-0 font-medium">{fn.num}</sup>
                                            <span dangerouslySetInnerHTML={{ __html: fn.noteHtml }} />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            {hasNext ? (
              <Link href={`/yerushalmi/${tractateSlug}/${chapterNum + 1}`}>
                <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
                  <ChevronLeft className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">
                    Next (Chapter {chapterNum + 1})
                  </span>
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {hasPrev ? (
              <Link href={`/yerushalmi/${tractateSlug}/${chapterNum - 1}`}>
                <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
                  <span className="text-primary font-medium">
                    Previous (Chapter {chapterNum - 1})
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

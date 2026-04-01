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
import { processRambamHebrewText, processRambamEnglishText, linkBibleCitations, replaceTerms } from "@/lib/text-processing";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import { getRambamHilchotInfo, isValidRambamHilchot } from "@shared/rambam-data";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";
import { getRambamSectionLinks, getRambamChapterLinks } from "@/lib/rambam-external-links";

interface RambamTextData {
  hilchot: string;
  chapter: number;
  totalChapters: number;
  hebrewSections: string[];
  englishSections: string[];
  sefariaRef: string;
  halachotCount: number;
}

interface FootnoteEntry {
  num: string;
  noteHtml: string;
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
        footnotes.push({ num, noteHtml: replaceTerms((sibling as Element).innerHTML) });
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

export default function RambamChapter() {
  const { hilchot, chapter } = useParams<{ hilchot: string; chapter: string }>();
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const [copiedSection, setCopiedSection] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const info = hilchot ? getRambamHilchotInfo(hilchot) : null;
  const chapterNum = chapter ? parseInt(chapter, 10) : NaN;

  const isInvalidHilchot = hilchot && !isValidRambamHilchot(hilchot);
  const isStrictChapter = chapter ? /^\d+$/.test(chapter) : false;
  const isInvalidChapter = !isStrictChapter || (info && (isNaN(chapterNum) || chapterNum < 1 || chapterNum > info.chapters));

  useSEO({
    title: info && !isNaN(chapterNum)
      ? `${info.displayName} Chapter ${chapterNum} - Mishneh Torah | ChavrutAI`
      : "Mishneh Torah | ChavrutAI",
    description: info && !isNaN(chapterNum)
      ? `Study Hilchot ${info.displayName} Chapter ${chapterNum} with parallel Hebrew-English text (Touger translation). Free on ChavrutAI.`
      : "Study the Mishneh Torah with Hebrew-English text on ChavrutAI.",
    canonical: info && !isNaN(chapterNum)
      ? `${window.location.origin}/rambam/${info.slug}/${chapterNum}`
      : `${window.location.origin}/rambam`,
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

  const { data: textData, isLoading, error, refetch } = useQuery<RambamTextData>({
    queryKey: ['/api/rambam', hilchot, chapterNum],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/rambam/${encodeURIComponent(hilchot!)}/${chapterNum}`);
      return response.json();
    },
    enabled: !isInvalidHilchot && !isInvalidChapter && !!info && !isNaN(chapterNum),
  });

  const processedSections = useMemo(() => {
    if (!textData) return [];
    const maxSections = Math.max(textData.hebrewSections.length, textData.englishSections.length);
    return Array.from({ length: maxSections }, (_, index) => {
      const hebrewSection = textData.hebrewSections[index] || '';
      const englishSection = textData.englishSections[index] || '';
      if (!hebrewSection.trim() && !englishSection.trim()) return null;

      const { cleanedHtml, footnotes: sectionFootnotes } = parseSectionFootnotes(englishSection);

      const englishLines = cleanedHtml.trim()
        ? processRambamEnglishText(cleanedHtml).split('\n').filter((line: string) => line.trim()).map((line: string) => applyHighlighting(linkBibleCitations(line.trim())))
        : [];

      const hebrewLines = hebrewSection.trim()
        ? processRambamHebrewText(hebrewSection).split('\n').filter((line: string) => line.trim()).map((line: string) => applyHighlighting(line.trim()))
        : [];

      return { englishLines, sectionFootnotes, hebrewLines };
    });
  }, [textData, applyHighlighting]);

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

  const copySectionUrl = (sectionNumber: number) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSection(sectionNumber);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && /^#\d+$/.test(hash)) {
      const num = parseInt(hash.slice(1), 10);
      setTimeout(() => {
        const el = document.getElementById(`${num}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [textData]);

  if (isInvalidHilchot || isInvalidChapter) {
    return <NotFound />;
  }

  if (!info || isNaN(chapterNum)) {
    return <NotFound />;
  }

  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < info.chapters;

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
                <Link href={`/rambam/${info.slug}/${chapterNum + 1}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-2">
                    <ChevronLeft className="w-3 h-3" />
                    <span className="text-xs">Next ({chapterNum + 1})</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="text-center">
                <Link href={`/rambam/${info.slug}`} className="text-sm font-semibold text-primary hover:underline">
                  {info.displayName}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Chapter {chapterNum} of {info.chapters}
                </div>
                <div className="text-xs text-muted-foreground/70">Mishneh Torah</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasPrev && (
                <Link href={`/rambam/${info.slug}/${chapterNum - 1}`}>
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
        <h1 className="sr-only">Mishneh Torah {info.displayName} Chapter {chapterNum}</h1>

        <BreadcrumbNavigation
          items={[
            { label: "Mishneh Torah", href: "/rambam" },
            { label: info.displayName, href: `/rambam/${info.slug}` },
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
            {processedSections.length > 1 && (
              <>
                <p className="text-center text-xs text-muted-foreground mb-1">Jump to halacha:</p>
                <div className="flex flex-wrap gap-2 justify-center py-3">
                  {processedSections.map((_, i) => (
                    <a
                      key={i + 1}
                      href={`#${i + 1}`}
                      className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      title={`Go to Halacha ${i + 1}`}
                    >
                      {i + 1}
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
                  const sectionDiv = target.closest('[data-section-index]') as HTMLElement | null;
                  if (!sectionDiv) return;
                  const sectionIndex = parseInt(sectionDiv.dataset.sectionIndex || '0', 10);
                  setExpandedNotes(prev => new Set([...prev, sectionIndex]));
                  setTimeout(() => {
                    const noteEl = document.getElementById(`note-${sectionIndex}-${num}`);
                    if (noteEl) noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
              >
                <div className="space-y-8">
                  {processedSections.map((section, index) => {
                    if (!section) return null;

                    const sefariaKey = textData.sefariaRef.replace(/ /g, '_');
                    const sefariaUrl = `https://www.sefaria.org/${sefariaKey}.${index + 1}`;
                    const sectionLinks = info ? getRambamSectionLinks(info.slug, chapterNum, index + 1) : [];

                    return (
                      <div
                        key={index}
                        id={`${index + 1}`}
                        data-section-index={index}
                        className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
                      >
                        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                            Halacha {index + 1}
                          </span>
                          <button
                            onClick={() => copySectionUrl(index + 1)}
                            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                            title={`Copy link to Halacha ${index + 1}`}
                          >
                            {copiedSection === index + 1 ? (
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
                            title={`View Halacha ${index + 1} on Sefaria`}
                          >
                            Sefaria
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                          {sectionLinks.map((link) => (
                            <a
                              key={link.name}
                              href={link.url}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                              title={link.description}
                            >
                              {link.name}
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          ))}
                        </div>

                        {!section ? (
                          <p className="text-center text-xs text-muted-foreground italic py-2">
                            Text not available for this halacha.
                          </p>
                        ) : (
                          <>
                            <div className="text-display rambam-text-display flex flex-col lg:flex-row gap-6">
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
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            {hasNext ? (
              <Link href={`/rambam/${info.slug}/${chapterNum + 1}`}>
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
              <Link href={`/rambam/${info.slug}/${chapterNum - 1}`}>
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

        {textData && info && (
          <div className="mt-8 pt-6 border-t border-border" data-testid="external-links-footer">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-lg font-semibold text-foreground">External Links:</span>
              {getRambamChapterLinks(info.slug, chapterNum).map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  title={link.description}
                >
                  {link.name}
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

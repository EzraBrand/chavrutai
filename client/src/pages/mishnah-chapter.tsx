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
import { formatEnglishText, processHebrewText, processEnglishText } from "@/lib/text-processing";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import {
  normalizeMishnahTractateName,
  isValidMishnahTractate,
  getMishnahTractateInfo,
  getMishnahTractateSlug,
  MISHNAH_ONLY_HEBREW_NAMES,
} from "@shared/tractates";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

interface MishnahTextData {
  tractate: string;
  chapter: number;
  totalChapters: number;
  hebrewSections: string[];
  englishSections: string[];
  sefariaRef: string;
  mishnayotCount: number;
}

export default function MishnahChapter() {
  const { tractate, chapter } = useParams<{ tractate: string; chapter: string }>();
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const [copiedSection, setCopiedSection] = useState<number | null>(null);

  const tractateDisplayName = tractate ? normalizeMishnahTractateName(tractate) : null;
  const chapterNum = chapter ? parseInt(chapter, 10) : NaN;
  const tractateInfo = tractateDisplayName ? getMishnahTractateInfo(tractateDisplayName) : null;

  const isInvalidTractate = tractate && !isValidMishnahTractate(tractate);
  const isStrictChapter = chapter ? /^\d+$/.test(chapter) : false;
  const isInvalidChapter = !isStrictChapter || (tractateInfo && (isNaN(chapterNum) || chapterNum < 1 || chapterNum > tractateInfo.chapters));

  const hebrewName = tractateDisplayName ? (MISHNAH_ONLY_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName) : "";
  const tractateSlug = tractateDisplayName ? getMishnahTractateSlug(tractateDisplayName) : "";

  useSEO({
    title: tractateDisplayName && !isNaN(chapterNum)
      ? `Mishnah ${tractateDisplayName} Chapter ${chapterNum} - Hebrew & English | ChavrutAI`
      : "Mishnah | ChavrutAI",
    description: tractateDisplayName && !isNaN(chapterNum)
      ? `Study Mishnah ${tractateDisplayName} Chapter ${chapterNum} with parallel Hebrew-English text. Free on ChavrutAI.`
      : "Study the Mishnah with Hebrew-English text on ChavrutAI.",
    canonical: tractateDisplayName && !isNaN(chapterNum)
      ? `${window.location.origin}/mishnah/${tractateSlug}/${chapterNum}`
      : `${window.location.origin}/mishnah`,
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

  const { data: textData, isLoading, error, refetch } = useQuery<MishnahTextData>({
    queryKey: ['/api/mishnah', tractateSlug, chapterNum],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/mishnah/${encodeURIComponent(tractateSlug)}/${chapterNum}`);
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

      const englishHtml = englishSection.trim()
        ? applyHighlighting(formatEnglishText(processEnglishText(englishSection)))
        : '';

      const hebrewLines = hebrewSection.trim()
        ? processHebrewText(hebrewSection).split('\n').filter((line: string) => line.trim()).map((line: string) => applyHighlighting(line.trim()))
        : [];

      return { englishHtml, hebrewLines };
    });
  }, [textData, applyHighlighting]);

  const handleLocationChange = (_newLocation: TalmudLocation) => {
    setLocation('/');
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

  if (isInvalidTractate || isInvalidChapter) {
    return <NotFound />;
  }

  if (!tractateDisplayName || isNaN(chapterNum)) {
    return <NotFound />;
  }

  const hasPrev = chapterNum > 1;
  const hasNext = tractateInfo ? chapterNum < tractateInfo.chapters : false;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
            </div>

            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="flex items-center gap-2">
                {hasPrev && (
                  <Link href={`/mishnah/${tractateSlug}/${chapterNum - 1}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <div className="text-center">
                  <Link href={`/mishnah/${tractateSlug}`} className="text-sm font-semibold text-primary hover:underline">
                    {tractateDisplayName}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Chapter {chapterNum}{tractateInfo ? ` of ${tractateInfo.chapters}` : ''}
                  </div>
                </div>
                {hasNext && (
                  <Link href={`/mishnah/${tractateSlug}/${chapterNum + 1}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont} layout-${preferences.layout}`}>
        <h1 className="sr-only">Mishnah {tractateDisplayName} Chapter {chapterNum}</h1>

        <BreadcrumbNavigation
          items={[
            { label: "Home", href: "/" },
            { label: "Mishnah", href: "/mishnah" },
            { label: tractateDisplayName, href: `/mishnah/${tractateSlug}` },
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
                <p className="text-center text-xs text-muted-foreground mb-1">Jump to mishnah:</p>
                <div className="flex flex-wrap gap-2 justify-center py-3">
                  {processedSections.map((_, i) => (
                    <a
                      key={i + 1}
                      href={`#${i + 1}`}
                      className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      title={`Go to Mishnah ${i + 1}`}
                    >
                      {i + 1}
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="space-y-8">
                {processedSections.map((section, index) => {
                  if (!section) return null;

                  const sefariaUrl = `https://www.sefaria.org/${textData.sefariaRef.replace(/ /g, '_')}.${index + 1}`;

                  return (
                    <div
                      key={index}
                      id={`${index + 1}`}
                      className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs text-muted-foreground font-medium">
                          Mishnah {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={sefariaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            title="View on Sefaria"
                          >
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                          <button
                            onClick={() => copySectionUrl(index + 1)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            title="Copy link to this mishnah"
                          >
                            {copiedSection === index + 1 ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <LinkIcon className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-display">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="lg:order-1 english-text">
                            <div
                              className="leading-relaxed text-foreground"
                              dangerouslySetInnerHTML={{ __html: section.englishHtml }}
                            />
                          </div>
                          <div className="lg:order-2 hebrew-text" dir="rtl">
                            <div className="leading-relaxed text-foreground font-hebrew">
                              {section.hebrewLines.map((line, lineIndex) => (
                                <p
                                  key={lineIndex}
                                  className="mb-1"
                                  dangerouslySetInnerHTML={{ __html: line }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            {hasPrev ? (
              <Link href={`/mishnah/${tractateSlug}/${chapterNum - 1}`}>
                <Button variant="outline" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Chapter {chapterNum - 1}
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {hasNext ? (
              <Link href={`/mishnah/${tractateSlug}/${chapterNum + 1}`}>
                <Button variant="outline" className="gap-2">
                  Chapter {chapterNum + 1}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <a
            href={`https://www.sefaria.org/${textData?.sefariaRef?.replace(/ /g, '_') || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            View on Sefaria <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>

        <Footer />
      </main>
    </div>
  );
}

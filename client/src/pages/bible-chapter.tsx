import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { BibleTextDisplay } from "@/components/bible/bible-text-display";
import { BibleExternalLinksFooter } from "@/components/bible/bible-external-links-footer";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO } from "@/hooks/use-seo";
import type { BibleLocation } from "@/types/bible";
import type { TalmudLocation } from "@/types/talmud";
import { bibleAPI } from "@/lib/bible-api";
import { getBaseUrl } from "@/lib/utils";
import NotFound from "@/pages/not-found";
import { getTractateSlug } from "@shared/tractates";

export default function BibleChapterPage() {
  const { book, chapter } = useParams<{ book: string; chapter: string }>();
  const [location, setLocation] = useLocation();
  const { preferences } = usePreferences();

  const parsedChapter = chapter ? parseInt(chapter) : 1;

  const bibleLocation: BibleLocation = {
    work: "Bible",
    book: book || "genesis",
    chapter: parsedChapter,
  };

  // Set up SEO - Format book title with proper title case
  const formatBookTitle = (slug: string): string => {
    if (!slug) return 'Genesis';
    const words = slug.split('-');
    return words
      .map((word, index) => {
        const lowerWord = word.toLowerCase();
        // Handle Roman numerals
        if (lowerWord === 'i' || lowerWord === 'ii' || lowerWord === 'iii') {
          return word.toUpperCase();
        }
        // Keep prepositions lowercase (except at start)
        if (index > 0 && (lowerWord === 'of' || lowerWord === 'the')) {
          return lowerWord;
        }
        // Handle regular words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };
  const bookTitle = formatBookTitle(book || 'genesis');
  const baseUrl = getBaseUrl();
  useSEO({
    title: `${bookTitle} ${parsedChapter} - Hebrew & English Bible | ChavrutAI`,
    description: `Read ${bookTitle} Chapter ${parsedChapter} with Hebrew and English text from JPS 1985 translation. Free access to the Bible online.`,
    ogTitle: `${bookTitle} ${parsedChapter} - Bible Study`,
    ogDescription: `Read ${bookTitle} Chapter ${parsedChapter} with parallel Hebrew-English text.`,
    ogUrl: `${baseUrl}/bible/${book}/${chapter}`,
    canonical: `${baseUrl}/bible/${book}/${chapter}`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${bookTitle} Chapter ${parsedChapter}`,
      description: `${bookTitle} Chapter ${parsedChapter} with Hebrew and English text from JPS 1985 translation`,
      url: `${baseUrl}/bible/${book}/${chapter}`,
      inLanguage: ["he", "en"],
      author: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: baseUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/favicon-192x192.png`,
        },
      },
      isPartOf: {
        "@type": "Book",
        name: "Hebrew Bible",
        alternateName: "Tanach",
        inLanguage: ["he", "en"],
      },
    },
  });

  // Fetch Bible text
  const {
    data: text,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/bible/text', bibleLocation.book, bibleLocation.chapter],
    queryFn: () => bibleAPI.getText(bibleLocation),
  });

  // Fetch chapter count for navigation
  const { data: chapters } = useQuery({
    queryKey: ['/api/bible/chapters', bibleLocation.book],
    queryFn: () => bibleAPI.getChapters(bibleLocation.book),
  });

  const maxChapter = chapters?.length || 50;
  const canGoPrev = parsedChapter > 1;
  const canGoNext = parsedChapter < maxChapter;

  const handlePrevChapter = () => {
    if (canGoPrev) {
      setLocation(`/bible/${book}/${parsedChapter - 1}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (canGoNext) {
      setLocation(`/bible/${book}/${parsedChapter + 1}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler for hamburger menu navigation (Bible doesn't use same navigation structure as Talmud)
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to Talmud tractate
    const tractateSlug = getTractateSlug(newLocation.tractate);
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/talmud/${tractateSlug}/${folioSlug}`;
  };

  if (!book || !chapter) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left Section: Hamburger Menu + Next Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextChapter}
                disabled={!canGoNext}
                className="flex items-center gap-1 px-2 py-2"
                data-testid="button-next-chapter-header"
              >
                <ChevronLeft className="w-3 h-3" />
                <span className="text-xs">Next ({parsedChapter + 1})</span>
              </Button>
            </div>

            {/* Center Section: Title */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <h1 className="text-xl font-semibold truncate" data-testid="text-chapter-title">
                {bookTitle} {parsedChapter}
              </h1>
            </div>

            {/* Right Section: Previous Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevChapter}
                disabled={!canGoPrev}
                className="flex items-center gap-1 px-2 py-2"
                data-testid="button-prev-chapter-header"
              >
                <span className="text-xs">Previous ({parsedChapter - 1})</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-3xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont} layout-${preferences.layout}`}>

        {/* Breadcrumb: Home > Bible > Book > Chapter N */}
        <BreadcrumbNavigation items={breadcrumbHelpers.bibleChapter(bookTitle, book || 'genesis', parsedChapter)} />

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Bible text. Please try again.
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 mb-6">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        )}

        {/* Bible Text */}
        {text && !isLoading && (
          <div className="space-y-6">
            {/* Verse numeral links */}
            {text.verses && text.verses.length > 1 && (
              <>
              <p className="text-center text-xs text-muted-foreground mb-1">Jump to verse:</p>
              <div className="flex flex-wrap gap-2 justify-center py-3">
                {text.verses.map((verse) => (
                  <a
                    key={verse.verseNumber}
                    href={`#verse-${verse.verseNumber}`}
                    className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                    title={`Go to verse ${verse.verseNumber}`}
                  >
                    {verse.verseNumber}
                  </a>
                ))}
              </div>
              </>
            )}
            <BibleTextDisplay text={text} />
          </div>
        )}

        {/* External Links Footer */}
        {text && !isLoading && book && (
          <BibleExternalLinksFooter book={book} chapter={parsedChapter} />
        )}

        {/* Chapter Navigation */}
        {text && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              {/* Next button on left (matching Talmud layout) */}
              <Button
                variant="outline"
                onClick={handleNextChapter}
                disabled={!canGoNext}
                data-testid="button-next-chapter"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Next ({parsedChapter + 1})
              </Button>

              <span className="text-sm text-muted-foreground">
                Chapter {parsedChapter} of {maxChapter}
              </span>

              {/* Previous button on right (matching Talmud layout) */}
              <Button
                variant="outline"
                onClick={handlePrevChapter}
                disabled={!canGoPrev}
                data-testid="button-prev-chapter"
              >
                Previous ({parsedChapter - 1})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}

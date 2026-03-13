import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { bibleAPI } from "@/lib/bible-api";
import { getBaseUrl } from "@/lib/utils";
import NotFound from "@/pages/not-found";

export default function BibleBookPage() {
  const { book } = useParams<{ book: string }>();
  const [, setLocation] = useLocation();

  // Fetch book info and chapters
  const { data: booksData } = useQuery({
    queryKey: ['/api/bible/books'],
    queryFn: () => bibleAPI.getBooks()
  });

  const { data: chapters } = useQuery({
    queryKey: ['/api/bible/chapters', book],
    queryFn: () => bibleAPI.getChapters(book || ''),
    enabled: !!book,
  });

  // Find the book details
  const bookInfo = booksData?.books.find((b: any) => b.slug === book);

  // Set up SEO
  const bookTitle = bookInfo?.name || (book ? book.charAt(0).toUpperCase() + book.slice(1).replace(/-/g, ' ') : 'Bible');
  const baseUrl = getBaseUrl();
  useSEO({
    title: `${bookTitle} - Hebrew & English Bible | ChavrutAI`,
    description: `Read all ${chapters?.length || ''} chapters of ${bookTitle} with Hebrew and English text from the Koren Jerusalem Bible. Free access to the Bible online.`,
    ogTitle: `${bookTitle} - Bible Study`,
    ogDescription: `Read all chapters of ${bookTitle} with parallel Hebrew-English text.`,
    ogUrl: `${baseUrl}/bible/${book}`,
    canonical: `${baseUrl}/bible/${book}`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${bookTitle} - Hebrew Bible`,
      description: `All chapters of ${bookTitle} with Hebrew and English text from the Koren Jerusalem Bible`,
      url: `${baseUrl}/bible/${book}`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: baseUrl,
      },
      about: {
        "@type": "Book",
        name: bookTitle,
        inLanguage: ["he", "en"],
        isPartOf: {
          "@type": "Book",
          name: "Hebrew Bible",
          alternateName: "Tanach",
        },
      },
    },
  });

  if (!book || !bookInfo) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/bible">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-back-to-bible"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Bible
              </Button>
            </Link>

            <h1 className="text-xl font-semibold text-primary">ChavrutAI</h1>

            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb: Home > Bible > Book */}
        <BreadcrumbNavigation items={breadcrumbHelpers.bibleBook(bookTitle, book)} />

        {/* Book Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2" data-testid="text-book-title">
            {bookInfo.name}
          </h1>
          <h2 className="text-3xl text-primary/80 mb-4 hebrew-font-noto-sans-hebrew" dir="rtl">
            {bookInfo.hebrew}
          </h2>
          <p className="text-xl text-muted-foreground">
            {chapters?.length || 0} Chapters
          </p>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl text-primary mb-2">
                  All Chapters
                </h3>
              </div>

              {/* Chapter buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 justify-items-center">
                {chapters?.map((chapterNum: number) => (
                  <Link
                    key={chapterNum}
                    href={`/bible/${book}/${chapterNum}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-2 text-base font-normal w-full min-w-[3rem] max-w-[4rem] hover:bg-primary hover:text-primary-foreground"
                      data-testid={`button-chapter-${chapterNum}`}
                    >
                      {chapterNum}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

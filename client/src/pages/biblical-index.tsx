import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getBiblicalIndexMetadata } from "@/lib/biblical-index-data";
import { Footer } from "@/components/footer";
import { FooterPlaceholder } from "@/components/page-loading";
import { useSEO } from "@/hooks/use-seo";
import { Skeleton } from "@/components/ui/skeleton";

const categoryDescriptions = {
  torah: "Torah (The Five Books of Moses)",
  neviim: "Nevi'im (The Prophets)",
  ketuvim: "Ketuvim (The Writings)"
};

export default function BiblicalIndexPage() {
  useSEO({
    title: "Biblical Citations in the Talmud - Complete Index | ChavrutAI",
    description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
    ogTitle: "Biblical Citations in the Talmud - Complete Index",
    ogDescription: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
    canonical: `${window.location.origin}/biblical-index`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Biblical Citations in the Talmud",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud",
      url: `${window.location.origin}/biblical-index`,
      license: "https://opensource.org/licenses/MIT",
      creator: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  const { data: metadata, isLoading } = useQuery({
    queryKey: ['biblical-index-metadata'],
    queryFn: getBiblicalIndexMetadata,
  });

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <a 
            href="/"
            className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
            data-testid="header-logo-link"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="/hebrew-book-icon.png" 
                alt="ChavrutAI Logo" 
                className="w-10 h-10 object-cover"
              />
            </div>
            <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
          </a>
        </div>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <FooterPlaceholder />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-2xl font-bold mb-4">Error Loading Index</h1>
          <p>Unable to load the biblical index metadata.</p>
        </div>
      </div>
    );
  }

  const getDisplayName = (bookName: string): string => {
    const cleanName = bookName.toLowerCase().replace(/ /g, '_');
    const bookInfo = metadata.books.find(
      b => b.filename === `${cleanName}.json` || b.displayName.toLowerCase() === bookName.toLowerCase()
    );
    return bookInfo?.displayName || bookName.replace(/_/g, ' ');
  };

  const getBookUrl = (bookName: string): string => {
    return bookName.toLowerCase().replace(/ /g, '_');
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="page-title">
            Biblical Citations in the Talmud
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            A comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud
          </p>
          <p className="text-base text-muted-foreground">
            For more about this, see{" "}
            <a 
              href="https://www.ezrabrand.com/p/biblical-citations-in-the-talmud" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              data-testid="link-article"
            >
              Biblical Citations in the Talmud: A New Digital Index and Concordance
            </a>{" "}
            (Sep 21, 2025)
          </p>
        </div>

        <div className="mb-8 prose prose-sm dark:prose-invert max-w-none">
          <h2>About This Index</h2>
          <p>
            This digital index provides a comprehensive mapping of biblical citations found throughout 
            the Babylonian Talmud. Each entry includes the biblical verse, its location in the Talmud, 
            and the complete context surrounding the citation.
          </p>
          
          <h3>Features</h3>
          <ul>
            <li>Direct hyperlinks to the original Talmudic passages on ChavrutAI</li>
            <li>Full contextual quotations for each citation</li>
            <li>Organized by biblical book and chapter</li>
            <li>Searchable and browseable interface</li>
          </ul>
        </div>

        <div className="space-y-8">
          {Object.entries(metadata.categories).map(([category, books]) => {
            return (
              <div key={category} className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-3xl font-bold mb-2">
                    {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {(books as string[])
                    .filter(book => book !== 'Song of Songs')
                    .map((book: string) => (
                    <Link
                      key={book}
                      href={`/biblical-index/book/${getBookUrl(book)}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline underline-offset-2 transition-colors py-2 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-transparent"
                      data-testid={`link-book-${getBookUrl(book)}`}
                    >
                      {getDisplayName(book)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

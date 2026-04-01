import { useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { RAMBAM_BOOKS } from "@shared/rambam-data";

export default function RambamContents() {
  // Scroll to the book anchor when navigating here from another page (e.g. breadcrumb links)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  useSEO({
    title: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
    description: "Study the Mishneh Torah (Rambam) online with bilingual Hebrew-English text. All 83 Hilchot across 14 books, with the Touger English translation via Sefaria.",
    canonical: `${window.location.origin}/rambam`,
    ogTitle: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
    ogDescription: "Study the Mishneh Torah (Rambam) with bilingual Hebrew-English text on ChavrutAI.",
    robots: "index, follow",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
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

      <div className="max-w-4xl mx-auto px-4 py-4">
        <BreadcrumbNavigation
          items={[
            { label: "Mishneh Torah" },
          ]}
        />

        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-primary mb-1">Study Mishneh Torah Online</h1>
          <h2 className="text-xl text-primary/80 mb-2 font-hebrew">משנה תורה - Mishneh Torah</h2>
          <p className="text-base text-muted-foreground">
            All 83 Hilchot across 14 books, with bilingual Hebrew-English text
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            English translation by Rabbi Eliyahu Touger (Moznaim) via{' '}
            <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Sefaria</a>.{' '}
            Hebrew text: Mechon Mamre.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-center text-xs text-muted-foreground mb-2">Jump to Sefer:</p>
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {RAMBAM_BOOKS.map((book) => (
              <a
                key={book.name}
                href={`#${book.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center justify-center min-h-[2.25rem] px-3 py-1 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                {book.name.replace(/^Sefer\s+/, '')}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {RAMBAM_BOOKS.map((book) => (
            <div key={book.name} id={book.name.toLowerCase().replace(/\s+/g, '-')} className="space-y-2">
              <div className="text-center border-b border-border pb-2">
                <h3 className="text-xl font-semibold text-primary">{book.name}</h3>
                <p className="text-base text-primary/70 font-hebrew">{book.hebrewName}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {book.hilchot.map((hilchot) => (
                  <Link key={hilchot.slug} href={`/rambam/${hilchot.slug}`}>
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
                      <div className="p-3">
                        <div className="text-primary font-medium text-sm leading-snug">{hilchot.displayName}</div>
                        <div className="text-sm text-primary/70 font-hebrew mt-0.5">
                          {hilchot.hebrewName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {hilchot.chapters} chapters
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

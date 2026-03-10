import { useRoute, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChapterData } from "@/lib/chapter-data";
import { generateFolioButtons } from "@/lib/folio-utils";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import {
  TRACTATE_HEBREW_NAMES,
  normalizeDisplayTractateName,
  isValidTractate,
  getTractateSlug,
} from "@shared/tractates";
import { getMaxFolio } from "@shared/talmud-navigation";
import { getMishnahSection } from "@shared/mishnah-map";
import NotFound from "@/pages/not-found";

export default function TractateContents() {
  const [match, params] = useRoute("/talmud/:tractate");
  const tractate = params?.tractate || "";
  const tractateDisplayName = normalizeDisplayTractateName(tractate);

  // Set up SEO
  useSEO(generateSEOData.tractatePage(tractateDisplayName));

  const tractateChapters = useChapterData(tractate.toLowerCase().replace(/\s+/g, ' '));

  if (!match) {
    return <div>Tractate not found</div>;
  }

  // Validate tractate name and show 404 if invalid
  if (tractate && !isValidTractate(tractate)) {
    return <NotFound />;
  }

  const maxFolio = getMaxFolio(tractateDisplayName);
  // Convert tractate name to proper case for Hebrew name lookup
  const properCaseTractate = tractateDisplayName;
  const hebrewName =
    TRACTATE_HEBREW_NAMES[
      properCaseTractate as keyof typeof TRACTATE_HEBREW_NAMES
    ] || tractate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/hebrew-book-icon.png"
                  alt="ChavrutAI Logo"
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">
                ChavrutAI
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb: Home > Talmud > Tractate */}
        <BreadcrumbNavigation items={breadcrumbHelpers.tractateContents(tractateDisplayName)} />


        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">
            {tractateDisplayName}
          </h1>
          <h2 className="text-3xl text-primary/80 mb-4 font-hebrew">
            {hebrewName}
          </h2>
          <p className="text-xl text-muted-foreground">
            {tractateChapters?.length || 0} Chapters • {maxFolio} Folios
          </p>
        </div>

        {/* Chapter Cards Grid */}
        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          {tractateChapters?.map((chapter) => {
            const folios = generateFolioButtons(
              chapter.startFolio,
              chapter.startSide,
              chapter.endFolio,
              chapter.endSide
            );

            return (
              <Card
                key={chapter.number}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl text-primary mb-2">
                      Chapter {chapter.number}: <span className="italic">{chapter.englishName}</span>{' '}
                      <span className="font-hebrew">({chapter.hebrewName})</span>
                    </h3>
                  </div>

                  {/* Folio buttons */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 justify-items-center">
                    {folios.map((folio, index) => {
                      const isFirstPage = index === 0;
                      const mishnahSection = isFirstPage 
                        ? getMishnahSection(tractateDisplayName, chapter.number, folio.label)
                        : null;
                      
                      const sectionAnchor = mishnahSection ? `#section-${mishnahSection}` : '';
                      
                      return (
                        <Link
                          key={`${folio.folio}${folio.side}`}
                          href={`/talmud/${getTractateSlug(tractateDisplayName)}/${folio.folio}${folio.side}${sectionAnchor}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-2 text-base font-normal w-full min-w-[3rem] max-w-[4rem] hover:bg-primary hover:text-primary-foreground"
                          >
                            {folio.label}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
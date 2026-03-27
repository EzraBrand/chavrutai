import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  YERUSHALMI_HEBREW_NAMES,
  normalizeYerushalmiTractateName,
  isValidYerushalmiTractate,
  getYerushalmiTractateInfo,
  getYerushalmiTractateSlug,
} from "@shared/yerushalmi-data";
import NotFound from "@/pages/not-found";

export default function YerushalmiTractate() {
  const [match, params] = useRoute("/yerushalmi/:tractate");
  const tractateParam = params?.tractate || "";
  const tractateDisplayName = normalizeYerushalmiTractateName(tractateParam);

  const tractateInfo = tractateDisplayName ? getYerushalmiTractateInfo(tractateDisplayName) : null;
  const tractateSlug = tractateDisplayName ? getYerushalmiTractateSlug(tractateDisplayName) : "";

  useSEO({
    title: tractateDisplayName
      ? `Jerusalem Talmud ${tractateDisplayName} - Hebrew & English | ChavrutAI`
      : "Jerusalem Talmud | ChavrutAI",
    description: tractateDisplayName
      ? `Study Jerusalem Talmud ${tractateDisplayName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation). Free online on ChavrutAI.`
      : "Study the Jerusalem Talmud with Hebrew-English text on ChavrutAI.",
    canonical: tractateDisplayName
      ? `${window.location.origin}/yerushalmi/${tractateSlug}`
      : `${window.location.origin}/yerushalmi`,
    robots: "index, follow",
  });

  if (!match || !isValidYerushalmiTractate(tractateParam)) {
    return <NotFound />;
  }

  if (!tractateInfo || !tractateDisplayName) {
    return <NotFound />;
  }

  const hebrewName = YERUSHALMI_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-10 h-10 object-cover" />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <BreadcrumbNavigation
          items={[
            { label: "Home", href: "/" },
            { label: "Jerusalem Talmud", href: "/yerushalmi" },
            { label: tractateDisplayName },
          ]}
        />

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">
            {tractateDisplayName}
          </h1>
          <h2 className="text-3xl text-primary/80 mb-4 font-hebrew">{hebrewName}</h2>
          <p className="text-xl text-muted-foreground">
            {tractateInfo.chapters} Chapters
          </p>
          <p className="text-sm text-muted-foreground mt-1">Jerusalem Talmud (Yerushalmi)</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          {Array.from({ length: tractateInfo.chapters }, (_, i) => i + 1).map((chapterNum) => (
            <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl text-primary mb-2">
                    Chapter {chapterNum}
                  </h3>
                </div>
                <div>
                  <Link href={`/yerushalmi/${tractateSlug}/${chapterNum}`}>
                    <Button
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      Read Chapter {chapterNum}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

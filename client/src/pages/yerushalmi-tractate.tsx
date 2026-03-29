import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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

  const { data: shapeData } = useQuery<{ shapes: number[][] }>({
    queryKey: ["/api/yerushalmi", tractateParam, "shape"],
    queryFn: () => fetch(`/api/yerushalmi/${tractateParam}/shape`).then(r => r.json()),
    enabled: !!tractateParam && !!tractateDisplayName,
    staleTime: Infinity,
  });

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
  const shapes: number[][] = shapeData?.shapes ?? [];

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
          {Array.from({ length: tractateInfo.chapters }, (_, i) => i + 1).map((chapterNum) => {
            const chapterShape: number[] = shapes[chapterNum - 1] ?? [];
            const halakhotCount = chapterShape.length;

            return (
              <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl text-primary mb-1">
                      <Link href={`/yerushalmi/${tractateSlug}/${chapterNum}`} className="hover:underline">
                        Chapter {chapterNum}
                      </Link>
                    </h3>
                    {halakhotCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {halakhotCount} {halakhotCount === 1 ? "halakhah" : "halakhot"}
                      </p>
                    )}
                  </div>

                  {halakhotCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {chapterShape.map((_, halIdx) => (
                        <Link
                          key={halIdx}
                          href={`/yerushalmi/${tractateSlug}/${chapterNum}#${halIdx + 1}-1`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-secondary/50 text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-sm font-medium"
                          title={`Halakhah ${halIdx + 1}`}
                        >
                          {halIdx + 1}
                        </Link>
                      ))}
                    </div>
                  )}
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

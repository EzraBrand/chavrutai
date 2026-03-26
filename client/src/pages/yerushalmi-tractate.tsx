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
import { apiRequest } from "@/lib/queryClient";

interface TractateInfoData {
  tractate: string;
  chapters: number;
  halakhotPerChapter: number[];
}

export default function YerushalmiTractate() {
  const [match, params] = useRoute("/yerushalmi/:tractate");
  const tractateParam = params?.tractate || "";
  const tractateDisplayName = normalizeYerushalmiTractateName(tractateParam);

  const tractateInfo = tractateDisplayName ? getYerushalmiTractateInfo(tractateDisplayName) : null;
  const tractateSlug = tractateDisplayName ? getYerushalmiTractateSlug(tractateDisplayName) : "";

  const { data: infoData, isLoading: isInfoLoading } = useQuery<TractateInfoData>({
    queryKey: ['/api/yerushalmi', tractateSlug, 'info'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/yerushalmi/${encodeURIComponent(tractateSlug)}/info`);
      return response.json();
    },
    enabled: !!tractateDisplayName && !!tractateInfo,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
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
          {Array.from({ length: tractateInfo.chapters }, (_, i) => i + 1).map((chapterNum) => {
            const halakhotCount = infoData?.halakhotPerChapter?.[chapterNum - 1];

            return (
              <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl text-primary mb-2">
                      Chapter {chapterNum}
                    </h3>
                    {halakhotCount !== undefined && halakhotCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {halakhotCount} {halakhotCount === 1 ? 'halakhah' : 'halakhot'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 justify-items-center">
                    {isInfoLoading ? (
                      Array.from({ length: 6 }, (_, j) => (
                        <div key={j} className="h-10 min-w-[3rem] max-w-[4rem] w-full rounded bg-muted animate-pulse" />
                      ))
                    ) : halakhotCount !== undefined && halakhotCount > 0 ? (
                      Array.from({ length: halakhotCount }, (_, j) => j + 1).map((halakhahNum) => (
                        <Link
                          key={halakhahNum}
                          href={`/yerushalmi/${tractateSlug}/${chapterNum}#${halakhahNum}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-2 text-base font-normal w-full min-w-[3rem] max-w-[4rem] hover:bg-primary hover:text-primary-foreground"
                          >
                            {halakhahNum}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <Link href={`/yerushalmi/${tractateSlug}/${chapterNum}`}>
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          Read Chapter {chapterNum}
                        </Button>
                      </Link>
                    )}
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

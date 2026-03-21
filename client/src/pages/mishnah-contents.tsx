import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  MISHNAH_ONLY_TRACTATES,
  MISHNAH_ONLY_HEBREW_NAMES,
  getMishnahTractateSlug,
} from "@shared/tractates";

const SEDER_INFO: Record<string, { hebrew: string; description: string }> = {
  zeraim: { hebrew: "סדר זרעים", description: "Agriculture and blessings" },
  moed: { hebrew: "סדר מועד", description: "Holidays and appointed times" },
  nezikin: { hebrew: "סדר נזיקין", description: "Damages and civil law" },
  kodashim: { hebrew: "סדר קדשים", description: "Holy things and sacrifices" },
  tohorot: { hebrew: "סדר טהרות", description: "Ritual purity" },
};

const SEDER_DISPLAY_NAMES: Record<string, string> = {
  zeraim: "Seder Zeraim",
  moed: "Seder Moed",
  nezikin: "Seder Nezikin",
  kodashim: "Seder Kodashim",
  tohorot: "Seder Tohorot",
};

export default function MishnahContents() {
  useSEO({
    title: "Mishnah - Hebrew & English | ChavrutAI",
    description: "Study the Mishnah online with bilingual Hebrew-English text. Browse 26 tractates not covered by the Babylonian Talmud, organized by Seder.",
    canonical: `${window.location.origin}/mishnah`,
    ogTitle: "Mishnah - Hebrew & English | ChavrutAI",
    ogDescription: "Study the Mishnah online with bilingual Hebrew-English text on ChavrutAI.",
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
            { label: "Home", href: "/" },
            { label: "Mishnah" },
          ]}
        />

        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-primary mb-1">Study Mishnah Online</h1>
          <h2 className="text-xl text-primary/80 mb-2 font-hebrew">משנה - Mishnah</h2>
          <p className="text-base text-muted-foreground">
            26 tractates not covered by the Babylonian Talmud, with Hebrew-English text
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            English translation by Dr. Joshua Kulp, "Mishnah Yomit" (CC-BY) via{' '}
            <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Sefaria</a>.{' '}
            Hebrew text: Torat Emet.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(MISHNAH_ONLY_TRACTATES).map(([seder, tractates]) => {
            const info = SEDER_INFO[seder];
            const displayName = SEDER_DISPLAY_NAMES[seder];
            return (
              <div key={seder} className="space-y-2">
                <div className="text-center border-b border-border pb-2">
                  <h3 className="text-xl font-semibold text-primary">{displayName}</h3>
                  <p className="text-base text-primary/70 font-hebrew">{info.hebrew}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tractates.map((tractate) => (
                    <Link key={tractate.name} href={`/mishnah/${getMishnahTractateSlug(tractate.name)}`}>
                      <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
                        <div className="p-3">
                          <div className="text-primary font-medium text-base">{tractate.name}</div>
                          <div className="text-sm text-primary/70 font-hebrew">
                            {MISHNAH_ONLY_HEBREW_NAMES[tractate.name] || tractate.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {tractate.chapters} chapters
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

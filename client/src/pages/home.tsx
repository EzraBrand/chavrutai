import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { DafYomiWidget } from "@/components/DafYomiWidget";
import { QuickSearch } from "@/components/QuickSearch";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  useSEO(generateSEOData.homePage());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link 
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
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="text-center mb-10" data-testid="hero-section">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Study Classical Jewish Texts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the Babylonian Talmud and Hebrew Bible with bilingual Hebrew-English text
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-10" data-testid="primary-texts-section">
          <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold text-foreground mb-3">Babylonian Talmud</h2>
              <p className="text-muted-foreground mb-4 flex-1">
                All 37 tractates with over 5,400 pages. Navigate by Seder, tractate, chapter, or individual page.
              </p>
              <Link href="/talmud">
                <Button variant="default" className="w-full" data-testid="button-browse-talmud">
                  Browse Talmud
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold text-foreground mb-3">Tanakh (Hebrew Bible)</h2>
              <p className="text-muted-foreground mb-4 flex-1">
                Torah, Prophets, and Writings. Each book includes Hebrew text with English translation.
              </p>
              <Link href="/bible">
                <Button variant="default" className="w-full" data-testid="button-browse-tanakh">
                  Browse Tanakh
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-3 gap-4 mb-10" data-testid="quick-actions-section">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-semibold text-foreground mb-3">Search Texts</h3>
              <div className="flex-1">
                <QuickSearch />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-semibold text-foreground mb-2">Famous Talmud Pages</h3>
              <p className="text-muted-foreground text-sm mb-3 flex-1">Discover well-known passages</p>
              <Link href="/suggested-pages" className="block">
                <Button variant="outline" className="w-full" data-testid="button-suggested-pages">
                  Explore
                </Button>
              </Link>
            </CardContent>
          </Card>

          <DafYomiWidget className="h-full" compact />
        </section>

        <section className="mb-10" data-testid="tools-section">
          <h2 className="text-xl font-semibold text-foreground mb-4">Study Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/sugya-viewer" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-2">Sugya Viewer</h3>
                  <p className="text-sm text-muted-foreground">Study custom Talmud text ranges</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dictionary" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-2">Dictionary</h3>
                  <p className="text-sm text-muted-foreground">Jastrow Talmud Dictionary</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/biblical-index" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-2">Biblical Index</h3>
                  <p className="text-sm text-muted-foreground">Find where biblical verses are cited in the Talmud</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/mishnah-map" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-2">Mishnah Map</h3>
                  <p className="text-sm text-muted-foreground">Locate Mishnah passages in the Talmud</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <section className="text-center mb-10" data-testid="about-section">
          <Link href="/about" className="inline-flex items-center gap-1 text-primary hover:underline font-medium underline underline-offset-2" data-testid="link-about">
            About ChavrutAI →
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Learn more about this project</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

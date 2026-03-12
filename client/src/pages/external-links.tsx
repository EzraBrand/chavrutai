import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { TRACTATE_LISTS, TRACTATE_HEBREW_NAMES, normalizeDisplayTractateName, isValidTractate, getTractateSlug } from "@shared/tractates";
import { getMaxFolio, getStartFolio, getStartSide } from "@shared/talmud-navigation";
import { 
  getAllExternalLinks, 
  getSectionLinks, 
  getPageLinks,
  type TalmudReference, 
  type ExternalLink as ExternalLinkType 
} from "@/lib/external-links";

function ExternalLinksPage() {
  useSEO({
    title: "External Links - Talmud Cross-References | ChavrutAI",
    description: "Find external links to Talmud pages on Sefaria, Al HaTorah, Wikisource, and Daf Yomi resources. Cross-reference any tractate, page, and section.",
    canonical: `${window.location.origin}/external-links`,
    robots: "index, follow",
  });

  const [location] = useLocation();
  const [tractate, setTractate] = useState<string>("Shabbat");
  const [folio, setFolio] = useState<number>(2);
  const [side, setSide] = useState<'a' | 'b'>('a');
  const [section, setSection] = useState<number | undefined>(2);
  const [sectionInput, setSectionInput] = useState<string>("2");
  const [links, setLinks] = useState<ExternalLinkType[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const t = params.get('tractate');
    const f = params.get('folio');
    const sec = params.get('section');

    if (t && isValidTractate(t)) {
      setTractate(normalizeDisplayTractateName(t));
    }
    if (f) {
      const match = f.match(/^(\d+)([ab])$/);
      if (match) {
        setFolio(parseInt(match[1]));
        setSide(match[2] as 'a' | 'b');
      }
    }
    if (sec) {
      const sectionNum = parseInt(sec);
      if (!isNaN(sectionNum)) {
        setSection(sectionNum);
        setSectionInput(sec);
      }
    }
  }, [location]);

  useEffect(() => {
    const ref: TalmudReference = {
      tractate,
      folio,
      side,
      section
    };
    setLinks(getAllExternalLinks(ref));
  }, [tractate, folio, side, section]);

  // Reset folio and side to valid values when tractate changes
  useEffect(() => {
    const newStartFolio = getStartFolio(tractate);
    const newStartSide = getStartSide(tractate);
    const newMaxFolio = getMaxFolio(tractate);
    
    // If current folio is out of range, reset to start
    if (folio < newStartFolio || folio > newMaxFolio) {
      setFolio(newStartFolio);
      setSide(newStartSide);
    } else if (folio === newStartFolio && newStartSide === 'b' && side === 'a') {
      // If on start folio but side 'a' doesn't exist (like Tamid 25a)
      setSide('b');
    }
  }, [tractate]);

  const handleSectionChange = (value: string) => {
    setSectionInput(value);
    if (value === '') {
      setSection(undefined);
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        setSection(num);
      }
    }
  };

  const maxFolio = getMaxFolio(tractate);
  const startFolio = getStartFolio(tractate);
  const startSide = getStartSide(tractate);
  const currentRef = `${tractate} ${folio}${side}${section ? `, section ${section}` : ''}`;

  const sectionLinks = getSectionLinks({ tractate, folio, side, section });
  const pageLinks = getPageLinks({ tractate, folio, side, section });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Links to Talmud Pages, by Platform
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This page provides links to the same Talmud pages and sections across different websites. 
              Select a tractate, folio, and side below, then use the provided links to view that page 
              on any of the following websites: ChavrutAI, Sefaria, Al HaTorah, Wikisource, or 'Daf Yomi' (tzurat hadaf).
            </p>
            <p>
              Optionally add a section number to get links that point directly to a specific paragraph. 
              ChavrutAI links open in the same tab; all other links open in a new tab.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Related Articles
            </CardTitle>
            <CardDescription>
              Blog posts and articles about digital Talmud resources:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-chavrutai-review"
                >
                  ChavrutAI Talmud Web App Launch: Review and Comparison with Similar Platforms
                </a>
              </li>
              <li>
                <a 
                  href="https://seforimblog.com/2023/06/from-print-to-pixel-digital-editions-of-the-talmud-bavli/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-pixel-article"
                >
                  From Print to Pixel: Digital Editions of the Talmud Bavli
                </a>
                {" "}(Seforim Blog)
              </li>
              <li>
                <a 
                  href="https://www.academia.edu/83334340/Guide_to_Online_Resources_for_Scholarly_Jewish_Study_and_Research_2023"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-academia-guide"
                >
                  Guide to Online Resources for Scholarly Jewish Study and Research - 2023
                </a>
                {" "}(Academia.edu)
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/evaluating-al-hatorahs-digital-repository"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-alhatorah-review"
                >
                  Evaluating Al HaTorah's Digital Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/more-on-the-formatting-of-the-talmud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-comparison-blogpost"
                >
                  More on the Formatting of the Talmud
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/helpful-formatting-of-the-talmud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-helpful-formatting"
                >
                  Helpful Formatting of the Talmud: Ohr Somayach's 'Talmud Navigator'
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="tractate">Tractate</Label>
                <Select value={tractate} onValueChange={setTractate}>
                  <SelectTrigger id="tractate" data-testid="select-tractate">
                    <SelectValue placeholder="Select tractate" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACTATE_LISTS["Talmud Bavli"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t} ({TRACTATE_HEBREW_NAMES[t as keyof typeof TRACTATE_HEBREW_NAMES] || ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="folio">Folio</Label>
                <Input
                  id="folio"
                  type="number"
                  min={startFolio}
                  max={maxFolio}
                  value={folio}
                  onChange={(e) => setFolio(Math.max(startFolio, Math.min(maxFolio, parseInt(e.target.value) || startFolio)))}
                  data-testid="input-folio"
                />
              </div>

              <div>
                <Label htmlFor="side">Side</Label>
                <Select value={side} onValueChange={(v) => setSide(v as 'a' | 'b')}>
                  <SelectTrigger id="side" data-testid="select-side">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">a (א)</SelectItem>
                    <SelectItem value="b">b (ב)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="section">Section (optional)</Label>
                <Input
                  id="section"
                  type="number"
                  min={1}
                  placeholder="e.g., 14"
                  value={sectionInput}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  data-testid="input-section"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {section !== undefined && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Section-Level Links
              </CardTitle>
              <CardDescription>
                Links that point to the specific section ({currentRef})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      ChavrutAI
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">same tab</span>
                    </div>
                    <div className="text-sm text-muted-foreground">ChavrutAI Talmud Reader - section anchor</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
                      /talmud/{getTractateSlug(tractate)}/{folio}{side}#section-{section}
                    </div>
                  </div>
                  <a
                    href={`/talmud/${getTractateSlug(tractate)}/${folio}${side}#section-${section}`}
                    className="flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-4"
                    data-testid="link-section-chavrutai"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Open
                  </a>
                </div>
                {sectionLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {link.name}
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">new tab</span>
                      </div>
                      {link.description && (
                        <div className="text-sm text-muted-foreground">{link.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
                        {link.url}
                      </div>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-4"
                      data-testid={`link-section-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Page-Level Links
            </CardTitle>
            <CardDescription>
              Links that point to the full page ({tractate} {folio}{side})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    ChavrutAI
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">same tab</span>
                  </div>
                  <div className="text-sm text-muted-foreground">ChavrutAI Talmud Reader</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
                    /talmud/{getTractateSlug(tractate)}/{folio}{side}
                  </div>
                </div>
                <a
                  href={`/talmud/${getTractateSlug(tractate)}/${folio}${side}`}
                  className="flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-4"
                  data-testid="link-page-chavrutai"
                >
                  <ArrowRight className="w-4 h-4" />
                  Open
                </a>
              </div>
              {pageLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {link.name}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">new tab</span>
                    </div>
                    {link.description && (
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
                      {link.url}
                    </div>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-4"
                    data-testid={`link-page-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Footer />
      </div>
    </div>
  );
}

export default ExternalLinksPage;

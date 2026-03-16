import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getTractateSlug, TRACTATE_HEBREW_NAMES, SEDER_TRACTATES, normalizeDisplayTractateName } from "@shared/tractates";
import { MISHNAH_MAP_DATA, type MishnahMapping } from "@shared/mishnah-map";
import { getMishnahChapterDataByTractate, getMishnahTalmudMapping, useChapterDataVersion, type ChapterInfo } from "@/lib/chapter-data";

const SEDER_ORGANIZATION = {
  "Seder Zeraim": {
    hebrew: "סדר זרעים",
    description: "Agriculture and blessings",
    tractates: SEDER_TRACTATES.zeraim.map(t => t.name)
  },
  "Seder Moed": {
    hebrew: "סדר מועד", 
    description: "Holidays and appointed times",
    tractates: SEDER_TRACTATES.moed.map(t => t.name)
  },
  "Seder Nashim": {
    hebrew: "סדר נשים",
    description: "Women and family law", 
    tractates: SEDER_TRACTATES.nashim.map(t => t.name)
  },
  "Seder Nezikin": {
    hebrew: "סדר נזיקין",
    description: "Damages and civil law",
    tractates: SEDER_TRACTATES.nezikin.map(t => t.name)
  },
  "Seder Kodashim": {
    hebrew: "סדר קדשים", 
    description: "Holy things and sacrifices",
    tractates: SEDER_TRACTATES.kodashim.map(t => t.name)
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: SEDER_TRACTATES.tohorot.map(t => t.name)
  }
};

// Note: Tractate names now match Sefaria exactly (Beitzah, Arakhin)
// No mapping needed - keeping empty for backwards compatibility if needed
const TRACTATE_NAME_VARIANTS: Record<string, string> = {};

interface MishnahTile {
  mishnahNumber: string;
  talmudRange: string;
  href: string;
  sefariaUrl: string;
}

interface ChapterWithMishnayot extends ChapterInfo {
  mishnahTiles: MishnahTile[];
  talmudOrderNote?: string;
}

interface TractateData {
  name: string;
  chapters: ChapterWithMishnayot[];
}

interface SederData {
  tractates: TractateData[];
}

export default function MishnahMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeder, setSelectedSeder] = useState<string>("all");
  const chapterDataVersion = useChapterDataVersion();

  useSEO({
    title: "Mishnah-Talmud Mapping | ChavrutAI",
    description: "Comprehensive mapping of Mishnah passages to their corresponding discussions in the Talmud. Find where each Mishnah is discussed and navigate directly to the relevant section.",
    canonical: `${window.location.origin}/mishnah-map`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Mishnah-Talmud Mapping",
      description: "Comprehensive mapping of Mishnah passages to their corresponding discussions in the Babylonian Talmud",
      url: `${window.location.origin}/mishnah-map`,
      creator: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "Babylonian Talmud",
        inLanguage: ["he", "en"],
      },
    },
  });

  // Transform data into organized structure by Seder → Tractate → Chapter → Mishnah
  const organizedData = useMemo(() => {
    const result: Record<string, SederData> = {};

    // Iterate through Sedarim in canonical order
    Object.entries(SEDER_ORGANIZATION).forEach(([sederName, sederInfo]) => {
      result[sederName] = { tractates: [] };

      // Iterate through tractates in canonical order
      sederInfo.tractates.forEach(tractate => {
        // Get all Mishnah mappings for this tractate using slug-based comparison for robustness
        const canonicalSlug = getTractateSlug(tractate);
        const tractateMappings = MISHNAH_MAP_DATA.filter(entry => {
          // Normalize spelling variants first
          const normalizedTractate = TRACTATE_NAME_VARIANTS[entry.tractate] || entry.tractate;
          const entrySlug = getTractateSlug(normalizedTractate);
          return entrySlug === canonicalSlug;
        });

        if (tractateMappings.length === 0) return;

        const tractateSlug = tractate.toLowerCase().replace(/\s+/g, ' ');
        const chapters = getMishnahChapterDataByTractate(tractateSlug);
        const talmudMapping = getMishnahTalmudMapping(tractateSlug);

        // Shared tile builder: given filtered+sorted mappings and the Mishnah chapter number
        const buildTiles = (chapterMappings: MishnahMapping[], mishnahChNum: number): MishnahTile[] =>
          chapterMappings.map(mapping => {
            const mishnahNumber = mapping.startMishnah === mapping.endMishnah
              ? `${mapping.startMishnah}`
              : `${mapping.startMishnah}-${mapping.endMishnah}`;

            let talmudRange: string;
            if (mapping.startDaf === mapping.endDaf && mapping.startLine === mapping.endLine) {
              talmudRange = `${mapping.startDaf}:${mapping.startLine}`;
            } else if (mapping.startDaf === mapping.endDaf) {
              talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endLine}`;
            } else {
              const startFolio = mapping.startDaf.slice(0, -1);
              const endFolio = mapping.endDaf.slice(0, -1);
              const endSide = mapping.endDaf.slice(-1);
              if (startFolio === endFolio) {
                talmudRange = `${mapping.startDaf}:${mapping.startLine}-${endSide}:${mapping.endLine}`;
              } else {
                talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endDaf}:${mapping.endLine}`;
              }
            }

            const normalizedTractate = TRACTATE_NAME_VARIANTS[mapping.tractate] || normalizeDisplayTractateName(mapping.tractate);
            const tractateSlugForLink = getTractateSlug(normalizedTractate);
            const href = `/talmud/${tractateSlugForLink}/${mapping.startDaf}#section-${mapping.startLine}`;

            const sefariaTractateName = tractate.replace(/ /g, '_');
            const sefariaUrl = `https://www.sefaria.org.il/Mishnah_${sefariaTractateName}.${mishnahChNum}.${mapping.startMishnah}`;

            return { mishnahNumber, talmudRange, href, sefariaUrl };
          });

        // Group Mishnah mappings by chapter
        const chaptersWithMishnayot: ChapterWithMishnayot[] = chapters.length > 0
          ? (talmudMapping
              // Tractates with Mishnah/Talmud chapter numbering divergence:
              // iterate in Mishnah chapter order, grouping tiles by mishnahChapter
              // and pulling Talmud chapter folio data via the lookup
              ? talmudMapping.map(({ mishnahChapter, talmudChapter, talmudOrderNote }) => {
                  const talmudChData = chapters.find(ch => ch.number === talmudChapter) || {
                    number: mishnahChapter,
                    englishName: `Chapter ${mishnahChapter}`,
                    hebrewName: `פרק ${mishnahChapter}`,
                    startFolio: 0, startSide: 'a' as const,
                    endFolio: 0, endSide: 'a' as const,
                  };
                  const chapterMappings = tractateMappings
                    .filter(mapping => mapping.mishnahChapter === mishnahChapter)
                    .sort((a, b) => a.startMishnah - b.startMishnah);
                  const mishnahTiles = buildTiles(chapterMappings, mishnahChapter);
                  return { ...talmudChData, number: mishnahChapter, mishnahTiles, talmudOrderNote };
                })
              // Standard tractates: Talmud and Mishnah chapter numbers match
              : chapters.map(chapter => {
                  const chapterMappings = tractateMappings
                    .filter(mapping => mapping.mishnahChapter === chapter.number)
                    .sort((a, b) => a.startMishnah - b.startMishnah);
                  const mishnahTiles = buildTiles(chapterMappings, chapter.number);
                  return { ...chapter, mishnahTiles };
                })
            )
          : // Fallback for tractates without chapter data: group by Mishnah chapter
            (() => {
              const chapterNumbers = Array.from(new Set(tractateMappings.map(m => m.mishnahChapter))).sort((a, b) => a - b);
              
              return chapterNumbers.map(chapterNum => {
                const chapterMappings = tractateMappings
                  .filter(mapping => mapping.mishnahChapter === chapterNum)
                  .sort((a, b) => a.startMishnah - b.startMishnah);

                const mishnahTiles: MishnahTile[] = chapterMappings.map(mapping => {
                  const mishnahNumber = mapping.startMishnah === mapping.endMishnah
                    ? `${mapping.startMishnah}`
                    : `${mapping.startMishnah}-${mapping.endMishnah}`;

                  let talmudRange: string;
                  if (mapping.startDaf === mapping.endDaf && mapping.startLine === mapping.endLine) {
                    // Single line
                    talmudRange = `${mapping.startDaf}:${mapping.startLine}`;
                  } else if (mapping.startDaf === mapping.endDaf) {
                    // Same page, different lines
                    talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endLine}`;
                  } else {
                    // Different pages - check if same folio number
                    const startFolio = mapping.startDaf.slice(0, -1);
                    const startSide = mapping.startDaf.slice(-1);
                    const endFolio = mapping.endDaf.slice(0, -1);
                    const endSide = mapping.endDaf.slice(-1);
                    
                    if (startFolio === endFolio) {
                      // Same folio number, different sides (e.g., 108a to 108b)
                      talmudRange = `${mapping.startDaf}:${mapping.startLine}-${endSide}:${mapping.endLine}`;
                    } else {
                      // Completely different folios
                      talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endDaf}:${mapping.endLine}`;
                    }
                  }

                  const normalizedTractate = TRACTATE_NAME_VARIANTS[mapping.tractate] || normalizeDisplayTractateName(mapping.tractate);
                  const tractateSlug = getTractateSlug(normalizedTractate);
                  const href = `/talmud/${tractateSlug}/${mapping.startDaf}#section-${mapping.startLine}`;

                  // Generate Sefaria Mishnah URL
                  const sefariaTractateName = tractate.replace(/ /g, '_');
                  const sefariaUrl = `https://www.sefaria.org.il/Mishnah_${sefariaTractateName}.${chapterNum}.${mapping.startMishnah}`;

                  return {
                    mishnahNumber,
                    talmudRange,
                    href,
                    sefariaUrl
                  };
                });

                return {
                  number: chapterNum,
                  englishName: `Chapter ${chapterNum}`,
                  hebrewName: `פרק ${chapterNum}`,
                  startFolio: 0,
                  startSide: 'a' as const,
                  endFolio: 0,
                  endSide: 'a' as const,
                  mishnahTiles
                };
              });
            })();

        // Only include tractate if it has at least one Mishnah mapping
        const hasAnyMishnayot = chaptersWithMishnayot.some(ch => ch.mishnahTiles.length > 0);
        if (hasAnyMishnayot) {
          result[sederName].tractates.push({
            name: tractate,
            chapters: chaptersWithMishnayot
          });
        }
      });
    });

    return result;
  }, [chapterDataVersion]);

  // Filter data based on search and selected Seder
  const filteredData = useMemo(() => {
    let data = { ...organizedData };

    // Filter by Seder
    if (selectedSeder !== "all") {
      data = { [selectedSeder]: data[selectedSeder] || { tractates: [] } };
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered: typeof data = {};

      Object.entries(data).forEach(([sederName, sederData]) => {
        const filteredTractates: TractateData[] = [];

        sederData.tractates.forEach(tractate => {
          const filteredChapters = tractate.chapters
            .map(chapter => {
              const filteredTiles = chapter.mishnahTiles.filter(tile =>
                tractate.name.toLowerCase().includes(query) ||
                chapter.englishName.toLowerCase().includes(query) ||
                tile.mishnahNumber.includes(query) ||
                tile.talmudRange.toLowerCase().includes(query)
              );

              if (filteredTiles.length > 0) {
                return { ...chapter, mishnahTiles: filteredTiles };
              }
              return null;
            })
            .filter((ch): ch is ChapterWithMishnayot => ch !== null);

          if (filteredChapters.length > 0) {
            filteredTractates.push({
              name: tractate.name,
              chapters: filteredChapters
            });
          }
        });

        if (filteredTractates.length > 0) {
          filtered[sederName] = { tractates: filteredTractates };
        }
      });

      data = filtered;
    }

    return data;
  }, [organizedData, selectedSeder, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Mishnah-Talmud Mapping
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the connections between Mishnah passages and their corresponding discussions in the Talmud. 
            Click any Mishnah to navigate directly to the relevant section.
          </p>
        </div>

        {/* Info Box */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">
              About This Mapping
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              This mapping is based on data from <a 
                href="https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                Sefaria's Mishnah Map
                <ExternalLink className="h-3 w-3" />
              </a>.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Browse Mishnah passages organized by Seder, tractate, and chapter. Each tile shows the Mishnah number and its location in the Talmud. Click any tile to view the Mishnah in the ChavrutAI Talmud page, or use the "Sefaria" link below each tile to see the Mishnah in <a 
                href="https://www.sefaria.org.il/texts/Mishnah" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
              >Sefaria's Mishnah viewer<ExternalLink className="h-3 w-3" /></a>.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Note the following gaps in chapter order between Mishnah and Talmud: Sanhedrin: 10 ↔ 11; Megillah: 3 ↔ 4; Menachot: 10 (Mishnah) → 6 (Talmud; thus, 6–9 in Talmud each shift one place later than in Mishnah)
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              For more information about this mapping table, see <a 
                href="https://www.ezrabrand.com/p/introducing-chavrutais-mishnah-talmud" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                "Introducing ChavrutAI's Mishnah-Talmud Mapping Table"
                <ExternalLink className="h-3 w-3" />
              </a> (Nov 23, 2025)
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by tractate, chapter, Mishnah, or page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Seder Filter */}
              <div className="md:w-64">
                <Select value={selectedSeder} onValueChange={setSelectedSeder}>
                  <SelectTrigger data-testid="select-seder">
                    <SelectValue placeholder="All Sedarim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sedarim</SelectItem>
                    {Object.keys(SEDER_ORGANIZATION).map((seder) => (
                      <SelectItem key={seder} value={seder}>
                        {seder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seder Sections */}
        <div className="space-y-8">
          {Object.entries(filteredData).map(([sederName, sederData]) => {
            const sederInfo = SEDER_ORGANIZATION[sederName as keyof typeof SEDER_ORGANIZATION];
            
            return (
              <div key={sederName} className="space-y-6">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-2">
                  <h3 className="text-xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-base text-primary/70 font-hebrew">
                    {sederInfo.hebrew}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sederInfo.description}
                  </p>
                </div>

                {/* Tractates */}
                {sederData.tractates.map(tractate => (
                  <div key={tractate.name} className="space-y-4">
                    {/* Tractate Header */}
                    <div className="flex items-baseline gap-2 px-2">
                      <h4 className="text-2xl font-bold text-primary">{tractate.name}</h4>
                      <span className="text-lg text-primary/70 font-hebrew">
                        {TRACTATE_HEBREW_NAMES[tractate.name as keyof typeof TRACTATE_HEBREW_NAMES] || ''}
                      </span>
                    </div>

                    {/* Chapters */}
                    <div className="grid grid-cols-1 gap-4 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
                      {tractate.chapters.map(chapter => {
                        if (chapter.mishnahTiles.length === 0) return null;
                        
                        return (
                          <Card
                            key={`${tractate.name}-${chapter.number}`}
                            className="hover:shadow-lg transition-shadow duration-200"
                            data-testid={`card-chapter-${tractate.name}-${chapter.number}`}
                          >
                            <CardContent className="p-6">
                              <div className="mb-4">
                                <h3 className="text-xl text-primary mb-2">
                                  Chapter {chapter.number}
                                </h3>
                                {chapter.talmudOrderNote && (
                                  <p className="text-xs text-amber-700 dark:text-amber-400 italic">
                                    {chapter.talmudOrderNote}
                                  </p>
                                )}
                              </div>

                              {/* Mishnah tiles */}
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 justify-items-center">
                                {chapter.mishnahTiles.map((tile, index) => (
                                  <div 
                                    key={`${tile.mishnahNumber}-${index}`}
                                    className="flex flex-col items-center"
                                  >
                                    <Link
                                      href={tile.href}
                                      data-testid={`link-mishnah-${tractate.name}-${chapter.number}-${tile.mishnahNumber}`}
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-auto px-1.5 py-2 text-base font-normal w-full min-w-[4.5rem] hover:bg-primary hover:text-primary-foreground flex flex-col items-center gap-0.5 overflow-hidden"
                                      >
                                        <span className="font-semibold">{tile.mishnahNumber}</span>
                                        <span className="text-[10px] text-muted-foreground text-center break-all leading-tight">{tile.talmudRange}</span>
                                      </Button>
                                    </Link>
                                    <a
                                      href={tile.sefariaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-blue-600 hover:underline mt-0.5 flex items-center gap-0.5"
                                      data-testid={`link-sefaria-${tractate.name}-${chapter.number}-${tile.mishnahNumber}`}
                                    >
                                      Sefaria
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {Object.keys(filteredData).length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No Mishnah mappings found. Try adjusting your search or filter.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

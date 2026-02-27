import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Search, Loader2, BookOpen, ScrollText, ChevronLeft, ChevronRight, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { SharedLayout } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { SEARCH_SUGGESTIONS } from "@/data/search-suggestions";
import { removeNikud, containsHebrew } from "@/lib/text-processing";
import type { TextSearchResponse, SearchResult } from "@shared/schema";

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") || "",
    type: (p.get("type") as "all" | "talmud" | "bible") || "all",
    exact: p.get("exact") === "true",
    excludeBefore: p.get("exclude_before") || "",
    excludeAfter: p.get("exclude_after") || "",
  };
}

function buildUrl(params: {
  q: string;
  type: "all" | "talmud" | "bible";
  exact: boolean;
  excludeBefore: string;
  excludeAfter: string;
}) {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.type !== "all") p.set("type", params.type);
  if (params.exact) p.set("exact", "true");
  if (params.excludeBefore.trim()) p.set("exclude_before", params.excludeBefore.trim());
  if (params.excludeAfter.trim()) p.set("exclude_after", params.excludeAfter.trim());
  return `/search${p.toString() ? "?" + p.toString() : ""}`;
}

function shouldExcludeResult(text: string, query: string, excludeBefore: string, excludeAfter: string): boolean {
  if (!excludeBefore && !excludeAfter) return false;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryIdx = lowerText.indexOf(lowerQuery);
  if (queryIdx === -1) return false;
  if (excludeBefore.trim()) {
    const before = lowerText.slice(0, queryIdx);
    if (before.includes(excludeBefore.trim().toLowerCase())) return true;
  }
  if (excludeAfter.trim()) {
    const after = lowerText.slice(queryIdx + lowerQuery.length);
    if (after.includes(excludeAfter.trim().toLowerCase())) return true;
  }
  return false;
}

export default function SearchPage() {
  const initialParams = useMemo(() => getUrlParams(), []);

  const [searchQuery, setSearchQuery] = useState(initialParams.q);
  const [submittedQuery, setSubmittedQuery] = useState(initialParams.q);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "talmud" | "bible">(initialParams.type);
  const [exactMatch, setExactMatch] = useState(initialParams.exact);
  const [excludeBefore, setExcludeBefore] = useState(initialParams.excludeBefore);
  const [excludeAfter, setExcludeAfter] = useState(initialParams.excludeAfter);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialParams.excludeBefore || initialParams.excludeAfter)
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const pageSize = 15;

  const pushUrl = (overrides?: Partial<{
    q: string; type: "all" | "talmud" | "bible"; exact: boolean;
    excludeBefore: string; excludeAfter: string;
  }>) => {
    const url = buildUrl({
      q: overrides?.q ?? submittedQuery,
      type: overrides?.type ?? typeFilter,
      exact: overrides?.exact ?? exactMatch,
      excludeBefore: overrides?.excludeBefore ?? excludeBefore,
      excludeAfter: overrides?.excludeAfter ?? excludeAfter,
    });
    window.history.replaceState(null, "", url);
  };

  useSEO({
    title: "Search Talmud & Bible - Hebrew & English | ChavrutAI",
    description: "Search through the Babylonian Talmud and Hebrew Bible (Tanakh) in Hebrew and English. Find passages, concepts, and references across classical Jewish texts.",
    ogTitle: "Search Talmud & Bible - Hebrew & English",
    ogDescription: "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English.",
    canonical: `${window.location.origin}/search`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ChavrutAI Search",
      url: `${window.location.origin}/search`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}/search?q={search_term}`,
        "query-input": "required name=search_term",
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  const { data: searchResults, isLoading, error } = useQuery<TextSearchResponse>({
    queryKey: ["/api/search/text", submittedQuery, currentPage, pageSize, typeFilter, exactMatch],
    queryFn: async ({ queryKey }) => {
      const [, query, page, size, type, exact] = queryKey as [string, string, number, number, string, boolean];
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        pageSize: size.toString(),
        type: type,
        exact: exact.toString(),
      });
      const response = await fetch(`/api/search/text?${params}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return response.json();
    },
    enabled: submittedQuery.length > 0,
  });

  const filteredResults = useMemo(() => {
    if (!searchResults) return null;
    if (!excludeBefore.trim() && !excludeAfter.trim()) return searchResults;
    const filtered = searchResults.results.filter(
      (r) => !shouldExcludeResult(r.text, submittedQuery, excludeBefore, excludeAfter)
    );
    return { ...searchResults, results: filtered };
  }, [searchResults, submittedQuery, excludeBefore, excludeAfter]);

  const excludedCount = searchResults && filteredResults
    ? searchResults.results.length - filteredResults.results.length
    : 0;

  const handleTypeChange = (newType: "all" | "talmud" | "bible") => {
    setTypeFilter(newType);
    setCurrentPage(1);
    pushUrl({ type: newType });
  };

  const handleExactChange = (checked: boolean) => {
    setExactMatch(checked);
    setCurrentPage(1);
    pushUrl({ exact: checked });
  };

  const filteredSuggestions = useMemo(() => {
    if (searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase();
    const matching = SEARCH_SUGGESTIONS.filter((term) => term.toLowerCase().includes(query));
    const startsWithQuery = matching.filter((c) => c.toLowerCase().startsWith(query));
    const containsQuery = matching.filter((c) => !c.toLowerCase().startsWith(query));
    return [...startsWithQuery, ...containsQuery].slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    if (isUserTyping && searchQuery.length >= 2 && searchQuery !== submittedQuery && filteredSuggestions.length > 0) {
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, filteredSuggestions, isUserTyping, submittedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      setSubmittedQuery(trimmed);
      setCurrentPage(1);
      setShowSuggestions(false);
      setIsUserTyping(false);
      pushUrl({ q: trimmed });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSubmittedQuery(suggestion);
    setCurrentPage(1);
    setShowSuggestions(false);
    setIsUserTyping(false);
    searchInputRef.current?.blur();
    pushUrl({ q: suggestion });
  };

  const getChavrutaiLink = (result: SearchResult): string | null => {
    const ref = result.ref;
    if (result.type === "talmud") {
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const tractate = match[1].trim().toLowerCase().replace(/\s+/g, "-");
        const folio = match[2];
        const side = match[3];
        const section = match[4];
        const sectionAnchor = section ? `#section-${section}` : "";
        return `/talmud/${tractate}/${folio}${side}${sectionAnchor}`;
      }
    } else if (result.type === "bible") {
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const book = match[1].trim().toLowerCase().replace(/\s+/g, "-");
        const chapter = match[2];
        const verse = match[3];
        const verseAnchor = verse ? `#verse-${verse}` : "";
        return `/bible/${book}/${chapter}${verseAnchor}`;
      }
    }
    return null;
  };

  const renderHighlightedText = (result: SearchResult) => {
    let text = result.highlight || result.text;
    const isHebrew = containsHebrew(text);
    if (isHebrew) {
      const parts = text.split(/(<[^>]+>)/);
      text = parts
        .map((part) => {
          if (part.startsWith("<")) return part;
          return removeNikud(part);
        })
        .join("");
    }
    return (
      <div
        className="text-sm text-muted-foreground leading-relaxed"
        dir={isHebrew ? "rtl" : "ltr"}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "talmud":
        return <ScrollText className="w-4 h-4 text-amber-600" />;
      case "bible":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "talmud":
        return "Talmud";
      case "bible":
        return "Bible";
      default:
        return "Text";
    }
  };

  return (
    <SharedLayout variant="simple" mainMaxWidth="max-w-4xl">
      <style>{`
        mark {
          background-color: #fef08a;
          padding: 0 2px;
          border-radius: 2px;
        }
        .dark mark {
          background-color: #854d0e;
          color: #fef9c3;
        }
      `}</style>

      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Search Texts</h1>
          <p className="text-muted-foreground">Search the Talmud and Bible in Hebrew and English</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Enter a word or phrase..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsUserTyping(true);
                }}
                onFocus={() => {
                  if (isUserTyping && suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pr-10 text-lg py-6"
                data-testid="input-search"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors text-sm"
                      data-testid={`suggestion-${index}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!searchQuery.trim() || isLoading}
              data-testid="button-search"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Search"}
            </Button>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <input
              id="exact-match"
              type="checkbox"
              checked={exactMatch}
              onChange={(e) => handleExactChange(e.target.checked)}
              className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
              data-testid="checkbox-exact-match"
            />
            <label htmlFor="exact-match" className="text-sm cursor-pointer select-none">
              Exact match
            </label>
            <span className="text-xs text-muted-foreground ml-1">
              (requires words to appear exactly as typed, in order)
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Advanced filters
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 border border-border rounded-md bg-muted/30 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Exclude results where another phrase appears before or after your search term in the passage.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="exclude-before" className="text-sm font-medium">
                      Exclude if preceded by
                    </label>
                    <Input
                      id="exclude-before"
                      type="text"
                      placeholder='e.g. "Shimon"'
                      value={excludeBefore}
                      onChange={(e) => setExcludeBefore(e.target.value)}
                      className="text-sm"
                      data-testid="input-exclude-before"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="exclude-after" className="text-sm font-medium">
                      Exclude if followed by
                    </label>
                    <Input
                      id="exclude-after"
                      type="text"
                      placeholder='e.g. "bar Kahana"'
                      value={excludeAfter}
                      onChange={(e) => setExcludeAfter(e.target.value)}
                      className="text-sm"
                      data-testid="input-exclude-after"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {submittedQuery && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("all")}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              variant={typeFilter === "talmud" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("talmud")}
              data-testid="filter-talmud"
            >
              <ScrollText className="w-4 h-4 mr-1" />
              Talmud
            </Button>
            <Button
              variant={typeFilter === "bible" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("bible")}
              data-testid="filter-bible"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Bible
            </Button>
          </div>
        )}

        {/* How to use section - shown when no search is active */}
        {!submittedQuery && !isLoading && (
          <Card className="bg-muted/50" data-testid="section-how-to-search">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">How to Search</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">What you can search</h3>
                  <p>
                    Search across the 37 tractates of the Babylonian Talmud and the complete Hebrew
                    Bible (Tanakh) in both Hebrew and English.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Search tips</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Enter a word or phrase in Hebrew or English</li>
                    <li>As you type, suggestions for common Talmudic concepts will appear</li>
                    <li>Use the filter buttons to show only Talmud or Bible results</li>
                    <li>
                      Check <strong>Exact match</strong> to require words appear precisely as typed
                      (e.g. "Rabbi Abba" won't match "R' Ḥiyya bar Abba")
                    </li>
                    <li>
                      Use <strong>Advanced filters</strong> to exclude results where another phrase
                      appears before or after your search term (e.g. "ben Zoma" without "Shimon"
                      preceding it)
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">URL parameters</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 font-mono text-xs">
                    <li>
                      <span className="text-foreground">?q=</span> — search query
                    </li>
                    <li>
                      <span className="text-foreground">?type=talmud</span> or{" "}
                      <span className="text-foreground">?type=bible</span> — limit to a corpus
                    </li>
                    <li>
                      <span className="text-foreground">?exact=true</span> — exact phrase match
                    </li>
                    <li>
                      <span className="text-foreground">?exclude_before=</span> — exclude phrase
                      appearing before
                    </li>
                    <li>
                      <span className="text-foreground">?exclude_after=</span> — exclude phrase
                      appearing after
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Results</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Each result shows the source reference and matching text with your search term
                      highlighted
                    </li>
                    <li>Click on any result to go directly to that section or verse in ChavrutAI</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-border mt-4">
                  <p className="text-sm">
                    To find out more about this feature, see: "
                    <a
                      href="https://www.ezrabrand.com/p/introducing-chavrutais-search-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      data-testid="link-search-blog-post"
                    >
                      Introducing ChavrutAI's Search: Full-Text Search of Bible and Talmud{" "}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    " (Dec 23, 2025)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4 text-destructive">
              Failed to search. Please try again.
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {filteredResults && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredResults.total.toLocaleString()} results for "{filteredResults.query}"
                {exactMatch && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-medium">
                    exact
                  </span>
                )}
                {excludedCount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({excludedCount} filtered by context on this page)
                  </span>
                )}
              </span>
              {filteredResults.totalPages > 1 && (
                <span>
                  Page {filteredResults.page} of {filteredResults.totalPages}
                </span>
              )}
            </div>

            {filteredResults.results.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found for "{filteredResults.query}". Try a different search term.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredResults.results.map((result, index) => {
                  const chavrutaiLink = getChavrutaiLink(result);

                  const handleResultClick = (e: React.MouseEvent) => {
                    if (!chavrutaiLink) return;
                    if (e.ctrlKey || e.metaKey) {
                      window.open(chavrutaiLink, "_blank");
                    } else {
                      const [path, hash] = chavrutaiLink.split("#");
                      navigate(path);
                      if (hash) {
                        setTimeout(() => {
                          window.location.hash = hash;
                        }, 0);
                      }
                    }
                  };

                  const handleOpenNewTab = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (chavrutaiLink) {
                      window.open(chavrutaiLink, "_blank");
                    }
                  };

                  return (
                    <Card
                      key={index}
                      className={`transition-colors ${chavrutaiLink ? "hover:bg-accent/50 cursor-pointer" : ""}`}
                      onClick={handleResultClick}
                      data-testid={`result-${index}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">{getTypeIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                {getTypeLabel(result.type)}
                              </span>
                              <span className="font-medium text-foreground">{result.ref}</span>
                            </div>
                            {renderHighlightedText(result)}
                          </div>
                          {chavrutaiLink && (
                            <div className="flex-shrink-0 self-center flex items-center gap-1">
                              <button
                                onClick={handleOpenNewTab}
                                className="p-1 rounded hover:bg-accent transition-colors"
                                title="Open in new tab"
                                data-testid={`button-open-new-tab-${index}`}
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredResults.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {filteredResults.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(filteredResults.totalPages, p + 1))}
                  disabled={currentPage >= filteredResults.totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {!submittedQuery && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start your search</p>
            <p className="text-sm">Enter a word or phrase to search across the Talmud and Bible</p>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

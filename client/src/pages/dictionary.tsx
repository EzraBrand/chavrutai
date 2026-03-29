import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import jastrowMappings from "@/data/jastrow-mappings.json";

const HEBREW_ALPHABET = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'ן', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'
];

interface DictionaryEntry {
  headword: string;
  rid?: string;
  parent_lexicon: string;
  language_code?: string;
  language_reference?: string;
  content: {
    senses: Array<{
      definition: string;
    }>;
  };
}

interface AutosuggestSuggestion {
  unvoweled: string;
  voweled: string;
}

export default function Dictionary() {
  // Add CSS for dictionary content styling
  const dictionaryStyles = `
    /* Link styling */
    .dictionary-content a.refLink {
      color: #2563eb;
      text-decoration: underline;
      cursor: pointer;
    }
    .dictionary-content a.refLink:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
    .dark .dictionary-content a.refLink {
      color: #60a5fa;
    }
    .dark .dictionary-content a.refLink:hover {
      color: #93c5fd;
    }
    
    /* Font styling */
    .dictionary-content {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .dictionary-content span[dir="rtl"] {
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 500;
    }
    .dictionary-content i {
      font-style: italic;
    }
    
    /* Hebrew letter buttons and search input */
    .font-hebrew {
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Header title */
    .dictionary-header {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  `;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);

  useSEO({
    title: "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic | ChavrutAI",
    description: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.",
    ogTitle: "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic",
    ogDescription: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic with modernized presentation and enhanced readability.",
    canonical: `${window.location.origin}/dictionary`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Jastrow Talmud Dictionary",
      description: "Comprehensive dictionary of Talmudic Hebrew and Aramaic with modernized presentation",
      url: `${window.location.origin}/dictionary`,
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "A Dictionary of the Targumim, the Talmud Babli and Yerushalmi, and the Midrashic Literature",
        author: {
          "@type": "Person",
          name: "Marcus Jastrow",
        },
      },
    },
  });

  // Function to split text into paragraphs by long dash while preserving HTML structure
  const splitIntoParagraphs = (text: string) => {
    // Check for various dash types: em dash (—), en dash (–), and HTML entities
    const dashPatterns = ['—', '–', '&mdash;', '&#8212;', '&#x2014;'];
    let foundDash = '';

    for (const dash of dashPatterns) {
      if (text.includes(dash)) {
        foundDash = dash;
        break;
      }
    }

    if (!foundDash) {
      return text;
    }

    // Split by the found dash and filter out empty parts
    const parts = text.split(foundDash).filter(part => part.trim().length > 0);

    // If there's only one part, return as is
    if (parts.length <= 1) {
      return text;
    }

    // Wrap each part in a paragraph tag with extra spacing, preserving HTML
    return parts
      .map(part => `<p class="mb-4">${part.trim()}</p>`)
      .join('');
  };

  const splitByPeriodAndLink = (text: string) => {
    const pattern = /(\.\)\s*|\.\s+)(<a\s[^>]*href="([^"]*)"[^>]*>)/g;
    const result = text.replace(pattern, (match, periodPart, linkTag, href) => {
      if (href && href.includes('Jastrow')) {
        return match;
      }
      return `${periodPart}<br/><span style="margin-right:4px">&#8226;</span>${linkTag}`;
    });
    return result;
  };

  const convertSuperscriptLetters = (text: string) => {
    const superscriptMap: Record<string, string> = {
      'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e',
      'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ⁱ': 'i', 'ʲ': 'j',
      'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ⁿ': 'n', 'ᵒ': 'o',
      'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u',
      'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z'
    };
    let result = text;
    for (const [superscript, normal] of Object.entries(superscriptMap)) {
      result = result.split(superscript).join(normal);
    }
    return result;
  };

  // Function to expand abbreviations using comprehensive Jastrow mappings
  // This function preserves HTML tags while expanding abbreviations
  const expandAbbreviations = (text: string) => {
    let result = text;

    // Sort mappings by length (longest first) to avoid partial replacements
    const sortedMappings = Object.entries(jastrowMappings.mappings).sort(
      ([a], [b]) => b.length - a.length
    );

    // Apply all mappings, but only to text outside of HTML tags
    for (const [abbreviation, expansion] of sortedMappings) {
      // Create appropriate regex pattern based on the abbreviation format
      let pattern: RegExp;

      if (abbreviation === '&c.') {
        // Special case for &c. - don't use word boundary since & is not a word character
        pattern = new RegExp('&c\\.(?![^<]*>)', 'g');
      } else if (abbreviation.includes(' ')) {
        // Multi-word abbreviations - match as exact phrases, but not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`${escaped}(?![^<]*>)`, 'g');
      } else if (abbreviation.endsWith('.')) {
        // Abbreviations ending with period - match with word boundary before, not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`\\b${escaped}(?![^<]*>)`, 'g');
      } else {
        // Other abbreviations - use word boundaries on both sides, not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`\\b${escaped}\\b(?![^<]*>)`, 'g');
      }

      result = result.replace(pattern, expansion);
    }

    return result;
  };

  const updateURLParams = useCallback((params: { q?: string; letter?: string }) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('letter');
    if (params.q) url.searchParams.set('q', params.q);
    if (params.letter) url.searchParams.set('letter', params.letter);
    const newPath = url.pathname + url.search;
    window.history.replaceState(null, '', newPath);
  }, []);

  const handleSearch = useCallback(async (query?: string | unknown) => {
    const q = typeof query === 'string' ? query : searchQuery;
    if (!q.trim()) return;
    setIsLoading(true);
    updateURLParams({ q: q.trim() });
    try {
      const response = await fetch(`/api/dictionary/search?query=${encodeURIComponent(q)}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const entries = await response.json();

      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];

      setResults(validEntries);
      setSelectedLetter("");
    } catch (error) {
      console.error('Frontend: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [searchQuery, updateURLParams]);

  const handleLetterClick = useCallback(async (letter: string) => {
    setSelectedLetter(letter);
    setIsLoading(true);
    updateURLParams({ letter });

    try {
      const response = await fetch(`/api/dictionary/browse?letter=${encodeURIComponent(letter)}`);

      if (!response.ok) {
        throw new Error(`Browse failed: ${response.status}`);
      }

      const entries = await response.json();

      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];

      setResults(validEntries);
      setSearchQuery("");
    } catch (error) {
      console.error('Frontend: Browse error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [updateURLParams]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const letter = params.get('letter');

    if (q) {
      suppressSuggestionsRef.current = true;
      setSearchQuery(q);
      handleSearch(q);
    } else if (letter) {
      handleLetterClick(letter);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Debounced function to fetch autosuggest suggestions
  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/dictionary/autosuggest?query=${encodeURIComponent(query)}`);
        if (response.ok) {
          const suggestionsData = await response.json();
          setSuggestions(suggestionsData);
          setShowSuggestions(suggestionsData.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Autosuggest error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setIsLoadingSuggestions(false);
    };

    const timeoutId = setTimeout(() => {
      if (suppressSuggestionsRef.current) {
        suppressSuggestionsRef.current = false;
        return;
      }
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSuggestionClick = (suggestion: AutosuggestSuggestion) => {
    setSearchQuery(suggestion.voweled);
    setShowSuggestions(false);
    handleSearch(suggestion.voweled);
  };

  // Handle clicks outside the suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Copy-paste handler to preserve formatting
  useEffect(() => {
    const container = document.querySelector('main.max-w-4xl');
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      // Remove the external link arrow symbol (↗) from the copy
      const removeExternalLinkArrow = (element: HTMLElement): void => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const textNodesToUpdate: { node: Text; newValue: string }[] = [];
        let node: Node | null;
        
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const cleaned = node.textContent.replace(/↗/g, '').trim();
            if (cleaned !== node.textContent.trim()) {
              textNodesToUpdate.push({ node: node as Text, newValue: cleaned });
            }
          }
        }
        
        textNodesToUpdate.forEach(({ node, newValue }) => {
          node.textContent = newValue;
        });
      };

      removeExternalLinkArrow(tempDiv);

      const stripFormattingExcept = (element: HTMLElement): string => {
        const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'a', 'sup', 'sub', 'small'];
        
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_ELEMENT,
          null
        );

        const nodesToProcess: Element[] = [];
        let node: Node | null;

        while ((node = walker.nextNode())) {
          nodesToProcess.push(node as Element);
        }

        nodesToProcess.forEach(node => {
          const tagName = node.tagName.toLowerCase();
          
          if (!allowedTags.includes(tagName)) {
            const parent = node.parentNode;
            if (!parent) return;
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
          } else {
            const el = node as HTMLElement;
            const attrsToKeep = ['dir', 'style', 'href', 'target', 'rel', 'class'];
            const attrsToRemove: string[] = [];
            
            for (let i = 0; i < el.attributes.length; i++) {
              const attrName = el.attributes[i].name;
              const isDataAttr = attrName.startsWith('data-');
              if (!attrsToKeep.includes(attrName) && !isDataAttr) {
                attrsToRemove.push(attrName);
              }
            }
            
            attrsToRemove.forEach(attr => el.removeAttribute(attr));
            
            const currentStyle = el.getAttribute('style') || '';
            const styleUpdates: Record<string, string> = {};
            
            if (tagName === 'strong' || tagName === 'b') {
              styleUpdates['font-weight'] = 'bold';
            }
            if (tagName === 'em' || tagName === 'i') {
              styleUpdates['font-style'] = 'italic';
            }
            
            // Check for explicit dir attribute OR elements with Hebrew content
            const isHebrew = (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') || 
                            el.classList.contains('font-hebrew') ||
                            el.closest('.font-hebrew');
            
            if (isHebrew) {
              styleUpdates['direction'] = 'rtl';
              styleUpdates['font-weight'] = 'bold';
            }
            
            if (Object.keys(styleUpdates).length > 0) {
              const existingStyles = currentStyle.split(';')
                .filter(s => s.trim())
                .reduce((acc, style) => {
                  const [key, value] = style.split(':').map(s => s.trim());
                  if (key && value && !styleUpdates.hasOwnProperty(key)) {
                    acc[key] = value;
                  }
                  return acc;
                }, {} as Record<string, string>);
              
              const mergedStyles = { ...existingStyles, ...styleUpdates };
              const newStyle = Object.entries(mergedStyles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              
              el.setAttribute('style', newStyle);
            }
          }
        });

        return element.innerHTML;
      };

      const cleanHTML = stripFormattingExcept(tempDiv);
      
      const getPlainText = (element: HTMLElement, isRoot = true): string => {
        let text = '';
        element.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            
            if (tag === 'br') {
              text += '\n';
            } else if (tag === 'p' || tag === 'div') {
              text += getPlainText(el, false) + '\n';
            } else {
              text += getPlainText(el, false);
            }
          }
        });
        return isRoot ? text.trimEnd() : text;
      };
      
      const plainText = getPlainText(tempDiv);

      if (e.clipboardData) {
        e.clipboardData.setData('text/html', cleanHTML);
        e.clipboardData.setData('text/plain', plainText);
        e.preventDefault();
      }
    };

    container.addEventListener('copy', handleCopy as EventListener);

    return () => {
      container.removeEventListener('copy', handleCopy as EventListener);
    };
  }, [results]);

  return (
    <div className="min-h-screen bg-background">
      {/* Inject CSS for dictionary links */}
      <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />
      
      {/* Centered Logo Header */}
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

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Jastrow Talmudic Dictionary</h1>

        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1" ref={searchInputRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search Hebrew/Aramaic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="pl-10 font-hebrew"
                data-testid="input-search"
                disabled={isLoading}
              />

              {/* Autosuggest Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      data-testid={`suggestion-${index}`}
                      className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-hebrew text-lg" dir="rtl">{suggestion.voweled}</span>
                      {suggestion.voweled !== suggestion.unvoweled && (
                        <span className="text-muted-foreground text-sm font-hebrew" dir="rtl">{suggestion.unvoweled}</span>
                      )}
                    </div>
                  ))}
                  {isLoadingSuggestions && (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Loading suggestions...
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} data-testid="button-search" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        {/* Browse by Letter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Browse by Letter</h2>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {HEBREW_ALPHABET.map((letter) => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? "default" : "outline"}
                size="sm"
                className="h-10 font-hebrew text-lg"
                onClick={() => handleLetterClick(letter)}
                data-testid={`button-letter-${letter}`}
                disabled={isLoading}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Dictionary Entries</h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading entries...</span>
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No entries found. Try a different search term or browse by letter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((entry, index) => {
                // Format origin metadata (language_code and language_reference)
                // Preserve original Sefaria format and let expandAbbreviations handle display
                const formatOriginMetadata = () => {
                  if (!entry.language_code && !entry.language_reference) return null;
                  
                  let originText = '';
                  
                  // Preserve language_code as-is (e.g., "(b. h.;", "ch.")
                  if (entry.language_code) {
                    originText = entry.language_code;
                  }
                  
                  // Add language_reference if present (e.g., " cmp. <a>לָעַג</a>)")
                  if (entry.language_reference) {
                    originText += entry.language_reference;
                  }
                  
                  return originText.trim();
                };
                
                const originMetadata = formatOriginMetadata();
                
                return (
                  <div key={entry.rid || index} className="pb-4 border-b border-border last:border-b-0" data-testid={`entry-${entry.rid || index}`}>
                    <div className="flex items-start gap-4">
                      <h3 className="text-lg font-bold font-hebrew text-primary min-w-fit">
                        {entry.headword}
                      </h3>
                      <div className="text-foreground flex-1 prose prose-sm max-w-none">
                        {originMetadata && (
                          <div 
                            className="mb-2 dictionary-content text-muted-foreground" 
                            dangerouslySetInnerHTML={{ __html: expandAbbreviations(originMetadata) }} 
                          />
                        )}
                        {entry.content.senses.map((sense, senseIndex) => (
                          <div 
                            key={senseIndex} 
                            className="mb-2 last:mb-0 dictionary-content" 
                            dangerouslySetInnerHTML={{ __html: expandAbbreviations(convertSuperscriptLetters(splitByPeriodAndLink(splitIntoParagraphs(sense.definition)))) }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* About Link */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            To find out more about this, see:{" "}
            <a 
              href="https://www.ezrabrand.com/p/jastrows-talmud-dictionary-a-modernized"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              data-testid="link-about"
            >
              Jastrow's Talmud Dictionary: A Modernized and Enhanced Digital Presentation at ChavrutAI
              <ExternalLink className="h-3 w-3" />
            </a>
            {" "}
            <span className="text-muted-foreground">(Sep 28, 2025)</span>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
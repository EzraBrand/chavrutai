import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Copy, FileText, Code, ExternalLink } from "lucide-react";
import { formatEnglishText, processHebrewText } from "@/lib/text-processing";
import { TRACTATE_LISTS } from "@shared/tractates";
import { BlogPostSelector } from "@/components/sefaria/blog-post-selector";
import { locationToSefariaUrl } from "@/lib/blog-post-utils";
import { Footer } from "@/components/footer";
import { ChatPanel } from "@/components/sefaria/chat-panel";
import type { ChatContext } from "@/hooks/use-chat";
import { useSEO } from "@/hooks/use-seo";

const tractates = TRACTATE_LISTS["Talmud Bavli"];
const pages = Array.from({ length: 180 }, (_, i) => i + 2).flatMap(num => [`${num}a`, `${num}b`]);
const sections = Array.from({ length: 50 }, (_, i) => i + 1);

interface SefariaResponse {
  tractate: string;
  page: string;
  section?: number;
  hebrewSections: string[];
  englishSections: string[];
  span: string;
  error?: string;
}

export default function SefariaFetchPage() {
  useSEO({
    title: "Sugya Viewer - Study Custom Talmud Ranges | ChavrutAI",
    description: "View and study custom Talmud text ranges with bilingual Hebrew-English display. Select any tractate, page, and section for focused study.",
    canonical: `${window.location.origin}/sugya-viewer`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Sugya Viewer",
      description: "Tool for viewing custom Talmud text ranges with Hebrew-English bilingual display",
      url: `${window.location.origin}/sugya-viewer`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  const [inputMethod, setInputMethod] = useState<"dropdown" | "url" | "blogpost">("dropdown");
  const [tractate, setTractate] = useState<string>(tractates[0]);
  const [page, setPage] = useState<string>("2a");
  const [section, setSection] = useState<string>("all");
  const [url, setUrl] = useState<string>("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<SefariaResponse>({
    queryKey: ['/api/sefaria-fetch', inputMethod, tractate, page, section, url],
    queryFn: async () => {
      const params = new URLSearchParams({
        inputMethod,
        tractate,
        page,
        section,
        url
      });
      const response = await fetch(`/api/sefaria-fetch?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch text');
      }
      return response.json();
    },
    enabled: shouldFetch,
    refetchOnWindowFocus: false,
    retry: false
  });

  const handleFetch = () => {
    setShouldFetch(true);
    refetch();
  };

  useEffect(() => {
    const container = document.getElementById('text-display-container');
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

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
          const el = node as HTMLElement;
          
          if (el.hasAttribute('data-no-copy')) {
            const parent = el.parentNode;
            if (parent) {
              parent.removeChild(el);
            }
            return;
          }
          
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
            
            // Only preserve specific styles we want to keep
            const allowedStyles: Record<string, string> = {};
            
            if (tagName === 'strong' || tagName === 'b') {
              allowedStyles['font-weight'] = 'bold';
            }
            if (tagName === 'em' || tagName === 'i') {
              allowedStyles['font-style'] = 'italic';
            }
            
            if (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') {
              allowedStyles['direction'] = 'rtl';
              allowedStyles['font-weight'] = 'bold';
            }
            
            // Remove all inline styles and only set the allowed ones
            if (Object.keys(allowedStyles).length > 0) {
              const newStyle = Object.entries(allowedStyles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              el.setAttribute('style', newStyle);
            } else {
              el.removeAttribute('style');
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
            if (el.hasAttribute('data-no-copy')) {
              return;
            }
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
  }, [data]);

  const handleSelectAll = () => {
    const container = document.getElementById('text-display-container');
    if (!container) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const getCleanHtml = (container: HTMLElement): string => {
    const clone = container.cloneNode(true) as HTMLElement;
    
    clone.querySelectorAll('[data-no-copy]').forEach(el => el.remove());
    clone.querySelectorAll('hr').forEach(el => el.remove());
    
    const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'sup', 'sub', 'small'];
    
    const processNode = (element: HTMLElement) => {
      const children = Array.from(element.children);
      children.forEach(child => {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (!allowedTags.includes(tagName)) {
          while (el.firstChild) {
            el.parentNode?.insertBefore(el.firstChild, el);
          }
          el.parentNode?.removeChild(el);
        } else {
          const computedStyle = window.getComputedStyle(el);
          const isBold = computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700;
          const isItalic = computedStyle.fontStyle === 'italic';
          const isRtl = el.getAttribute('dir') === 'rtl' || computedStyle.direction === 'rtl';
          
          const attrsToRemove: string[] = [];
          const hasSticky = el.classList.contains('sticky');
          for (let i = 0; i < el.attributes.length; i++) {
            const attrName = el.attributes[i].name;
            if (!['dir', 'class'].includes(attrName)) {
              attrsToRemove.push(attrName);
            }
          }
          attrsToRemove.forEach(attr => el.removeAttribute(attr));
          if (hasSticky) {
            el.className = 'sticky';
          } else {
            el.removeAttribute('class');
          }
          
          const styles: string[] = [];
          if (isBold) styles.push('font-weight: bold');
          if (isItalic) styles.push('font-style: italic');
          if (isRtl) {
            el.setAttribute('dir', 'rtl');
          }
          if (styles.length > 0) {
            el.setAttribute('style', styles.join('; '));
          }
          
          if (el.children.length > 0) {
            processNode(el);
          }
        }
      });
    };
    
    processNode(clone);
    return clone.innerHTML;
  };

  const htmlToMarkdown = (html: string): string => {
    let md = html;
    
    md = md.replace(/<div[^>]*class\s*=\s*"[^"]*sticky[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
      const innerContent = content.replace(/<[^>]+>/g, '').trim();
      return `${innerContent}\n\n`;
    });
    
    md = md.replace(/<div[^>]*\s+dir\s*=\s*"rtl"[^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
      let innerContent = content
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
      const lines = innerContent.split('\n').filter((line: string) => line.trim());
      return lines.map((line: string) => `**${line.trim()}**`).join('\n\n') + '\n\n';
    });
    md = md.replace(/<p[^>]*\s+dir\s*=\s*"rtl"[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
      const innerContent = content.replace(/<[^>]+>/g, '').trim();
      return `**${innerContent}**\n\n`;
    });
    
    md = md.replace(/<[^>]*style\s*=\s*"[^"]*font-weight:\s*bold[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi, '**$1**');
    md = md.replace(/<[^>]*style\s*=\s*"[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi, '*$1*');
    
    md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
    
    md = md.replace(/<hr[^>]*>/gi, '');
    md = md.replace(/<br[^>]*>/gi, '\n');
    md = md.replace(/<\/p>/gi, '\n\n');
    md = md.replace(/<p[^>]*>/gi, '');
    md = md.replace(/<\/div>/gi, '\n');
    md = md.replace(/<div[^>]*>/gi, '');
    
    md = md.replace(/<[^>]+>/g, '');
    
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    
    return md;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const container = document.getElementById('text-display-container');
    if (!container || !data) return;
    
    const cleanHtml = getCleanHtml(container);
    const markdown = htmlToMarkdown(cleanHtml);
    
    const filename = `${data.tractate}_${data.span || data.page}.md`.replace(/[^a-zA-Z0-9._-]/g, '_');
    downloadFile(markdown, filename, 'text/markdown');
  };

  const handleExportHtml = () => {
    const container = document.getElementById('text-display-container');
    if (!container || !data) return;
    
    const cleanHtml = getCleanHtml(container);
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.tractate} ${data.span || data.page}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    [dir="rtl"] { font-weight: bold; }
  </style>
</head>
<body>
${cleanHtml}
</body>
</html>`;
    
    const filename = `${data.tractate}_${data.span || data.page}.html`.replace(/[^a-zA-Z0-9._-]/g, '_');
    downloadFile(fullHtml, filename, 'text/html');
  };

  const renderSections = () => {
    if (!data || data.error) return null;

    const hebrewSections = data.hebrewSections || [];
    const englishSections = data.englishSections || [];
    const maxSections = Math.max(hebrewSections.length, englishSections.length);

    return (
      <div className="space-y-8">
        {data.span && (
          <div className="sticky top-0 bg-sepia-50 z-10 font-semibold text-lg border-b border-sepia-300 pb-2 mb-4 -mx-6 px-6 pt-2">
            {data.span}
          </div>
        )}
        
        {Array.from({ length: maxSections }).map((_, i) => {
          const hebrewText = hebrewSections[i] || '';
          const englishText = englishSections[i] || '';

          if (!hebrewText && !englishText) return null;

          // Process text using the same functions as the main Talmud app
          const formattedEnglish = formatEnglishText(englishText);
          const englishParagraphs = formattedEnglish.split('\n\n').filter(p => p.trim());

          const sectionNumber = i + 1;
          const sectionLabel = data.section ? `${data.page}:${data.section}` : `${data.page}:${sectionNumber}`;

          return (
            <div key={i} className="space-y-4">
              {hebrewText && (
                <div 
                  dir="rtl" 
                  className="text-gray-900"
                  style={{ 
                    fontFamily: 'Assistant, sans-serif', 
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    lineHeight: '1.15'
                  }}
                >
                  {hebrewText.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <p key={idx} style={{ margin: '0 0 12px 0', padding: 0, lineHeight: '1.15' }}>{line}</p>
                  ))}
                </div>
              )}
              
              {englishText && (
                <div 
                  className="text-gray-800"
                  style={{ 
                    fontFamily: 'Roboto, sans-serif', 
                    fontSize: '11pt',
                    lineHeight: '1.15'
                  }}
                >
                  {englishParagraphs.map((paragraph, idx) => (
                    <p 
                      key={idx}
                      style={{ margin: '0 0 12px 0', padding: 0, lineHeight: '1.15' }}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              )}
              
              {i < maxSections - 1 && <hr className="my-6" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Create chat context from fetched data
  const chatContext: ChatContext | undefined = data && !data.error ? {
    tractate: data.tractate,
    page: data.page,
    section: data.section,
    range: data.span,
    hebrewText: data.hebrewSections.join('\n\n'),
    englishText: data.englishSections.join('\n\n')
  } : undefined;

  return (
    <div className="min-h-screen bg-sepia-100">
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Sugya Viewer</h1>
        <Card className="mb-4 bg-sepia-50 border-sepia-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About This Tool</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-sepia-700 space-y-3">
            <p>
              This page displays Talmud text by a user-specified range, as opposed to the main Talmud reader, which always displays a single Talmud page. 
              You can specify a range using one of three options:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Dropdown Selection:</strong> Choose tractate and page, with an optional section</li>
              <li><strong>Sefaria URL:</strong> Paste a Sefaria URL (can span multiple pages, e.g., <code className="text-xs bg-sepia-200 px-1 rounded">https://www.sefaria.org/Berakhot.16b.18-17a.12</code>)</li>
              <li><strong>Blog Post Selection:</strong> Choose from a dropdown list of blog post titles and ranges of specific sugyot to auto-fill the Sefaria URL</li>
            </ul>
            <p>
              Use the AI assistant (at the bottom on mobile, on the right side on desktop) to explore the text.  The AI assistant will see the displayed Talmud text (Hebrew and English), and has access to 125 published Talmud & Tech blog posts.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Display Talmud Text by Custom Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Input Method</Label>
              <RadioGroup 
                value={inputMethod} 
                onValueChange={(value: "dropdown" | "url" | "blogpost") => setInputMethod(value)}
                data-testid="radio-input-method"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dropdown" id="dropdown" data-testid="radio-dropdown" />
                  <Label htmlFor="dropdown" className="cursor-pointer">Dropdown Selection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" data-testid="radio-url" />
                  <Label htmlFor="url" className="cursor-pointer">Sefaria URL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blogpost" id="blogpost" data-testid="radio-blogpost" />
                  <Label htmlFor="blogpost" className="cursor-pointer">Blog Post Selection</Label>
                </div>
              </RadioGroup>
            </div>

            {inputMethod === "dropdown" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tractate">Tractate</Label>
                  <Select value={tractate} onValueChange={setTractate}>
                    <SelectTrigger id="tractate" data-testid="select-tractate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tractates.map((t) => (
                        <SelectItem key={t} value={t} data-testid={`option-tractate-${t}`}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page">Page</Label>
                  <Select value={page} onValueChange={setPage}>
                    <SelectTrigger id="page" data-testid="select-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((p) => (
                        <SelectItem key={p} value={p} data-testid={`option-page-${p}`}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section (Optional)</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger id="section" data-testid="select-section">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="option-section-all">All sections</SelectItem>
                      {sections.map((s) => (
                        <SelectItem key={s} value={s.toString()} data-testid={`option-section-${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {inputMethod === "url" && (
              <div className="space-y-2">
                <Label htmlFor="sefaria-url">Sefaria URL</Label>
                <Input
                  id="sefaria-url"
                  placeholder="e.g., https://www.sefaria.org/Sanhedrin.43b.9"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-sefaria-url"
                />
              </div>
            )}

            {inputMethod === "blogpost" && (
              <BlogPostSelector
                onSelectPost={(location, blogUrl) => {
                  setUrl(locationToSefariaUrl(location));
                  setInputMethod("url");
                  setTimeout(() => {
                    handleFetch();
                  }, 100);
                }}
              />
            )}

            <Button 
              onClick={handleFetch} 
              className="w-full md:w-auto"
              data-testid="button-fetch"
            >
              <Search className="mr-2 h-4 w-4" />
              Fetch Text
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertDescription>
              {error instanceof Error ? error.message : 'An error occurred while fetching the text'}
            </AlertDescription>
          </Alert>
        )}

        {data?.error && (
          <Alert variant="destructive" data-testid="alert-data-error">
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        )}

        {data && !data.error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleSelectAll} 
                    variant="outline"
                    data-testid="button-select-all"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Select All Text (for copy/paste)
                  </Button>
                  
                  <Button 
                    onClick={handleExportMarkdown} 
                    variant="outline"
                    data-testid="button-export-md"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export .md
                  </Button>
                  
                  <Button 
                    onClick={handleExportHtml} 
                    variant="outline"
                    data-testid="button-export-html"
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Export .html
                  </Button>
                </div>

                {(inputMethod === "url" || inputMethod === "dropdown") && data && !data.error && (
                  <div className="text-sm text-sepia-700">
                    <span className="font-medium">Open in ChavrutAI: </span>
                    <a
                      href={`/talmud/${encodeURIComponent(data.tractate.toLowerCase())}/${data.page}${data.section ? `#section-${data.section}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline hover:opacity-80"
                    >
                      {data.tractate} {data.page}{data.section ? `:${data.section}` : ''}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                <div 
                  id="text-display-container"
                  className="bg-sepia-50 border border-sepia-200 rounded-lg p-6" 
                  data-testid="text-display-container"
                  style={{ 
                    fontSize: '12pt',
                    lineHeight: '1.15'
                  }}
                >
                  {renderSections()}
                </div>
              </CardContent>
            </Card>

            <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
              <ChatPanel context={chatContext} />
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

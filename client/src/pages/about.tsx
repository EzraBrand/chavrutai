import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SharedLayout } from "@/components/layout";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { ExternalLink, Rss, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { DafYomiWidget } from "@/components/DafYomiWidget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useCallback } from "react";
import DOMPurify from "dompurify";

interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content?: string;
  author?: string;
}

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'div', 'span', 'a', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'dir', 'style', 'id', 'data-component-name'],
  });
};

const isMainlyHebrew = (text: string): boolean => {
  const hebrewChars = text.match(/[\u0590-\u05FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  const totalChars = hebrewChars.length + latinChars.length;
  if (totalChars === 0) return false;
  return hebrewChars.length / totalChars > 0.5;
};

const isEllipsisOrPunctuation = (text: string): boolean => {
  const cleaned = text.replace(/[\s\u00A0]/g, '');
  return /^[\[\]\(\)\.…,;:!?\-–—]+$/.test(cleaned);
};

const cleanHebrewElement = (el: HTMLElement) => {
  el.style.fontStyle = 'normal';
  el.style.quotes = 'none';
  
  const blockquote = el.closest('blockquote');
  if (blockquote) {
    (blockquote as HTMLElement).style.fontStyle = 'normal';
    (blockquote as HTMLElement).style.quotes = 'none';
    const beforeStyle = document.createElement('style');
    beforeStyle.textContent = `blockquote[data-hebrew-cleaned]::before, blockquote[data-hebrew-cleaned]::after { content: none !important; }`;
    if (!document.head.querySelector('[data-hebrew-blockquote-style]')) {
      beforeStyle.setAttribute('data-hebrew-blockquote-style', 'true');
      document.head.appendChild(beforeStyle);
    }
    blockquote.setAttribute('data-hebrew-cleaned', 'true');
  }
};

const applyRtlToHebrewElements = (container: HTMLElement) => {
  const elements = container.querySelectorAll('p, blockquote, li, h1, h2, h3, h4, h5, h6, div.footnote-content');
  let previousWasHebrew = false;
  
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const text = htmlEl.textContent || '';
    
    if (isMainlyHebrew(text)) {
      htmlEl.setAttribute('dir', 'rtl');
      htmlEl.style.textAlign = 'right';
      cleanHebrewElement(htmlEl);
      previousWasHebrew = true;
    } else if (isEllipsisOrPunctuation(text) && previousWasHebrew) {
      htmlEl.setAttribute('dir', 'rtl');
      htmlEl.style.textAlign = 'right';
      htmlEl.style.fontStyle = 'normal';
      cleanHebrewElement(htmlEl);
    } else {
      previousWasHebrew = false;
    }
  });
};

export default function About() {
  useSEO(generateSEOData.aboutPage());
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [expandedContent, setExpandedContent] = useState<Set<number>>(new Set());
  const [visiblePostsCount, setVisiblePostsCount] = useState(5);

  const { data: rssFeed, isLoading: rssLoading } = useQuery<{
    items: RssFeedItem[];
  }>({
    queryKey: ["/api/rss-feed-full"],
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const togglePost = (index: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleContentExpansion = (index: number) => {
    setExpandedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const extractFirst3Paragraphs = (html: string): { preview: string; hasMore: boolean } => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll('p');
    if (paragraphs.length <= 3) {
      return { preview: html, hasMore: false };
    }
    const previewDiv = document.createElement('div');
    for (let i = 0; i < 3; i++) {
      previewDiv.appendChild(paragraphs[i].cloneNode(true));
    }
    return { preview: previewDiv.innerHTML, hasMore: true };
  };

  const loadMorePosts = () => {
    setVisiblePostsCount(prev => Math.min(prev + 5, 20));
  };

  const setContentRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    if (!el) return;
    
    applyRtlToHebrewElements(el);
    
    const footnoteAnchors = el.querySelectorAll('a[id^="footnote-anchor-"]');
    footnoteAnchors.forEach((anchor) => {
      const htmlAnchor = anchor as HTMLAnchorElement;
      const targetId = htmlAnchor.getAttribute('href')?.replace('#', '');
      
      htmlAnchor.style.cssText = `
        color: #3b82f6;
        text-decoration: none;
        font-size: 0.75em;
        vertical-align: super;
        font-weight: 600;
        cursor: pointer;
        position: relative;
      `;
      
      if (targetId) {
        const footnoteEl = el.querySelector(`#${CSS.escape(targetId)}`);
        const footnoteContainer = footnoteEl?.closest('.footnote');
        const footnoteContent = footnoteContainer?.querySelector('.footnote-content');
        if (footnoteContent) {
          const footnoteText = footnoteContent.textContent?.trim() || '';
          const previewText = footnoteText.length > 200 ? footnoteText.slice(0, 200) + '...' : footnoteText;
          
          const tooltip = document.createElement('div');
          tooltip.className = 'footnote-tooltip';
          tooltip.textContent = previewText;
          tooltip.style.cssText = `
            display: none;
            position: fixed;
            background: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            line-height: 1.4;
            max-width: 300px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-weight: normal;
            pointer-events: none;
          `;
          
          htmlAnchor.addEventListener('mouseenter', () => {
            const rect = htmlAnchor.getBoundingClientRect();
            const tooltipWidth = 300;
            
            let left = rect.left + rect.width / 2 - tooltipWidth / 2;
            if (left < 10) left = 10;
            if (left + tooltipWidth > window.innerWidth - 10) {
              left = window.innerWidth - tooltipWidth - 10;
            }
            
            let top = rect.top - 8;
            
            tooltip.style.left = `${left}px`;
            tooltip.style.bottom = `${window.innerHeight - top}px`;
            tooltip.style.display = 'block';
            document.body.appendChild(tooltip);
          });
          htmlAnchor.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            if (tooltip.parentElement === document.body) {
              document.body.removeChild(tooltip);
            }
          });
        }
      }
    });
    
    const footnoteBackLinks = el.querySelectorAll('.footnote a.footnote-number');
    footnoteBackLinks.forEach((link) => {
      const htmlLink = link as HTMLAnchorElement;
      htmlLink.style.cssText = `
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        margin-right: 0.5rem;
      `;
    });
    
    const footnoteDivs = el.querySelectorAll('.footnote');
    if (footnoteDivs.length > 0) {
      const firstFootnote = footnoteDivs[0] as HTMLElement;
      const divider = document.createElement('div');
      divider.innerHTML = `
        <div style="margin-top: 2rem; margin-bottom: 1rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
          <h4 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin: 0;">Footnotes</h4>
        </div>
      `;
      firstFootnote.parentNode?.insertBefore(divider, firstFootnote);
    }
    
    footnoteDivs.forEach((footnote) => {
      const htmlFootnote = footnote as HTMLElement;
      htmlFootnote.style.cssText = `
        font-size: 0.875rem;
        color: #6b7280;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
      `;
      
      const backLink = document.createElement('a');
      backLink.textContent = '↩ Back to text';
      backLink.style.cssText = `
        display: inline-block;
        margin-left: 0.5rem;
        color: #3b82f6;
        text-decoration: none;
        font-size: 0.75rem;
        cursor: pointer;
      `;
      
      const footnoteNumberLink = htmlFootnote.querySelector('a.footnote-number');
      if (footnoteNumberLink) {
        const anchorId = footnoteNumberLink.getAttribute('href')?.replace('#', '');
        if (anchorId) {
          backLink.addEventListener('click', (e) => {
            e.preventDefault();
            const targetAnchor = el.querySelector(`#${CSS.escape(anchorId)}`);
            if (targetAnchor) {
              targetAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const htmlTarget = targetAnchor as HTMLElement;
              htmlTarget.style.transition = 'background-color 0.3s';
              htmlTarget.style.backgroundColor = '#dbeafe';
              setTimeout(() => {
                htmlTarget.style.backgroundColor = 'transparent';
              }, 1500);
            }
          });
        }
      }
      
      const footnoteContentDiv = htmlFootnote.querySelector('.footnote-content');
      if (footnoteContentDiv) {
        footnoteContentDiv.appendChild(backLink);
      }
    });
  }, []);

  return (
    <SharedLayout variant="simple" mainMaxWidth="container">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            About ChavrutAI
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A free platform for studying classical Jewish texts in Hebrew and
            English
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What is ChavrutAI?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a free website for studying the Babylonian Talmud
                and Tanakh (Hebrew Bible). It displays Hebrew text alongside
                English translation, making these classical texts accessible to
                learners at all levels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're new to Talmud study or an experienced learner,
                ChavrutAI provides a clean, distraction-free reading experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Available Texts
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Babylonian Talmud
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    All 37 tractates with standard page numbering based on the
                    standard printed edition. Navigate by Seder (order),
                    tractate, chapter, or individual page.
                  </p>
                  <Link
                    href="/talmud"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-talmud-contents"
                  >
                    Browse Talmud Contents
                  </Link>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Tanakh (Hebrew Bible)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Torah, Prophets, and Writings with chapter-by-chapter
                    navigation. Each book includes Hebrew text with English
                    translation.
                  </p>
                  <Link
                    href="/bible"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-tanakh-contents"
                  >
                    Browse Tanakh Contents
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
                <AccordionItem value="free">
                  <AccordionTrigger className="text-left">
                    Is ChavrutAI free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, ChavrutAI is completely free to use. There are no subscriptions, 
                    paywalls, or hidden costs. All texts and features are accessible to everyone.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="translation">
                  <AccordionTrigger className="text-left">
                    Where does the translation come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The English translations are sourced from the Sefaria library, which uses 
                    Rabbi Adin Steinsaltz's acclaimed translation of the Babylonian Talmud 
                    and various translations for the Tanakh. ChavrutAI is not affiliated with Sefaria.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="different">
                  <AccordionTrigger className="text-left">
                    How is ChavrutAI different from other Talmud sites?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    ChavrutAI focuses on providing a clean, distraction-free reading experience 
                    with thoughtful text processing. It applies targeted improvements to make 
                    the original text and its translations more accessible while preserving accuracy. Features include 
                    splitting into new lines by clause, term highlighting, customizable fonts and themes, and study tools like 
                    the Sugya Viewer and Biblical Citations Index.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="processing">
                  <AccordionTrigger className="text-left">
                    What text processing improvements are made?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    ChavrutAI applies carefully targeted terminology updates to make the text 
                    more accessible and accurate. For example, archaic terms like "phylacteries" become 
                    "tefillin," lengthy phrases like "The Holy One, Blessed be He" become 
                    simply "God," and euphemistic language is simplified to match the 
                    directness of the original. These changes reduce visual clutter while 
                    bringing readers closer to the original Hebrew terminology.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customize">
                  <AccordionTrigger className="text-left">
                    How do I customize my reading experience?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Use the menu (hamburger icon) in the top-left corner to access settings. 
                    You can choose from multiple themes (Paper, White, Dark, High Contrast), 
                    adjust text size, select Hebrew and English fonts, switch between 
                    side-by-side or stacked layouts, and enable term highlighting for 
                    concepts, rabbi names, and place names.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ai">
                  <AccordionTrigger className="text-left">
                    Where is the AI?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The AI features are still in beta. You can try the beta version on the{" "}
                    <Link href="/sugya-viewer" className="text-blue-600 hover:text-blue-800 underline">
                      Sugya Viewer page
                    </Link>
                    . After you select a page (or range), the AI chat option will appear there.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="roadmap">
                  <AccordionTrigger className="text-left">
                    What major features are on the roadmap?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-2">Planned major features include:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li><strong>Precise Hebrew–English alignment</strong>, clause by clause.</li>
                      <li><strong>Term mapping and explanation</strong> for technical vocabulary.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bold-text">
                  <AccordionTrigger className="text-left">
                    What do bold vs. non-bold text mean on the English side of the Talmud page?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Bold</strong> text is the direct translation.</li>
                      <li><strong>Non-bold</strong> text is the modern <strong>Steinsaltz edition</strong> running commentary. This running commentary supplies background, identifies allusive sources, and articulates the interpretive context that is implicit in the terse Talmudic style, drawing on the broader sugya and rabbinic sources, and on traditional commentators (especially Rashi).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="difficulty">
                  <AccordionTrigger className="text-left">
                    Is it true that the Talmud is very difficult to understand?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Some parts are, and some parts aren't. For a discussion (and correctives to other common misconceptions), see my post:{" "}
                    <a
                      href="https://www.ezrabrand.com/p/beyond-the-mystique-correcting-common"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Beyond the Mystique: Correcting Common Misconceptions About the Talmud, and Pathways to Accessibility
                    </a>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="controversial">
                  <AccordionTrigger className="text-left">
                    What does the Talmud say about non-Jews and Jesus?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    For discussion and context, see my post:{" "}
                    <a
                      href="https://www.ezrabrand.com/p/pt1-trending-talmud-top-queries-popular"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Trending Talmud: Top Queries, Popular Posts, and Plain Readings of Controversial Talmudic Passages
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Featured Articles from My 'Talmud & Tech' Blog About Building ChavrutAI
              </h2>
              <div className="space-y-3">
                <a
                  href="https://www.ezrabrand.com/p/chavrutais-talmud-translation-processing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-translation-processing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI's Talmud Translation Processing Approach
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dec 29, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
                <a
                  href="https://www.ezrabrand.com/p/chavrutais-new-homepage-a-fresh-entry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-new-homepage"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI's New Homepage: A Fresh Entry Point for the Study of Classical Jewish Texts
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dec 28, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
                <a
                  href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-launch-review"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI Talmud Web App Launch: Review and Comparison with Similar Platforms
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aug 05, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About This Project
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a project of{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>
                . Text content is sourced from the Sefaria library (ChavrutAI is
                not affiliated with Sefaria).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For questions, feedback, or to report an issue:{" "}
                <a
                  href="mailto:ezra@chavrutai.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ezra@chavrutai.com
                </a>
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Stay Updated
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Subscribe to the{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>{" "}
                blog for updates on ChavrutAI and analyses of Talmud and other
                Jewish classical texts:
              </p>
              <div className="flex justify-center">
                <iframe
                  src="https://www.ezrabrand.com/embed"
                  width="480"
                  height="320"
                  style={{ border: "1px solid #EEE", background: "white" }}
                  frameBorder="0"
                  scrolling="no"
                  data-testid="subscribe-iframe"
                ></iframe>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <Rss className="w-5 h-5 text-orange-500" />
                  Latest Posts
                </h3>
                {rssLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-secondary/50 rounded-lg p-4"
                      >
                        <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-secondary rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : rssFeed?.items && rssFeed.items.length > 0 ? (
                  <div className="space-y-4" data-testid="rss-feed-list">
                    {rssFeed.items.slice(0, visiblePostsCount).map((item, index) => {
                      const isExpanded = expandedPosts.has(index);
                      const isContentExpanded = expandedContent.has(index);
                      const contentData = item.content ? extractFirst3Paragraphs(item.content) : null;
                      return (
                        <div
                          key={index}
                          className="bg-secondary/30 rounded-lg border border-border overflow-hidden"
                          data-testid={`rss-item-${index}`}
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                            onClick={() => togglePost(index)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-sm font-semibold text-muted-foreground w-6 flex-shrink-0">
                                {index + 1}.
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground text-sm leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(item.pubDate)}
                                  </span>
                                  {item.author && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {item.author}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-secondary rounded transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Open original post"
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </a>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && item.content && contentData && (
                            <div className="border-t border-border">
                              <div
                                ref={setContentRef(index)}
                                className="p-4 prose prose-sm max-w-none dark:prose-invert prose-blockquote:not-italic prose-blockquote:font-normal [&_blockquote_p:first-of-type]:before:content-none [&_blockquote_p:last-of-type]:after:content-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: sanitizeHtml(isContentExpanded ? item.content : contentData.preview) 
                                }}
                              />
                              {contentData.hasMore && !isContentExpanded && (
                                <div className="px-4 pb-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleContentExpansion(index);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                                  >
                                    Load more of the post...
                                  </button>
                                </div>
                              )}
                              {contentData.hasMore && isContentExpanded && (
                                <div className="px-4 pb-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleContentExpansion(index);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                                  >
                                    Show less...
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {rssFeed.items.length > visiblePostsCount && visiblePostsCount < 20 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={loadMorePosts}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                        >
                          Load more posts...
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No posts available.
                  </p>
                )}
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <DafYomiWidget />
            </section>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}

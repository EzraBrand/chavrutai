import { useEffect, useState } from "react";
import { ExternalLink as ExternalLinkIcon, Link as LinkIcon, Check } from "lucide-react";
import { usePreferences } from "@/context/preferences-context";
import { processBibleHebrewText, processBibleEnglishText, formatEnglishText } from "@/lib/text-processing";
import { getBibleVerseLinks, type BibleReference } from "@/lib/bible-external-links";
import type { BibleText } from "@/types/bible";

interface BibleTextDisplayProps {
  text: BibleText;
}

export function BibleTextDisplay({ text }: BibleTextDisplayProps) {
  const { preferences } = usePreferences();
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  const copyVerseUrl = (verseNumber: number) => {
    const url = `${window.location.origin}${window.location.pathname}#${verseNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedVerse(verseNumber);
      setTimeout(() => setCopiedVerse(null), 2000);
    });
  };

  // Get font classes based on selected fonts
  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;
  const getEnglishFontClass = () => `english-font-${preferences.englishFont}`;

  // Handle verse hash navigation (e.g., #5 or legacy #verse-5 scrolls to verse 5)
  useEffect(() => {
    const parseVerseFromHash = (hash: string): number | null => {
      if (!hash) return null;
      let verseNumber: number | null = null;
      if (hash.startsWith('#verse-')) {
        verseNumber = parseInt(hash.replace('#verse-', ''), 10);
      } else if (/^#\d+$/.test(hash)) {
        verseNumber = parseInt(hash.slice(1), 10);
      }
      if (verseNumber === null || isNaN(verseNumber) || verseNumber < 1) return null;
      return verseNumber;
    };

    const scrollToVerse = () => {
      const hash = window.location.hash;
      const verseNumber = parseVerseFromHash(hash);
      if (verseNumber === null) return;

      // Redirect legacy #verse-N to short #N format
      if (hash.startsWith('#verse-')) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${verseNumber}`);
      }

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const verseElement = document.getElementById(`${verseNumber}`);
        if (verseElement) {
          verseElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    };

    // Scroll on initial load
    scrollToVerse();

    // Listen for hash changes
    window.addEventListener('hashchange', scrollToVerse);
    return () => window.removeEventListener('hashchange', scrollToVerse);
  }, [text.book, text.chapter]);

  // Copy-paste handler to preserve formatting and ensure Hebrew comes before English
  useEffect(() => {
    const container = document.querySelector('[data-testid="bible-text-display"]');
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

      // Remove verse headers (e.g., "verse 1", "verse 2", etc.) - targets the verse header container
      const removeVerseHeaders = (element: HTMLElement): void => {
        // Remove entire verse header divs (contains verse label + copy button + external links)
        const verseHeaders = element.querySelectorAll('[data-testid^="verse-header-"]');
        verseHeaders.forEach(header => header.remove());
      };

      removeVerseHeaders(tempDiv);

      // Reorder content so Hebrew comes before English (working only on the clone)
      const reorderHebrewFirst = (element: HTMLElement): void => {
        const textDisplays = element.querySelectorAll('.bible-text-display, .text-display');
        textDisplays.forEach(display => {
          const englishCol = display.querySelector('.lg\\:order-1');
          const hebrewCol = display.querySelector('.lg\\:order-2');
          
          if (englishCol && hebrewCol && englishCol.parentNode === hebrewCol.parentNode) {
            const parent = englishCol.parentNode;
            if (parent && parent.contains(hebrewCol) && parent.contains(englishCol)) {
              // Clone Hebrew and insert it before English
              const hebrewClone = hebrewCol.cloneNode(true);
              parent.insertBefore(hebrewClone, englishCol);
              // Remove the original Hebrew position (which is after English)
              parent.removeChild(hebrewCol);
            }
          }
        });
      };

      reorderHebrewFirst(tempDiv);

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
            
            // Check for explicit dir attribute OR hebrew-text class
            const isHebrew = (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') || 
                            el.classList.contains('hebrew-text') ||
                            el.closest('.hebrew-text');
            
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
  }, [text]);

  // Safety check for verses array
  if (!text.verses || !Array.isArray(text.verses)) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <p className="text-muted-foreground">Loading verses...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6" data-testid="bible-text-display">
      <div className="space-y-8">
        {text.verses.map((verse) => {
          // Skip empty verses
          if (verse.hebrewSegments.length === 0 && verse.englishSegments.length === 0) {
            return null;
          }

          return (
            <div
              key={verse.verseNumber}
              id={`${verse.verseNumber}`}
              className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
            >
              {/* Verse Header - External Links */}
              {(() => {
                const verseRef: BibleReference = { book: text.book, chapter: text.chapter, verse: verse.verseNumber };
                const verseLinks = getBibleVerseLinks(verseRef);
                return (
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap" data-testid={`verse-header-${verse.verseNumber}`}>
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      verse {verse.verseNumber}
                    </span>
                    <button
                      onClick={() => copyVerseUrl(verse.verseNumber)}
                      className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                      title={`Copy link to verse ${verse.verseNumber}`}
                    >
                      {copiedVerse === verse.verseNumber ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-green-500 text-xs">Copied!</span>
                        </>
                      ) : (
                        <LinkIcon className="w-3 h-3" />
                      )}
                    </button>
                    {verseLinks.map((link) => (
                      <span key={link.name} className="contents">
                        <span className="w-px h-4 bg-border" />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                          data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}-verse-${verse.verseNumber}`}
                          title={link.description}
                        >
                          {link.name}
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div className="text-display bible-text-display flex flex-col lg:flex-row gap-6">
                {/* English Segments Column (First on Mobile, Left Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-1">
                  {verse.englishSegments.length > 0 && (
                    <div className="english-text text-foreground space-y-3">
                      {verse.englishSegments.map((segment, index) => (
                        <div
                          key={index}
                          dangerouslySetInnerHTML={{ __html: formatEnglishText(processBibleEnglishText(segment)) }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hebrew Segments Column (Second on Mobile, Right Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-2">
                  {verse.hebrewSegments.length > 0 && (
                    <div className={`hebrew-text text-foreground ${getHebrewFontClass()} space-y-3`}>
                      {verse.hebrewSegments.map((segment, segIndex) => (
                        <div key={segIndex}>
                          <p className="leading-relaxed">
                            {processBibleHebrewText(segment)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

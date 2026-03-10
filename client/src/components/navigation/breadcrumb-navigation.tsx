import { Home } from "lucide-react";
import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findChapterForFolio, getChapterFirstPageUrl } from "@/lib/chapter-data";

interface BreadcrumbNavigationItem {
  label: string | React.ReactNode;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbNavigationItem[];
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center">
              <Home className="h-4 w-4" />
              <span className="sr-only">Contents</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {/* Separator after home */}
        {items.length > 0 && <BreadcrumbSeparator />}
        
        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href} title={typeof item.label === 'string' ? item.label : undefined}>
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage title={typeof item.label === 'string' ? item.label : undefined}>
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            
            {/* Separator between items (not after the last item) */}
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Helper function to generate breadcrumb items for different page types
export const breadcrumbHelpers = {
  // Tractate view breadcrumbs (main text page)
  tractateView: (tractate: string, folio: number, side: 'a' | 'b'): BreadcrumbNavigationItem[] => {
    const items: BreadcrumbNavigationItem[] = [
      { label: "Talmud", href: "/talmud" },
      { label: tractate, href: `/talmud/${encodeURIComponent(tractate.toLowerCase())}` }
    ];
    
    // Find the chapter for this folio
    const chapter = findChapterForFolio(tractate, folio, side);
    if (chapter) {
      items.push({ 
        label: (
          <>
            Chapter {chapter.number}: <em>{chapter.englishName}</em>
          </>
        ), 
        href: getChapterFirstPageUrl(tractate, chapter)
      });
    }
    
    // Add the current folio
    items.push({ label: `${folio}${side}` });
    
    return items;
  },

  // Contents page breadcrumbs
  contents: (): BreadcrumbNavigationItem[] => [
    { label: "Contents" }
  ],

  // Tractate contents page breadcrumbs  
  tractateContents: (tractate: string): BreadcrumbNavigationItem[] => [
    { label: "Talmud", href: "/talmud" },
    { label: tractate },
  ],

  // About page breadcrumbs
  about: (): BreadcrumbNavigationItem[] => [
    { label: "About" }
  ],

  // Suggested pages breadcrumbs
  suggestedPages: (): BreadcrumbNavigationItem[] => [
    { label: "Suggested Pages" }
  ],

  // Sitemap page breadcrumbs
  sitemap: (): BreadcrumbNavigationItem[] => [
    { label: "Sitemap" }
  ]
};
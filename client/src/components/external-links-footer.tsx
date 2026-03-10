import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { getPageLinks, type TalmudReference } from "@/lib/external-links";

interface ExternalLinksFooterProps {
  tractate: string;
  folio: number;
  side: 'a' | 'b';
}

export function ExternalLinksFooter({ tractate, folio, side }: ExternalLinksFooterProps) {
  const reference: TalmudReference = { tractate, folio, side };
  const pageLinks = getPageLinks(reference);
  
  return (
    <div className="mt-8 pt-6 border-t border-border" data-testid="external-links-footer">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-lg font-semibold text-foreground">External Links:</span>
        {pageLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            data-testid={`link-external-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            title={link.description}
          >
            {link.name}
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    </div>
  );
}

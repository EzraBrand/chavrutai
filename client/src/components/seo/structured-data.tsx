interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Predefined structured data generators
export const structuredDataGenerators = {
  breadcrumbs: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }),

  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ChavrutAI",
    "description": "Digital platform for studying Jewish texts with modern technology",
    "url": window.location.origin,
    "logo": `${window.location.origin}/favicon-192x192.png`,
    "foundingDate": "2025",
    "sameAs": [
      "https://github.com/EzraBrand/chavrutai",
      "https://www.ezrabrand.com/"
    ]
  }),

  educationalContent: (tractate: string, folio: number, side: 'a' | 'b') => ({
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    "name": `${tractate} ${folio}${side}`,
    "description": `Study page from the Babylonian Talmud tractate ${tractate}`,
    "educationalLevel": "Advanced",
    "about": {
      "@type": "Book",
      "name": "Babylonian Talmud",
      "author": "Talmudic Sages",
      "inLanguage": ["he", "en"],
      "genre": "Religious Text"
    }
  })
};
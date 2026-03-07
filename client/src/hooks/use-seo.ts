import { useEffect } from "react";
import { getTractateSlug } from "@shared/tractates";

// Performance monitoring for Core Web Vitals
const reportWebVitals = (metric: any) => {
  // In production, you might want to send this to analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      non_interaction: true,
    });
  }
};

interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogType?: string;
  keywords?: string;
  structuredData?: object;
  robots?: string;
  noindex?: boolean;
}

export function useSEO(seoData: SEOData) {
  useEffect(() => {
    // Note: Old /tractate/ URLs are now 301 redirected to /talmud/ at the server level
    // No client-side noindex overrides needed - rely on canonical URLs and redirects
    
    // Update title
    document.title = seoData.title;

    // Ensure essential meta tags exist
    const ensureMetaTag = (
      name: string,
      content: string,
      property?: string,
    ) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Essential viewport and encoding meta tags
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0");
      document.head.appendChild(viewport);
    }

    if (!document.querySelector("meta[charset]")) {
      const charset = document.createElement("meta");
      charset.setAttribute("charset", "UTF-8");
      document.head.prepend(charset);
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: string) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Update canonical URL
    const updateCanonical = (url: string) => {
      let canonical = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", url);
    };

    // Update structured data
    const updateStructuredData = (data: object) => {
      // Remove existing structured data
      const existing = document.querySelector(
        'script[type="application/ld+json"]',
      );
      if (existing) {
        existing.remove();
      }

      // Add new structured data
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    // Apply updates
    updateMeta("description", seoData.description);
    if (seoData.keywords) updateMeta("keywords", seoData.keywords);

    // Robots meta tag
    const robotsContent = seoData.noindex
      ? "noindex, nofollow"
      : seoData.robots || "index, follow";
    updateMeta("robots", robotsContent);

    // Open Graph tags
    updateMeta("og:title", seoData.ogTitle || seoData.title, "property");
    updateMeta(
      "og:description",
      seoData.ogDescription || seoData.description,
      "property",
    );
    updateMeta("og:type", seoData.ogType || "website", "property");
    updateMeta("og:site_name", "ChavrutAI", "property");
    updateMeta("og:locale", "en_US", "property");
    updateMeta("og:locale:alternate", "he_IL", "property");
    updateMeta(
      "og:image",
      `${window.location.origin}/og-image.png`,
      "property",
    );
    updateMeta("og:image:alt", seoData.ogTitle || seoData.title, "property");
    updateMeta("og:image:width", "512", "property");
    updateMeta("og:image:height", "512", "property");
    updateMeta("og:image:type", "image/png", "property");
    if (seoData.ogUrl) updateMeta("og:url", seoData.ogUrl, "property");

    // Twitter tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", seoData.ogTitle || seoData.title);
    updateMeta(
      "twitter:description",
      seoData.ogDescription || seoData.description,
    );
    updateMeta("twitter:image", `${window.location.origin}/og-image.png`);
    updateMeta("twitter:image:alt", seoData.ogTitle || seoData.title);
    updateMeta("twitter:site", "@ChavrutAI");

    // Canonical URL
    if (seoData.canonical) {
      updateCanonical(seoData.canonical);
    }

    // Structured data
    if (seoData.structuredData) {
      updateStructuredData(seoData.structuredData);
    }

  }, [seoData]);
}

// Helper function to generate SEO data for different page types
export const generateSEOData = {
  // This is actually for tractate-view pages, should be noindexed
  folioPage: (tractate: string, folio: number, side: "a" | "b"): SEOData => ({
    title: `${tractate} ${folio}${side} - Talmud Bavli | ChavrutAI`,
    description: `Study ${tractate} ${folio}${side} - Babylonian Talmud with bilingual Hebrew-English text, navigation, and study tools. Free on ChavrutAI.`,
    keywords: `Talmud, ${tractate}, folio ${folio}${side}, Jewish texts, Hebrew, Aramaic, study, ChavrutAI, Babylonian Talmud`,
    canonical: `${window.location.origin}/talmud/${getTractateSlug(tractate)}/${folio}${side}`,
    ogType: "article",
    ogTitle: `${tractate} ${folio}${side} - Study Talmud Bavli`,
    ogDescription: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with Hebrew-English bilingual text on ChavrutAI.`,
    ogUrl: `${window.location.origin}/talmud/${getTractateSlug(tractate)}/${folio}${side}`,
    noindex: false, // Allow indexing of all folio pages
    robots: "index, follow", // Allow search engine indexing
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${tractate} ${folio}${side} - Talmud Bavli`,
      description: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with bilingual Hebrew-English text`,
      url: `${window.location.origin}/talmud/${getTractateSlug(tractate)}/${folio}${side}`,
      dateModified: new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
        logo: {
          "@type": "ImageObject",
          url: `${window.location.origin}/favicon-192x192.png`,
        },
      },
      mainEntity: {
        "@type": "Book",
        name: `${tractate} - Babylonian Talmud`,
        alternateName: `${tractate} - תלמוד בבלי`,
        bookFormat: "EBook",
        inLanguage: ["he", "en", "arc"],
        genre: "Religious Text",
        author: "Talmudic Sages",
        isPartOf: {
          "@type": "BookSeries",
          name: "Babylonian Talmud",
        },
      },
    },
  }),

  // Main homepage/contents page
  homePage: (): SEOData => ({
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description:
      "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    keywords:
      "Talmud online, study Talmud free, Babylonian Talmud Hebrew English, digital Talmud study, Jewish learning, ChavrutAI",
    canonical: `${window.location.origin}/`,
    ogTitle: "Study Talmud Online Free - Digital Platform",
    ogDescription:
      "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    ogUrl: `${window.location.origin}/`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${window.location.origin}/#website`,
          name: "ChavrutAI",
          description:
            "Digital platform for studying Jewish texts with modern technology",
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/talmud/{search_term}`,
            "query-input": "required name=search_term",
          },
          publisher: {
            "@id": `${window.location.origin}/#organization`,
          },
        },
        {
          "@type": "Organization",
          "@id": `${window.location.origin}/#organization`,
          name: "ChavrutAI",
          url: window.location.origin,
          foundingDate: "2025",
          logo: {
            "@type": "ImageObject",
            url: `${window.location.origin}/favicon-192x192.png`,
          },
          sameAs: [
            "https://github.com/EzraBrand/chavrutai-platform",
            "https://github.com/EzraBrand/replit-chavrutai-2",
            "https://www.ezrabrand.com/",
            "https://x.com/ChavrutAI",
          ],
        },
        {
          "@type": "SiteNavigationElement",
          "@id": `${window.location.origin}/#navigation`,
          name: "Main Navigation",
          url: window.location.origin,
          hasPart: [
            {
              "@type": "SiteNavigationElement",
              name: "Famous Pages",
              description:
                "Start with the most significant and well-known Talmud passages",
              url: `${window.location.origin}/suggested-pages`,
            },
            {
              "@type": "SiteNavigationElement",
              name: "Berakhot",
              description: "Begin your study with blessings and prayers",
              url: `${window.location.origin}/talmud/berakhot`,
            },
            {
              "@type": "SiteNavigationElement",
              name: "Shabbat",
              description: "Sabbath laws and stories",
              url: `${window.location.origin}/talmud/shabbat`,
            },
            {
              "@type": "SiteNavigationElement",
              name: "Sanhedrin",
              description: "Ethics and justice",
              url: `${window.location.origin}/talmud/sanhedrin`,
            },
            {
              "@type": "SiteNavigationElement",
              name: "About ChavrutAI",
              description: "Learn about our platform and features",
              url: `${window.location.origin}/about`,
            },
          ],
        },
        {
          "@type": "EducationalOrganization",
          name: "Digital Talmud Learning Platform",
          description: "Platform specializing in Talmudic religious studies",
          educationalLevel: "Advanced",
          subjectOf: {
            "@type": "Book",
            name: "Babylonian Talmud",
            genre: "Religious Text",
          },
          mainEntityOfPage: {
            "@id": `${window.location.origin}/#website`,
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is ChavrutAI?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ChavrutAI is a free digital platform for studying the Babylonian Talmud with Hebrew-English bilingual text display and modern navigation tools.",
              },
            },
            {
              "@type": "Question",
              name: "Is ChavrutAI free to use?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, ChavrutAI is completely free to use for all learners. Access all 37 tractates of the Babylonian Talmud at no cost.",
              },
            },
            {
              "@type": "Question",
              name: "What languages does ChavrutAI support?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ChavrutAI displays text in Hebrew, Aramaic, and English, making it accessible to learners at all levels.",
              },
            },
          ],
        },
      ],
    },
  }),

  contentsPage: (): SEOData => ({
    title: "Talmud Study Guide - All 37 Tractates Organized | ChavrutAI",
    description:
      "Navigate through all tractates of the Babylonian Talmud organized by traditional Seder. Easy chapter breakdown with Hebrew-English text display.",
    keywords:
      "Talmud study guide, Babylonian Talmud tractates, Seder organization, Hebrew English Talmud, Jewish text navigation",
    canonical: `${window.location.origin}/talmud`,
    ogTitle: "Complete Talmud Study Guide - All Tractates",
    ogDescription:
      "Navigate through all tractates of the Babylonian Talmud organized by traditional Seder. Easy chapter breakdown with Hebrew-English text display.",
    ogUrl: `${window.location.origin}/talmud`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Talmud Bavli Contents",
      description: "Complete table of contents for the Babylonian Talmud",
      url: `${window.location.origin}/talmud`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "Babylonian Talmud",
        alternateName: "Talmud Bavli",
        inLanguage: ["he", "en", "arc"],
        genre: "Religious Text",
      },
    },
  }),

  tractatePage: (tractate: string): SEOData => ({
    title: `${tractate} Talmud - Complete Chapter Guide | ChavrutAI`,
    description: `Study ${tractate} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
    keywords: `${tractate} Talmud, ${tractate} chapters, Hebrew English ${tractate}, Talmud study online, Jewish learning`,
    canonical: `${window.location.origin}/talmud/${getTractateSlug(tractate)}`,
    ogTitle: `${tractate} Talmud - Complete Study Guide`,
    ogDescription: `Study ${tractate} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
    ogUrl: `${window.location.origin}/talmud/${getTractateSlug(tractate)}`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${tractate} - Talmud Bavli`,
      description: `Contents and navigation for ${tractate} tractate`,
      url: `${window.location.origin}/talmud/${getTractateSlug(tractate)}`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      isPartOf: {
        "@type": "Book",
        name: "Babylonian Talmud",
        alternateName: "Talmud Bavli",
        inLanguage: ["he", "en", "arc"],
        genre: "Religious Text",
      },
    },
  }),

  aboutPage: (): SEOData => ({
    title: "About ChavrutAI - Free Digital Talmud Learning Platform",
    description:
      "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
    keywords:
      "ChavrutAI about, free Talmud platform, digital Jewish learning, bilingual Talmud study, Jewish education technology",
    canonical: `${window.location.origin}/about`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About ChavrutAI",
      description: "Information about ChavrutAI digital Talmud study platform",
      mainEntity: {
        "@type": "Organization",
        name: "ChavrutAI",
        description:
          "Digital platform for studying Jewish texts with modern technology",
        url: window.location.origin,
        foundingDate: "2025",
        sameAs: [
          "https://github.com/EzraBrand/chavrutai",
          "https://www.ezrabrand.com/",
          "https://x.com/ChavrutAI",
        ],
      },
    },
  }),

  suggestedPages: (): SEOData => ({
    title: "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
    description:
      "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
    keywords:
      "famous Talmud pages, essential Talmud teachings, Hillel quotes, Jewish wisdom stories, beginner Talmud study",
    canonical: `${window.location.origin}/suggested-pages`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Suggested Talmud Pages",
      description:
        "A curated collection of the most significant and famous pages in the Babylonian Talmud",
      about: {
        "@type": "Book",
        name: "Babylonian Talmud",
        alternateName: "Talmud Bavli",
        inLanguage: ["he", "en", "arc"],
        genre: "Religious Text",
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  }),
};

import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Footer } from "@/components/footer";

export default function Changelog() {
  // SEO optimization
  useSEO({
    title: 'Changelog - ChavrutAI',
    description: 'Recent updates and improvements to ChavrutAI. Track new features, design enhancements, and user experience improvements for Talmud study.',
    keywords: 'ChavrutAI changelog, Talmud app updates, Jewish learning platform updates',
    canonical: `${window.location.origin}/changelog`,
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "ChavrutAI Changelog",
      description: "Recent updates and improvements to ChavrutAI digital Talmud study platform",
      url: `${window.location.origin}/changelog`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

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

      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sepia-800 dark:text-sepia-200 mb-2">
            Changelog
          </h1>
        
        <p className="text-sepia-600 dark:text-sepia-400 max-w-3xl">
          Recent updates and improvements.
        </p>
      </div>

      {/* Changelog Content */}
      <div className="bg-white dark:bg-sepia-900 rounded-lg shadow-lg p-6 max-w-4xl">
        
        {/* April 2026 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            April 2026
          </h2>

          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah: Al HaTorah External Link Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed incorrect Al HaTorah tractate names for 4 Mishnah tractates: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Taharot</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Tahorot</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Kelim</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Keilim</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Eduyot</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Eiduyot</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Chullin</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Chulin</code></li>
                <li>Al HaTorah uses different transliterations than Sefaria for these tractates, causing "This page does not exist" errors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* March 2026 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            March 2026
          </h2>

          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Dynamic Page Titles &amp; SEO Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed a structural bug where page meta titles would fall back to the generic homepage title whenever query parameters were present (e.g. dictionary letter browsing, search queries)</li>
                <li>Dictionary page now shows dynamic, context-aware titles — browsing letter ק shows "Jastrow Dictionary - Letter ק", searching shows the search term in the title</li>
                <li>Prevented future regressions by refactoring the server-side SEO function to always parse the URL pathname separately from query parameters before matching routes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Number Conversion: Algorithmic Parser</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Replaced a static lookup table of ~230 hard-coded number phrases with an algorithmic English cardinal number parser — fixing a bug where compound numbers like "a hundred and twenty three" were incorrectly split into "120 3" instead of "123"</li>
                <li>All compound forms now convert correctly, including hundreds + units ("seven hundred and forty five" → 745), census-style numbers ("two thousand three hundred and twenty two" → 2,322), and large numbers ("five thousand eight hundred and eighty-eight" → 5,888)</li>
                <li>Biblical inversion patterns continue to work ("five and twenty" → 25, "forty and two thousand three hundred and sixty" → 42,360)</li>
                <li>Standalone "one" and "two" are intentionally left unchanged — "one" is commonly used as a pronoun in rabbinic prose ("does one recite…"), and "two" reads more naturally as a word ("recites two blessings")</li>
                <li>Fractions, ordinals, and special idioms handled by the lookup table (e.g. "three and one-third" → 3⅓, "the fifth month" → the 5th month) are fully protected and unaffected</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jastrow Dictionary: Shareable URLs & Text Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Dictionary searches and letter browsing now update the URL (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/dictionary?q=כתב</code>), so you can share or bookmark specific lookups</li>
                <li>Long definitions now split into new lines where a period is followed by a hyperlinked reference (e.g. between "it). Bava" or "ten. Berakhot")</li>
                <li>Superscript letters used in Yerushalmi citations (ᵃ, ᵇ, ᶜ, ᵈ) are now converted to standard-size letters for readability</li>
                <li>Binyan (verb-form) abbreviations now display with full transliterations and colons (e.g. Af. becomes Af'el:, Pa. becomes Pa'el:)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah & Yerushalmi: External Links (Al HaTorah, Wikisource)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Mishnah reader</strong> now includes <strong>Al HaTorah</strong> and <strong>Hebrew Wikisource</strong> links at both the section level (next to each mishnah) and the page footer, in addition to the existing Sefaria links</li>
                <li>Section-level links point to the specific mishnah on each site (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">mishna.alhatorah.org/Full/Maaser_Sheni/5.9</code>)</li>
                <li>Page-level footer links point to the full chapter on Sefaria, Al HaTorah, and Hebrew Wikisource</li>
                <li><strong>Yerushalmi reader</strong> now includes an <strong>External Links</strong> footer at the bottom of each chapter page with links to <strong>Sefaria</strong> and <strong>Hebrew Wikisource</strong></li>
                <li>Wikisource links use Hebrew gematria for chapter and mishnah numbers (e.g. <span dir="rtl">משנה מעשר שני ה ט</span>, <span dir="rtl">ירושלמי ראש השנה ד</span>)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Talmud Bavli Chapter Names — Audit & Corrections</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed <strong>Hebrew chapter names</strong> across multiple tractates: corrected כל הצללים → כל הצלמים (Avodah Zarah 3), expanded abbreviations (ר׳ ישמעאל → רבי ישמעאל), completed truncated names (השוכר → השוכר את הפועל), and fixed spelling (תפלת → תפילת, אלו קשרים, ואלו הן הלוקין)</li>
                <li>Fixed <strong>English transliterations</strong> in Menachot chapters: Minchot → Menachot to match standard transliteration of מנחות</li>
                <li>Corrected transliteration errors across 10 tractate files: HaChabal → HaChoveil (Bava Kamma), Yesh Mutar → Yesh Mutarot (Yevamot), Almanah Nizont → Almanah Nizonet (Ketubot), Erusah → Arusah (Sotah), HaMafelet Chitchah → HaMapelet Chatikhah (Niddah), HaRo'ah Ktem → HaRo'ah Ketem (Niddah), Keytzad Mishtattfin → Keytzad Mishtatfin (Eruvin), HaKol Chaiyavin → HaKol Chayavin (Chagigah)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jerusalem Talmud (Yerushalmi) Reader</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>New <strong>Jerusalem Talmud reader</strong> covering all <strong>39 tractates</strong> across the four sedarim: Zeraim, Moed, Nashim, and Nezikin</li>
                <li>Three-level navigation: contents page by seder → tractate page with chapter list → parallel Hebrew-English chapter reader</li>
                <li>Hebrew text sourced from Sefaria; English translation: <strong>Heinrich W. Guggenheimer</strong> scholarly edition</li>
                <li>Side-by-side 50/50 layout matching the Mishnah reader, with halakhah-level section numbering</li>
                <li><strong>Collapsible footnotes panel</strong> — Guggenheimer's scholarly notes appear as a full-width row below both columns, collapsed by default with a "Notes (N)" toggle; footnote markers remain as superscripts in the text</li>
                <li>Per-halakhah <strong>"Sefaria" link</strong> using the correct 4-part <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Tractate.Chapter.1.Halakhah</code> URL format on <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">sefaria.org.il</code></li>
                <li>"View on Sefaria" link at the bottom of each chapter page</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Yerushalmi: Text Processing (Guggenheimer Edition)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Colon splitting</strong> — English text is split into separate lines on <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">: </code> (except when preceded by a digit, to preserve verse references like 1:1)</li>
                <li><strong>Bible book abbreviations expanded</strong> — 35 mappings covering the full Tanakh: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Gen.</code> → Genesis, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Lev.</code> → Leviticus, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Deut.</code> → Deuteronomy, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Ps.</code> → Psalms, etc. Expansion removes the period, preventing false line splits at abbreviations</li>
                <li><strong>Italic-wrapped abbreviation fix</strong> — Sefaria wraps abbreviations in <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">&lt;i&gt;Deut&lt;/i&gt;.</code> tags that prevented matching; the wrapper is now stripped before term replacement</li>
                <li><strong>Newline-inside-anchor fix</strong> — Sefaria sometimes embeds <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">\n</code> inside Bible citation anchor tags (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">&lt;i&gt;Deut&lt;/i&gt;.\n24:1</code>); these are normalized to spaces before splitting</li>
                <li><strong>Punctuation fixes</strong> — <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">?.</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">?</code> (removes redundant period after question marks)</li>
                <li><strong>Term normalizations</strong> applied to both main text and footnotes: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Rebbi → R'</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Qiddušin → Kiddushin</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Zeïra → Ze'ira</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Joḥanan → Yoḥanan</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Tosephta → Tosefta</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Babli → Bavli</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Yebamot → Yevamot</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Jehudah → Yehuda</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Simeon → Shimon</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">v. → verse</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Yerushalmi: Internal Link Conversion (Sefaria → ChavrutAI)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Sefaria-style relative hrefs in both main text and footnotes are automatically rewritten to ChavrutAI internal links</li>
                <li><strong>Yerushalmi</strong>: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/Jerusalem_Talmud_Kiddushin.4.2.4</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/yerushalmi/Kiddushin/4</code></li>
                <li><strong>Bavli</strong>: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/Berakhot.21a</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/Berakhot/21a</code></li>
                <li><strong>Bible</strong>: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/Deuteronomy.24.1</code> → <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/bible/Deuteronomy/24#1</code> (verse as hash anchor)</li>
                <li><strong>All other links</strong> (Rashi, Tosefta, Midrash, etc.) → converted to absolute <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">https://www.sefaria.org.il/...</code> links</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Yerushalmi: SEO & Discovery</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Home page updated to a <strong>4-column grid</strong>: Babylonian Talmud, Mishnah, Jerusalem Talmud, Tanakh</li>
                <li>Dedicated <strong>Yerushalmi XML sitemap</strong> covering all tractates and chapter pages, registered in the sitemap index</li>
                <li>Jerusalem Talmud links added to the <Link href="/sitemap" className="text-blue-600 hover:underline">/sitemap</Link> page</li>
                <li><code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Allow: /yerushalmi/</code> added to <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">robots.txt</code></li>
                <li>Yerushalmi route matchers added to the server-side crawler body content generator</li>
                <li>Full SEO metadata (title, description, canonical URL) on all three page levels</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah Reader: Balanced Section Heights & Compact Spacing</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hebrew and English text blocks now expand to match whichever is taller, eliminating empty whitespace at the bottom of shorter columns</li>
                <li>Slightly reduced English paragraph spacing for a more compact reading experience</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO: Mishnah Sitemap, Structured Data & Search Noindex</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Created a dedicated <strong>Mishnah XML sitemap</strong> (<code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/sitemap-mishnah.xml</code>) covering all 26 tractates and ~250 chapter pages, registered in the sitemap index</li>
                <li>Added <strong>server-side structured data</strong> (JSON-LD) for Bible and Mishnah pages — Bible books use <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Book</code> schema, Bible chapters and Mishnah chapters use <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Article</code> schema with <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">BreadcrumbList</code>, and index pages use <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">CollectionPage</code></li>
                <li>Added missing pages to <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">sitemap-main.xml</code>: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/mishnah</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/mishnah-map</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/search</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/sugya-viewer</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/sitemap</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/external-links</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/contact</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/privacy</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/changelog</code></li>
                <li>Search result pages with query parameters (<code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">?q=...</code> or <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">?type=...</code>) now return <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">noindex, follow</code> to prevent thin/duplicate search result pages from being indexed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah Hebrew Text: Question Mark Punctuation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added punctuation mappings so Hebrew question phrases now correctly end with a question mark instead of a comma or period:</li>
                <li><span dir="rtl">איזהו X,</span> → <span dir="rtl">איזהו X?</span></li>
                <li><span dir="rtl">ואיזו היא X,</span> → <span dir="rtl">ואיזו היא X?</span></li>
                <li><span dir="rtl">מה בין X.</span> → <span dir="rtl">מה בין X?</span></li>
                <li><span dir="rtl">כיצד X,</span> / <span dir="rtl">כיצד X.</span> → <span dir="rtl">כיצד X?</span></li>
                <li><span dir="rtl">במה דברים אמורים,</span> → <span dir="rtl">במה דברים אמורים?</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah Hebrew Text Processing: Expanded Comma-to-Colon Rules</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added new comma-to-colon conversion rules for Mishnah Hebrew text, replacing trailing commas with colons on speech and enumeration markers:</li>
                <li><span dir="rtl">ואלו הן,</span> → <span dir="rtl">ואלו הן:</span></li>
                <li><span dir="rtl">אמר לו,</span> → <span dir="rtl">אמר לו:</span></li>
                <li><span dir="rtl">אמר,</span> → <span dir="rtl">אמר:</span></li>
                <li><span dir="rtl">שני לו,</span> → <span dir="rtl">שני לו:</span></li>
                <li><span dir="rtl">שלישי לו,</span> → <span dir="rtl">שלישי לו:</span></li>
                <li><span dir="rtl">אמר לו רבי X,</span> → <span dir="rtl">אמר לו רבי X:</span> (with dynamic rabbi name matching)</li>
                <li><span dir="rtl">אמר [name],</span> → <span dir="rtl">אמר [name]:</span> (general pattern for any name following אמר, e.g. <span dir="rtl">אמר נחום הלבלר:</span>)</li>
                <li><span dir="rtl">ואלו [words].</span> → <span dir="rtl">ואלו [words]:</span> (replaces trailing period with colon on ואלו enumeration lines)</li>
                <li><span dir="rtl">אלו [words].</span> → <span dir="rtl">אלו [words]:</span> (same for אלו without the leading ו)</li>
                <li><span dir="rtl">אמרו להם [words],</span> → <span dir="rtl">אמרו להם [words]:</span> (general pattern for any words following אמרו להם)</li>
                <li><span dir="rtl">כיצד.</span> → <span dir="rtl">כיצד?</span> (period to question mark — "how?")</li>
                <li><span dir="rtl">אימתי,</span> → <span dir="rtl">אימתי?</span> (comma to question mark — "when?")</li>
                <li>Fixed Mishnah English: punctuation immediately followed by an uppercase letter (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Shammai:A</code>) now correctly splits into separate lines</li>
                <li>Mishnah English: protected abbreviations <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">b.</code> and <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">ibid.</code> from being split at the period (e.g. "Dosa b. Harkinas" stays on one line)</li>
                <li>Mishnah English name transliterations: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Akiba → Akiva</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Zadok → Tzadok</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Eleazar → Elazar</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Beth Hillel → Beit Hillel</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Beth Shammai → Beit Shammai</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing: Additional Fraction & Number Mappings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one-thirtieth → 1/30th</code></li>
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one twenty-fourth → 1/24th</code></li>
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one forty-eighth → 1/48th</code></li>
                <li>Added mixed number: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">twenty-two and a half → 22½</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah Reader</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>New <strong>Mishnah reader</strong> covering <strong>26 tractates</strong> not included in the Babylonian Talmud, organized by Seder</li>
                <li>Bilingual <strong>Hebrew-English</strong> chapter reader with 50/50 side-by-side layout, matching the Bible reader style</li>
                <li>Hebrew text: Torat Emet (public domain). English translation: Dr. Joshua Kulp, "Mishnah Yomit" (CC-BY, via Sefaria)</li>
                <li>Tractate <strong>Shekalim</strong> uses the Steinsaltz (William Davidson Edition) translation with Talmud-style commentary layout</li>
                <li>Custom Hebrew text processing: comma-to-colon conversion for speech markers (e.g. <span dir="rtl">אומר:</span> instead of <span dir="rtl">אומר,</span>)</li>
                <li>Custom English text processing: name transliteration (R' instead of R., Yehoshua instead of Joshua, etc.) and sentence-level line splitting</li>
                <li>Tractate table of contents with chapter and mishnah-count navigation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Reference Panel on Talmud Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>New <strong>collapsible Reference Panel</strong> below the Talmud text with two tabs</li>
                <li><strong>Bible Verses</strong> tab (default): automatically detects Bible citations in the text and fetches full Hebrew and English verse text from Sefaria, with a link to the ChavrutAI Bible Reader</li>
                <li><strong>Key Terms (beta)</strong> tab: lists highlighted terms (names, concepts, places) found on the current page, sorted by frequency, with category filters and glossary data</li>
                <li>Panel collapses/expands to keep focus on the text when needed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Bible Citation Linking in Talmud Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Bible references in the English (Steinsaltz) translation are now <strong>automatically detected and hyperlinked</strong> to the corresponding ChavrutAI Bible page</li>
                <li>Supports all 24 books of the Tanach, including multi-word names (e.g. Song of Songs, I Samuel)</li>
                <li>Clicking a citation like <strong>Deuteronomy 6:7</strong> navigates directly to <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/bible/Deuteronomy/6#7</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sugya Viewer: ChavrutAI References, UX Improvements & Chat Layout Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Input field now accepts <strong>ChavrutAI-style references</strong> (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">Shabbat/89b</code>) and full <strong>ChavrutAI URLs</strong> (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">https://chavrutai.com/talmud/Rosh_Hashanah/17a#11</code>), including section-level targeting via <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">#</code> fragment</li>
                <li>Renamed input label to <strong>"ChavrutAI / Sefaria Reference or URL"</strong> to reflect the expanded input options</li>
                <li>Pressing <strong>Enter</strong> in the reference input field now submits the form (same as clicking "Fetch Text")</li>
                <li>Added a <strong>Clear button</strong> to reset the input, dropdowns, displayed text, and browser URL after a fetch</li>
                <li>"About This Tool" section is now <strong>collapsed by default</strong> with a toggle arrow, matching the pattern used on the Term Index page</li>
                <li>Updated "About This Tool" documentation to list all five input methods: ChavrutAI reference, ChavrutAI URL, Sefaria reference, Sefaria URL, and Blog Post selection</li>
                <li>Fixed excessive whitespace in the <strong>AI Study Assistant chat panel</strong> — the text input now sits directly below the intro text instead of being pushed to the bottom of the panel</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing: Expanded Fraction & Number Mappings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added improper fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">five-fourths → 5/4ths</code></li>
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">three-eighths → 3/8ths</code></li>
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">seven-twentieths → 7/20ths</code></li>
                <li>Added fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">A quarter → 1/4th</code></li>
                <li>Added mixed numbers: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">three-and-one-third → 3⅓</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">thirty-three and one-third → 33⅓</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">ninety-three and one-third → 93⅓</code></li>
                <li>Added mixed number variants: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one and one-half → 1½</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">One and one half → 1½</code></li>
                <li>Added numeral conversions: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one hundred → 100</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one hundred dinars → 100 dinars</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">one hundred thirty → 130</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">two hundred ten → 210</code></li>
                <li>Added archaic number form: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">five and twenty → 25</code></li>
                <li>Added ordinal without article: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">fifth year → 5th year</code></li>
                <li>Added hyphenated half variants: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">six-and-a-half → 6½</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">nine-and-a-half → 9½</code></li>
                <li>Added compound half: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">twenty-nine and a half → 29½</code></li>
                <li>Added unit with fraction: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">hour-and-a-quarter → 1¼ hours</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Term Index: Full Redesign — Tabbed Cards Layout</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Completely redesigned the <Link href="/term-index" className="text-blue-600 hover:underline">/term-index</Link> page from a wide, horizontally-scrolling table into a tabbed cards layout with a click-to-expand detail panel</li>
                <li><strong>Category tabs</strong> — terms are organized into seven tabs: All, Names, Places, Biblical Names, Concepts, Nations, and Biblical Places. Each tab shows a live count; an "X of Y shown" counter appears on the right side of the tab bar.</li>
                <li><strong>Detail panel</strong> — clicking any card opens a side panel with: Hebrew text, variant names, category badges, biographical data (teacher, student, father, affiliation, birth/death dates and places), Wikipedia EN &amp; HE links, Wikidata link (with Q-ID), and up to 10 live corpus passage excerpts fetched from the search API</li>
                <li><strong>Corpus passage links</strong> — each passage in the detail panel links directly to the specific folio and section (e.g. <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/berakhot/3b#section-26</code>), using the same routing logic as the search results page</li>
                <li><strong>Glossary data moved to JSON</strong> — the CSV was converted to a compact columnar JSON format (<code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">shared/data/glossary_v4.json</code>, 485 KB) served via a new <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">GET /api/glossary</code> endpoint, replacing the old inline CSV fetch</li>
                <li><strong>Progressive pagination</strong> — cards are displayed 30 at a time with a "Show 30 more (N remaining)" button, preventing the browser from rendering thousands of DOM nodes at once</li>
                <li><strong>Search &amp; sort</strong> — search bar with a clear (×) button; sort by count high-to-low, count low-to-high, A–Z, or Z–A; all filter changes (tab, search, sort) reset the display count and are debounced at 250 ms</li>
                <li><strong>Keyboard support</strong> — pressing Escape closes the detail panel</li>
                <li><strong>Hebrew text</strong> — uses the same default Hebrew font as the Talmud reader (Assistant), displayed prominently alongside the English term in both cards and the detail panel</li>
                <li><strong>SEO</strong> — fully custom title, meta description, keywords, Open Graph, canonical URL, and Schema.org Dataset structured data with <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">license: MIT</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">isAccessibleForFree: true</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">inLanguage: ["en","he"]</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">temporalCoverage</code>, and a <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">DataDownload</code> distribution pointing to the JSON endpoint</li>
                <li>The existing ChavrutAI header (logo + icon) and footer are preserved; the page includes a collapsible "About this index" section with a work-in-progress disclaimer, data source notes, and a link to the methodology writeup</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Search: Accurate Result Count for Small Result Sets</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed a bug where the search result count was displayed as too low (e.g. "1 results" when 2 results were shown). The count is now always accurate for small result sets, rather than using a rough estimate based on halving the raw Elasticsearch hit count.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sugya Viewer: Unified Input &amp; Sefaria-Style URLs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Unified input:</strong> "Dropdown Selection" and "Sefaria URL" are now always visible at the same time. Changing a dropdown (tractate, page, or section) automatically updates the reference field above it.</li>
                <li><strong>Sefaria-style URL parameters:</strong> The page URL now uses a clean format matching Sefaria (e.g. <code className="text-xs bg-sepia-100 dark:bg-sepia-800 px-1 rounded">/sugya-viewer?Menachot.65a.4-66a.8</code>) instead of the previous verbose format. Old-style links continue to work.</li>
                <li><strong>"Open in the main Talmud reader"</strong> banner is now a prominent highlighted panel, making it easy to jump to the ChavrutAI reader for the displayed passage.</li>
                <li><strong>Blog Post Selection</strong> moved to a collapsible section to reduce visual clutter.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Talmud Chapter Data Audit &amp; Corrections (6 Tractates)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Ran a full audit comparing Talmud chapter boundary data against the Mishnah-to-Talmud mapping, identifying incorrect chapter names and/or folio ranges in 6 tractates:</li>
                <li><strong>Zevachim</strong> — all 14 chapters were replaced: previous entries had entirely wrong names (מנחות-style names) and incorrect ranges. Corrected with the proper names (כל הזבחים, כל הזבחים שקבלו דמן, כל הפסולין, בית שמאי, איזהו מקומן, קדשי קדשים, חטאת העוף, כל הזבחים, המזבח מקדש, כל התדיר, דם חטאת, טבול יום, השוחט והמעלה, פרת חטאת) and folio boundaries.</li>
                <li><strong>Bava Kamma</strong> — chapter names for chapters 6–10 were wrong (e.g., "HaChovel Ba'Chaveiro" for Ch 6, which is actually הכונס); folio start points were off for most chapters. Corrected all 10 chapters.</li>
                <li><strong>Bava Metzia</strong> — chapters 6–7 had wrong names (השוכר את האומנין and השואל את הפרה were missing); folio boundaries were slightly off for chapters 2 and 8. Corrected all 10 chapters.</li>
                <li><strong>Tamid</strong> — only 3 of 7 chapters were defined. Added chapters 3–7 (אמר להם הממונה, לא היו כופתין, אמר להם הממונה, החלו עולין, בזמן שכהן גדול) with correct folio ranges.</li>
                <li><strong>Nedarim</strong> — Chapter 2 (ואלו מותרין) was set to start at 16a instead of 13b.</li>
                <li><strong>Avodah Zarah</strong> — Chapter 2 ended too early (33a instead of 40b); chapters 4 and 5 started too late (52a and 65a instead of 49b and 62a).</li>
                <li>All 37 tractates now pass the automated chapter boundary audit.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah Map: Chapter Numbering Fixes for Menachot, Megillah &amp; Sanhedrin</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Menachot chapter data corrected</strong> — Talmud chapter data for Menachot was missing Chapter 2 ("HaKometz et HaMinchah", 13a–17a), causing chapters 2–13 to each display the wrong name and wrong folio range (each appeared one chapter earlier than it should). All 13 chapters now have correct numbers, names, and folio ranges.</li>
                <li><strong>Mishnah Map now respects Mishnah chapter ordering</strong> — The <Link href="/mishnah-map" className="text-blue-600 hover:underline">Mishnah Map</Link> page previously used Talmud chapter ordering for tractates where Mishnah and Talmud chapter order diverge. Chapters are now always displayed in Mishnah chapter order (1, 2, 3…), which is the expected ordering for a Mishnah reference tool.</li>
                <li><strong>Inline notes for Talmud order differences</strong> — Where the Talmud reads chapters in a different order than the Mishnah, a brief note appears on the affected chapter card:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li><em>Menachot Ch 6–10:</em> Mishnah chapter 10 appears as Talmud chapter 6 (at 63b); Mishnah chapters 6–9 each shift one position later in the Talmud.</li>
                    <li><em>Megillah Ch 3–4:</em> Mishnah chapter 4 opens Talmud chapter 3 (21a); Mishnah chapter 3 follows mid-chapter (25b).</li>
                    <li><em>Sanhedrin Ch 10–11:</em> The two chapters appear in reverse order in the Talmud.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Mishnah-Talmud Mapping: Display &amp; Documentation Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed repetitive chapter headers on the <Link href="/mishnah-map" className="text-blue-600 hover:underline">/mishnah-map</Link> page — section headers now display simply as "Chapter 1" instead of the redundant "Chapter 1: Chapter 1 (פרק 1)"</li>
                <li>Added a note to the "About This Mapping" section documenting known gaps in chapter order between Mishnah and Talmud: Sanhedrin (10 ↔ 11), Megillah (3 ↔ 4), and Menachot (chapter 10 in Mishnah corresponds to chapter 6 in Talmud, with chapters 6–9 in the Talmud each shifting one place later than in the Mishnah)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Page: <Link href="/term-index" className="text-blue-600 hover:underline">Talmud Term Index</Link></h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added a new reference page at <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/term-index</code> — a sortable, filterable glossary of personal names, place names, and key terms drawn from the Babylonian Talmud</li>
                <li>Data sourced from the <a href="https://github.com/EzraBrand/talmud-nlp-indexer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">talmud-nlp-indexer</a> project; see the companion post <a href="https://www.ezrabrand.com/p/introducing-a-new-talmudic-glossary" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Introducing a New Talmudic Glossary</a> (Feb 22, 2026) for background</li>
                <li>Table columns: Term, Category, Variants, Corpus Count, Wikipedia EN/HE, Hebrew Term, Wikidata ID, and biographical fields (father, teacher, affiliation, students, birth/death dates and places) sourced from Wikidata</li>
                <li>All columns are sortable by clicking the header; the Term and # columns are frozen (sticky) when scrolling horizontally</li>
                <li>Search filters across Term, Variants, and Wikipedia EN; a separate category dropdown narrows by term type (names, places, concepts, etc.)</li>
                <li>Term links navigate internally to the ChavrutAI search; Wikipedia and Wikidata links open externally</li>
                <li>Page is linked from the site footer (Study Resources), the sitemap, and is fully indexed by search engines with structured data (Schema.org Dataset)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Term Index: Performance Optimizations</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Virtual scrolling</strong> — the table now renders only the rows currently visible in the viewport (using <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">@tanstack/react-virtual</code>), regardless of how many rows match the current filter; scrolling through thousands of entries is now smooth and memory-efficient</li>
                <li><strong>Search debounce</strong> — filtering and sorting no longer fire on every keystroke; a 250 ms debounce ensures the computation only runs once the user pauses typing, keeping the UI responsive while searching</li>
                <li><strong>CSV caching</strong> — the glossary CSV is stored in <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">sessionStorage</code> after the first fetch, so revisiting the page within the same browser session loads data instantly with no network round-trip; the HTTP fetch also now respects the browser cache (<code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">cache: "default"</code>) between sessions</li>
                <li><strong>Pre-processed cell data</strong> — expensive per-cell operations (splitting variant lists, extracting Wikipedia titles from URLs, parsing corpus count integers) are now computed once at load time and stored on each row, rather than recomputed on every render</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Chapter Navigation: Deep Links &amp; Inline Chapter Headers</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The chapter breadcrumb on Talmud folio pages now deep-links directly to the section where the chapter begins — e.g., clicking "Chapter 2: BaMeh Madlikin" navigates to <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/Shabbat/20b#section-5</code> rather than just the top of the page</li>
                <li>Uses the same Mishnah-to-Talmud mapping data already used by the tractate table of contents, ensuring consistency across the app</li>
                <li>A chapter name header now appears inline in the text, directly above the section where a new chapter begins — e.g., "Chapter 2: BaMeh Madlikin (במה מדליקין)" is displayed as a highlighted banner before the opening Mishnah of that chapter</li>
                <li>Fixed Berakhot chapter Hebrew names: all nine chapters previously showed generic ordinals (פרק א, פרק ב…) instead of their traditional names; corrected to מאימתי, היה קורא, מי שמתו, תפלת השחר, אין עומדין, כיצד מברכין, שלשה שאכלו, אלו דברים, הרואה</li>
                <li>The tractate table of contents now displays the correct Hebrew chapter names in parentheses for Berakhot — e.g., "Chapter 1: Me'eimatay (מאימתי)"</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO: MIT License Added to Structured Data &amp; Footer</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed a Google Search Console warning on the <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/biblical-index</code> Dataset — added the missing <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">license</code> field (<code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">https://opensource.org/licenses/MIT</code>) to both the client-side and server-side JSON-LD structured data</li>
                <li>Added "MIT License" link to the site footer (About &amp; Legal column), linking to the canonical OSI license page — standard open-source practice</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Bible Translation Switched to Koren Jerusalem Bible</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Replaced JPS 1985 with the <strong>Koren Jerusalem Bible</strong> as the English translation for all Bible chapters</li>
                <li>Koren is more literal than JPS 1985 — for example, it renders שבתות שבע as "seven complete sabbaths" (vs. JPS's "seven weeks") in Leviticus 23:15, preserving the Hebrew more closely</li>
                <li>Fixed a pre-existing bug: the Sefaria v3 API was silently ignoring the <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">versionTitle</code> parameter and serving the 2023 Gender-Sensitive JPS instead of JPS 1985 — the app was claiming one translation but displaying another</li>
                <li>Switched to Sefaria's v1 API with the <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">ven</code> parameter, which correctly respects the requested version</li>
                <li>Added Koren-specific text normalization: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">ż/Ż → tz/Tz</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">ĥ → ḥ</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">᾽ → '</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">῾ → ' (mid-word) or removed (beginning-of-word)</code>, divine name phrases ("O Lord → O YHWH"), number words ("twenty five → 25"), and archaic English ("thy → your", "thou/thee → you", "shouldst → should", "hast → have")</li>
                <li>Updated search to index Koren results for Bible passages</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sugya Viewer: Shareable Range URLs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Clicking "Fetch Text" in the Sugya Viewer now updates the browser URL with parameters that encode exactly what was fetched — similar to how Sefaria encodes ranges like <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">sefaria.org.il/Rosh_Hashanah.2a.7-2b.2</code></li>
                <li>Dropdown Selection produces URLs like <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/sugya-viewer?method=dropdown&tractate=Berakhot&page=2a</code> (with an optional <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">&section=3</code> when a specific section is chosen)</li>
                <li>Sefaria URL input produces URLs like <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/sugya-viewer?method=url&ref=Rosh_Hashanah.2a.7-2b.2</code></li>
                <li>Blog Post Selection also updates the URL with the resolved Sefaria reference, so that result is equally shareable</li>
                <li>Opening a shared link auto-populates the form and immediately fetches the text — no extra clicks needed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Cleaner URLs for Talmud & Bible Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Talmud and Bible URLs now use proper casing and underscores instead of lowercase with hyphens — e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/Rosh_Hashanah/2a</code> and <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/bible/Song_of_Songs/1</code></li>
                <li>Old-format URLs (e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/rosh-hashanah/2a</code>, <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/bible/ii-samuel</code>) automatically redirect to the new format</li>
                <li>URL-encoded spaces (e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">rosh%20hashanah</code>) also redirect correctly</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO: Structured Data & Breadcrumb Navigation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed JSON-LD structured data on Talmud folio and tractate pages — the <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">@graph</code> was present but empty; all nodes (Article, Organization, BreadcrumbList) are now correctly populated</li>
                <li>Upgraded all inner-page JSON-LD to use the <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">@graph</code> format so that <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">author</code> and <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">publisher</code> references resolve within the same document (previously they pointed to an Organization node defined only on the homepage)</li>
                <li>Added <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">BreadcrumbList</code> schema to JSON-LD on folio pages (Home &gt; Talmud &gt; Tractate &gt; Folio) and tractate pages (Home &gt; Talmud &gt; Tractate) — enables rich breadcrumb snippets in Google search results</li>
                <li>Added visible breadcrumb navigation to Talmud folio pages, tractate contents pages, Bible book pages, and Bible chapter pages</li>
                <li>Removed redundant "Back to Contents" button from tractate pages — the "Talmud" breadcrumb link serves the same purpose</li>
                <li>Added <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">H1</code> heading to the Dictionary page (previously missing, hurting topical relevance for that page)</li>
                <li>Added <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">rel="nofollow"</code> to all Sefaria and Al HaTorah external links on folio pages — prevents outbound link equity from flowing to third-party sites</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Shorter Section Anchor URLs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Section anchors in Talmud page URLs are now shorter: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">#5</code> instead of <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">#section-5</code></li>
                <li>The copy-link button and "Jump to section" links now generate the new shorter format</li>
                <li>Old-style URLs (e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/nedarim/37b#section-5</code>) automatically redirect to the new format in the browser without breaking navigation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Shorter Verse Anchor URLs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Verse anchors in Bible page URLs are now shorter: <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">#16</code> instead of <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">#verse-16</code></li>
                <li>The copy-link button and "Jump to verse" links now generate the new shorter format</li>
                <li>Old-style URLs (e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/bible/leviticus/6#verse-16</code>) automatically redirect to the new format in the browser without breaking navigation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sugya Viewer: Link to ChavrutAI Talmud Reader</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>When viewing results in the <a href="/sugya-viewer" className="underline hover:text-sepia-900 dark:hover:text-sepia-100">Sugya Viewer</a> via "Dropdown Selection" or "Sefaria URL" input methods, a link now appears to open the corresponding page directly in the ChavrutAI Talmud reader</li>
                <li>The link points to the starting tractate and page (e.g., <code className="text-xs bg-sepia-200 dark:bg-sepia-700 px-1 rounded">/talmud/berakhot/16b#5</code>), scrolling to the exact section if one was specified</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">X/Twitter Account & Footer Link</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Launched the official <a href="https://x.com/ChavrutAI" target="_blank" rel="noopener noreferrer" className="underline hover:text-sepia-900 dark:hover:text-sepia-100">@ChavrutAI</a> X/Twitter account</li>
                <li>Added a "Follow on X" link with the X logo to the footer</li>
                <li>Added the X/Twitter profile to the site's structured data (SEO <code>sameAs</code>)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Section & Verse Navigation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added a "Jump to section:" / "Jump to verse:" row of numbered buttons at the top of every Talmud and Bible page — click any number to scroll directly to that section or verse</li>
                <li>Added a copy-link icon next to each section and verse header — clicking it copies a direct URL (e.g., <code>/talmud/berakhot/2a#5</code>) to the clipboard, with a brief "Copied!" confirmation</li>
                <li>Vertical dividers now separate the copy icon, Sefaria link, and Al HaTorah link in each section/verse header for visual clarity</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Improved Social Sharing Previews (WhatsApp, etc.)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Page-specific titles and descriptions now appear correctly when sharing links in WhatsApp, iMessage, and other messaging apps — previously all pages showed the same generic homepage preview</li>
                <li>Search page now shows "Search the Talmud & Bible" as the preview title; when sharing a search with a query (e.g., <code>/search?q=Asa&type=talmud</code>), the preview reflects the specific search term and content type</li>
                <li>All major footer pages now have proper previews: Sitemap, Contact, Changelog, Dictionary, Blog Posts, Bible-Talmud Index, Bible, Sugya Viewer, and Mishnah-Talmud Mapping</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">GitHub Repo & Structured Data Updates</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Updated footer GitHub link to reflect renamed repository (<code>EzraBrand/chavrutai</code>)</li>
                <li>Updated Organization schema markup <code>sameAs</code> to include the GitHub repository and ezrabrand.com</li>
              </ul>
            </div>
          </div>
        </div>

        {/* February 2026 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            February 2026
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Search: Exact Match & Advanced Filters</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added "Exact match" checkbox: requires words to appear precisely as typed and in order (e.g., "Rabbi Abba" will no longer match "R' Ḥiyya bar Abba")</li>
                <li>Added "Advanced filters" panel with two inputs: "Exclude if preceded by" and "Exclude if followed by" — removes results where another phrase appears before or after your search term in the passage</li>
                <li>Type filter (All / Talmud / Bible) is now persisted in the URL as <code>?type=talmud</code> or <code>?type=bible</code></li>
                <li>All search options are URL-addressable: <code>?exact=true</code>, <code>?exclude_before=</code>, <code>?exclude_after=</code> — shareable links preserve all active filters</li>
                <li>Advanced filters panel auto-expands when the URL contains exclude parameters</li>
                <li>Results header shows an "exact" badge when exact match is active, and a count of how many results were filtered by context on the current page</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Search Autosuggest Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed autosuggest dropdown appearing on search results pages when opened via URL (e.g., /search?q=rabbinic)</li>
                <li>Suggestions now only appear while actively typing a new query, not on page load or after submitting a search</li>
                <li>Increased minimum characters from 1 to 2 before suggestions appear</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Performance Optimization</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Talmud pages now load instantly — chapter data is fetched on demand instead of loading all 37 tractates at once</li>
                <li>Toggling term highlighting no longer freezes the page; regex matching is pre-compiled and results are cached</li>
                <li>Gazetteer data (names, concepts, places) is only downloaded when highlighting is turned on</li>
                <li>Hamburger menu and text selection remain responsive at all times during page load and highlighting</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Theme & Display Updates</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changed default theme from "Paper" to "White" for new visitors</li>
                <li>High Contrast theme is now always light-based (white background, black text) regardless of OS dark mode setting</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Name Recognition Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed gazetteer not recognizing names with special transliteration characters (e.g., Ḥizkiyya, Ḥulfana)</li>
                <li>Updated word boundary matching to support full Unicode, so all transliterated names are now properly labeled</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Asset & Image Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Restored missing header logo (hebrew-book-icon) and Sefaria "Powered by" badge</li>
                <li>Moved image assets to main public directory for reliability across rollbacks</li>
                <li>Updated OG (social sharing) image to match the site favicon</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO Structured Data & Meta Tags</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed duplicate title on Contents page (was sharing homepage title)</li>
                <li>Added SEO meta tags to pages that were missing them: Sugya Viewer, Blog Reader, External Links, 404</li>
                <li>Added canonical URLs to Mishnah Map and Sugya Viewer</li>
                <li>Added JSON-LD structured data across ~15 pages for better search engine rich results</li>
                <li>Every page now has a unique title, meta description, canonical URL, and structured data</li>
                <li>Converted OG (social sharing) image from SVG to PNG for compatibility with Facebook, LinkedIn, WhatsApp, and iMessage</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO & Accessibility Audit Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added H1 heading tags to Talmud folio pages and Sugya Viewer (previously missing, hurting topical relevance)</li>
                <li>Trimmed folio page meta descriptions from 180 to ~121 characters to prevent Google truncation</li>
                <li>Added aria-label to Sefaria attribution link in footer for screen readers and SEO</li>
                <li>Added accessible descriptions to navigation menus (Sheet/Dialog components)</li>
                <li>Removed viewport zoom restriction (maximum-scale=1 → 5) so users can pinch-to-zoom on mobile</li>
                <li>Optimized main logo image from 1.3MB (1024x1024) to 4.8KB (80x80) with WebP version</li>
                <li>Split Google Fonts loading: critical fonts (Roboto, Assistant) load first, 7 optional fonts deferred</li>
                <li>Removed unused Playfair Display font from loading</li>
                <li>Fixed broken image preload path in index.html</li>
                <li>Generated proper PNG version of OG image for WhatsApp and social sharing previews</li>
                <li>Fixed color contrast: darkened muted text in Paper and Dark themes to meet WCAG AA 4.5:1 minimum ratio</li>
                <li>Fixed nations gazetteer URL (was returning 404 errors in console)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">AI Chatbot Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Chatbot responses are now more direct and specific, avoiding vague filler phrases</li>
                <li>Removed meta-commentary from responses (e.g., "further exploration might be needed")</li>
                <li>Expanded chat input to a multi-line text box (4 rows) for longer questions</li>
                <li>Press Enter to send, Shift+Enter for new line</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">About Page FAQs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added expandable FAQ section covering common questions</li>
                <li>Topics include: free access, translation sources, text processing, customization options</li>
                <li>Added FAQs about bold vs. non-bold text distinction in Steinsaltz translation</li>
                <li>Linked to blog posts for deeper discussion of Talmud difficulty and controversial topics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sefaria Link & Text Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed external Sefaria URLs for two-word tractates (e.g., Bava Metzia): space encoding changed from <code>%20</code> to <code>_</code></li>
                <li>Fixed term replacement not working when Sefaria API splits hyphenated terms across HTML bold tags (e.g., "sky-blue" → "tekhelet" now works in Menachot 35b.4)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed English text incorrectly splitting in the middle of punctuation clusters like ?'" (e.g., Berakhot 7b.1 now keeps ?'" together on one line)</li>
                <li>Hebrew text no longer splits after quotation marks (״), keeping quoted words inline</li>
                <li>English text now correctly splits after semicolon + quote clusters (e.g., ];" stays together)</li>
                <li>Added term mappings: "Sages" → "rabbis", "our Lord" → "our God"</li>
                <li>Added term mappings: "bathroom" → "latrine", "bathrooms" → "latrines", "lavatory" → "latrine", "sky blue" → "tekhelet", "ch." → "chapter"</li>
                <li>Added ordinal time expressions: "the first/second/third/fifth/tenth [unit]" → "the 1st/2nd/3rd/5th/10th [unit]" for year, month, day, week, hour, watch</li>
                <li>Added "the Xth of the month" pattern (e.g., "the fifth of the month" → "the 5th of the month")</li>
                <li>Added number conversion: "three hundred and fifty four" → "354"</li>
                <li>Added fraction: "thirteen and a third" → "13⅓"</li>
                <li>Fixed ambiguous fraction/ordinal mappings: standalone "third" (שליש / שלישי), "fifth" (חומש / חמישי), and "tenth" (עשרון / עשירי) no longer auto-convert (context-dependent)</li>
                <li>Fixed kav measurements: "an eighth-kav" → "a 1/8th-kav", "one-thirty-second of a kav" → "1/32nd-kav"</li>
                <li>Added 30 cardinal number conversions for large and compound numbers (e.g., "three hundred and sixty-five thousand" → "365,000", "forty and two thousand three hundred and sixty" → "42,360", "Five thousand eight hundred and eighty-eight" → "5,888")</li>
                <li>Added ordinal mappings for compound ordinals (e.g., "six hundred and first" → "601st") and fractional ordinals ("two hundred fifty-sixth" → "1/256th")</li>
                <li>Removed ambiguous ordinal mappings ("hundredth", "one hundredth", "two-hundredth") that could be either ordinal or fractional depending on context</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sugya Viewer Export Options</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added export buttons for Markdown (.md) and HTML (.html) formats</li>
                <li>HTML export retains rich formatting (bold, italics, RTL direction)</li>
                <li>Markdown export preserves Hebrew text as bold for readability</li>
                <li>Useful for uploading text to chatbot assistants that don't retain formatting from copy/paste</li>
              </ul>
            </div>
          </div>
        </div>

        {/* January 2026 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            January 2026
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO Canonical URL Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed Google indexing issues caused by duplicate content between deprecated /tractate/ and canonical /talmud/ URLs</li>
                <li>Updated robots.txt to block deprecated URL patterns and consolidate crawling to canonical URLs</li>
                <li>Added missing canonical tags to contact, biblical-book, and other pages</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">URL Structure Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changed Talmud page URLs from /tractate/ to /talmud/ for consistency (e.g., /talmud/berakhot/2a)</li>
                <li>Old bookmarked /tractate/ URLs automatically redirect to new /talmud/ URLs</li>
                <li>Updated all internal links, SEO metadata, and sitemaps to use the new URL structure</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Sefaria Compatibility Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed tractate name discrepancy with Sefaria: "Beitza" → "Beitzah" and "Arachin" → "Arakhin"</li>
                <li>Restored broken Sefaria links on Mishnah Map page for these tractates</li>
                <li>Added backwards compatibility for old URLs to prevent broken links</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jastrow Dictionary Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed sense numbering display (1, 2, 3...) that was being cut off from dictionary entries</li>
                <li>Added origin metadata display showing language origins (Biblical Hebrew, Aramaic) and cross-references</li>
                <li>Expanded abbreviation mappings with 10+ new terms (Assyr., frequ., opp., supra, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Blog Reader on About Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Replaced "Latest Posts" widget with expandable blog post reader showing full content</li>
                <li>Added Hebrew RTL text support with automatic detection</li>
                <li>Footnotes display with hover tooltips and click-to-navigate functionality</li>
                <li>Added post numbering (1, 2, 3...) for easier reference</li>
                <li>Expanded posts now show first 3 paragraphs with "Load more of the post..." option</li>
                <li>Shows 5 posts by default with "Load more posts..." to view up to 20 posts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added animal term mappings: "domesticated animals" → "livestock", "non-domesticated" → "wild"</li>
                <li>Added 72 number text to numeral conversions (e.g., "forty million" → "40,000,000")</li>
                <li>Supports large numbers with comma-separated thousands for readability</li>
                <li>Added fractional ordinal conversions (e.g., "one five-hundredth" → "1/500th")</li>
                <li>Added Hebrew month date conversions (e.g., "the first of Shevat" → "the 1st of Shevat")</li>
                <li>Added measurement fractions with Unicode symbols (e.g., "a finger and a third" → "1⅓ fingers", "seven and a half" → "7½")</li>
              </ul>
            </div>
          </div>
        </div>

        {/* December 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            December 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Improved Name Recognition</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed text splitting to keep genealogical phrases like "R' Elazar, son of R' Shimon" on one line</li>
                <li>Compound names with "son of" now highlight as single entries instead of separate name fragments</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO-Friendly URL Update</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changed Talmud contents URL from /contents to /talmud for better SEO</li>
                <li>All tractate pages now use /talmud/:tractate instead of /contents/:tractate</li>
                <li>301 redirects automatically preserve rankings and prevent broken links</li>
                <li>Updated sitemap with new canonical URLs</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Homepage</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Redesigned homepage as a minimalist directory showcasing all platform features</li>
                <li>Primary sections for Talmud and Tanakh with equal prominence</li>
                <li>Quick search bar for searching across all texts</li>
                <li>Today's Daf Yomi widget with direct study link</li>
                <li>Famous Talmud Pages section linking to curated suggested readings</li>
                <li>Study Tools grid: Sugya Viewer, Dictionary, Biblical Index, Mishnah Map</li>
                <li>Talmud table of contents accessible at /talmud</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jastrow Dictionary Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed entries being cut off for words with multiple verb forms (e.g., Hiphil/Hif.)</li>
                <li>Nested grammatical forms now display with proper labels showing verb stem and conjugation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Navigation Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed empty page issue: tractates ending on 'a' side no longer show invalid 'b' pages</li>
                <li>Added support for Tamid's unique page range (25b-33b instead of standard 2a start)</li>
                <li>Navigation buttons now correctly disable at tractate boundaries</li>
                <li>Page dropdowns exclude invalid pages (e.g., Berakhot 64b, Tamid 25a)</li>
                <li>Centralized navigation logic in unified module for consistency across all components</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Full-Text Search</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>New search page for searching across Talmud and Bible texts in Hebrew and English</li>
                <li>Filter buttons to show All, Talmud only, or Bible only results</li>
                <li>Autosuggest for common Talmudic concepts as you type</li>
                <li>Search term highlighting in results</li>
                <li>Direct links to specific sections in Talmud pages and specific verses in Bible chapters</li>
                <li>Results filtered to only show texts available in ChavrutAI</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links on Talmud Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added external links footer to each Talmud page with links to Sefaria, Al HaTorah, Wikisource, and Daf Yomi</li>
                <li>Added section-level external links next to each section header for direct cross-referencing</li>
                <li>Links open in new tabs for parallel study across platforms</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links on Bible Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added verse-level external links (Sefaria, Al HaTorah, Wikisource) next to each verse header</li>
                <li>Added chapter-level external links footer to each Bible chapter page</li>
                <li>Verified Al HaTorah transliterations for all 39 Tanakh books</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">UI Simplification</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added link to the article "Biblical Citations in the Talmud: A New Digital Index and Concordance" on the Biblical Index page</li>
                <li>Removed "Study Options" navigation cards from Contents page for cleaner layout</li>
                <li>Removed breadcrumb navigation from Contents and Tractate Contents pages</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Consistent Header Navigation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added centered logo header to all secondary pages for consistent navigation</li>
                <li>Logo links directly to homepage from Dictionary, About, Sitemap, Contact, Privacy, and more</li>
                <li>Removed redundant "Home" buttons and "Quick Navigation" sections</li>
                <li>Unified sticky header design across the entire site</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added internal testing page for generating links to external Talmud resources</li>
                <li>URL generators for Sefaria, Al HaTorah, Wikisource Hebrew, and Daf Yomi</li>
                <li>Section-level and page-level link generation with URL previews</li>
                <li>Curated list of related articles about digital Talmud resources</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Theme and Font Options</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added three theme options: Sepia (warm parchment), White (clean standard), Dark (moderate)</li>
                <li>Added English font selection with four options: Inter (default), Roboto, Source Sans 3, Open Sans</li>
                <li>Changed default Hebrew font to "Assistant" for better readability</li>
                <li>Simplified Hebrew font names in the menu (removed "Hebrew" suffix)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">About Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Comprehensive rewrite with clear overview for new visitors</li>
                <li>Added sections for available texts, navigation, customization, and special features</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Performance Optimizations</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Implemented code splitting with lazy loading for 18 routes</li>
                <li>Migrated static assets to public folder for faster direct serving</li>
                <li>Optimized Biblical index data loading with fetch-based approach</li>
                <li>Reduced bundle sizes dramatically (Biblical index from ~1-2MB to 0.6KB)</li>
                <li>Cleaned up 29 unused UI components and 293 npm packages</li>
                <li>Optimized Google Fonts with async loading and reduced weights</li>
                <li>Reduced CSS size to 67KB through dependency cleanup</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Loading Experience</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added skeleton loading component for smoother page transitions</li>
                <li>Implemented React Query caching for Biblical index pages</li>
                <li>Added font preconnect for faster typography loading</li>
                <li>Fixed Cumulative Layout Shift (CLS) issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* November 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            November 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Launched Sugya Viewer for studying custom text ranges</li>
                <li>Added AI chatbot for text study assistance</li>
                <li>Implemented SEO canonical URL enforcement with server-side redirects</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed period + end quote splitting (e.g., Cush." now stays together)</li>
                <li>Fixed comma + end quote splitting (e.g., exposition," keeps quotes attached)</li>
                <li>Added support for single quotes in punctuation clusters</li>
                <li>Implemented triple-punctuation cluster handling (e.g., ?'" stays intact)</li>
                <li>Added intelligent comma splitting that preserves numbers (e.g., 600,000)</li>
                <li>Converted HTML line breaks to proper text splits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* September 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            September 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added detailed chapter outlines for in-depth topic analysis</li>
                <li>Created human-readable sitemap page for easier navigation</li>
                <li>Fixed page scroll behavior - now scrolls to top when navigating</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Design Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enhanced folio button sizing and spacing for better readability</li>
                <li>Improved desktop layout with optimized margins</li>
                <li>Better card layouts and spacing on wider screens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">User Experience</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added external link indicators in footer</li>
                <li>Included GitHub repository link for transparency</li>
                <li>Improved text display with italicized chapter names</li>
              </ul>
            </div>
          </div>
        </div>

        {/* August 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            August 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Core Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Launched comprehensive Talmud study interface</li>
                <li>Integrated all 37 tractates of Babylonian Talmud</li>
                <li>Implemented bilingual Hebrew-English text display</li>
                <li>Added traditional sepia manuscript-inspired design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Navigation System</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Built hierarchical navigation by Seder (traditional order)</li>
                <li>Created intuitive folio-based page navigation</li>
                <li>Added breadcrumb system for location tracking</li>
                <li>Implemented responsive mobile-first design</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Study Tools</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Integrated Hebrew term highlighting with 5,385+ terms</li>
                <li>Added customizable text size and Hebrew font options</li>
                <li>Implemented light/dark mode with sepia themes</li>
                <li>Created flexible layout options (side-by-side vs stacked)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-sepia-500 dark:text-sepia-400 pt-6 border-t border-sepia-200 dark:border-sepia-700">
          <p>ChavrutAI is continuously improved to enhance Talmud study experience.</p>
        </div>

      </div>
      </div>

      <Footer />
    </div>
  );
}
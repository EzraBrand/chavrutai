import { useState } from "react";

const SAMPLE_CATEGORIES = ["All", "Rabbi", "Place", "Biblical", "Concept", "Object"];

const SAMPLE_TERMS = [
  { term: "Abaye", hebrew: "אַבַּיֵּי", category: "Rabbi", variants: ["Abai", "Abayi"], count: 3842, wikiEn: "Abaye", teacher: "Rabbah bar Nahmani", student: "Mar bar Rav Ashi", born: "280 CE", died: "339 CE" },
  { term: "Rava", hebrew: "רָבָא", category: "Rabbi", variants: ["Raba"], count: 5612, wikiEn: "Rava", teacher: "Rav Nahman", student: "Ravina I", born: "280 CE", died: "352 CE" },
  { term: "Rav Ashi", hebrew: "רַב אַשִׁי", category: "Rabbi", variants: [], count: 2341, wikiEn: "Rav Ashi", teacher: "Rava", student: "Mar bar Rav Ashi", born: "352 CE", died: "427 CE" },
  { term: "Rashi", hebrew: "רַשִׁ״י", category: "Rabbi", variants: ["Rabbi Shlomo Yitzchaki"], count: 0, wikiEn: "Rashi", teacher: "", student: "", born: "1040 CE", died: "1105 CE" },
  { term: "Pumbedita", hebrew: "פּוּמְבְּדִיתָא", category: "Place", variants: ["Pumbdita"], count: 412, wikiEn: "Pumbedita", teacher: "", student: "", born: "", died: "" },
  { term: "Sura", hebrew: "סוּרָא", category: "Place", variants: [], count: 287, wikiEn: "Sura (Babylonia)", teacher: "", student: "", born: "", died: "" },
  { term: "Nehardea", hebrew: "נְהַרְדְּעָא", category: "Place", variants: ["Nehardaa"], count: 198, wikiEn: "Nehardea", teacher: "", student: "", born: "", died: "" },
  { term: "Eretz Yisrael", hebrew: "אֶרֶץ יִשְׂרָאֵל", category: "Place", variants: ["Land of Israel"], count: 634, wikiEn: "Land of Israel", teacher: "", student: "", born: "", died: "" },
  { term: "Moses", hebrew: "מֹשֶׁה", category: "Biblical", variants: ["Moshe"], count: 1203, wikiEn: "Moses", teacher: "", student: "", born: "", died: "" },
  { term: "Abraham", hebrew: "אַבְרָהָם", category: "Biblical", variants: ["Avraham"], count: 876, wikiEn: "Abraham", teacher: "", student: "", born: "", died: "" },
  { term: "Shabbat", hebrew: "שַׁבָּת", category: "Concept", variants: ["Sabbath", "Shabbos"], count: 4521, wikiEn: "Shabbat", teacher: "", student: "", born: "", died: "" },
  { term: "Teshuvah", hebrew: "תְּשׁוּבָה", category: "Concept", variants: ["Repentance"], count: 312, wikiEn: "Teshuvah", teacher: "", student: "", born: "", died: "" },
  { term: "Mezuzah", hebrew: "מְזוּזָה", category: "Object", variants: [], count: 214, wikiEn: "Mezuzah", teacher: "", student: "", born: "", died: "" },
  { term: "Shofar", hebrew: "שׁוֹפָר", category: "Object", variants: [], count: 387, wikiEn: "Shofar", teacher: "", student: "", born: "", died: "" },
];

export function TabbedGlossary() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SAMPLE_TERMS.filter((t) => {
    const catOk = activeTab === "All" || t.category === activeTab;
    const searchOk = search === "" || t.term.toLowerCase().includes(search.toLowerCase()) || t.variants.some(v => v.toLowerCase().includes(search.toLowerCase()));
    return catOk && searchOk;
  });

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <h1 className="text-xl font-semibold text-gray-900">Index of Names, Places &amp; Key Terms</h1>
        <p className="text-sm text-gray-500 mt-1">
          Glossary of Talmudic and Biblical terms with variants, corpus counts, and Wikipedia links.
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search terms and variants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900 placeholder:text-gray-400"
        />
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} of {SAMPLE_TERMS.length} terms
        </span>
      </div>

      {/* Category Tabs */}
      <div className="px-6 pt-4 border-b border-gray-200 bg-white">
        <div className="flex gap-0 overflow-x-auto">
          {SAMPLE_CATEGORIES.map((cat) => {
            const count = cat === "All" ? SAMPLE_TERMS.length : SAMPLE_TERMS.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setExpanded(null); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === cat
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {cat}
                <span className={`ml-1.5 text-xs ${activeTab === cat ? "text-gray-600" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Glossary List */}
      <div className="px-6 py-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-16">No terms match your search.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((t) => {
              const isOpen = expanded === t.term;
              const hasDetail = t.teacher || t.student || t.born || t.died;
              return (
                <div key={t.term}>
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.term)}
                    className="w-full text-left py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded"
                    disabled={!hasDetail}
                  >
                    {/* Term + Hebrew */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-900 text-sm">{t.term}</span>
                        {t.hebrew && (
                          <span dir="rtl" className="text-gray-400 text-sm">{t.hebrew}</span>
                        )}
                      </div>
                      {t.variants.length > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">also: {t.variants.join(", ")}</div>
                      )}
                    </div>

                    {/* Count */}
                    <div className="text-xs text-gray-400 tabular-nums w-20 text-right shrink-0">
                      {t.count > 0 ? `${t.count.toLocaleString()}×` : ""}
                    </div>

                    {/* Category */}
                    <div className="w-20 shrink-0">
                      <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                        {t.category}
                      </span>
                    </div>

                    {/* Wiki link */}
                    <div className="w-20 text-right shrink-0">
                      {t.wikiEn && (
                        <a
                          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(t.wikiEn)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Wikipedia
                        </a>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <div className="w-5 shrink-0 text-right">
                      {hasDetail && (
                        <span className={`text-gray-300 text-sm transition-transform inline-block ${isOpen ? "rotate-90" : ""}`}>
                          ›
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  {isOpen && hasDetail && (
                    <div className="py-3 px-2 bg-gray-50 rounded mb-1 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-600">
                      {t.teacher && (
                        <div><span className="text-gray-400 mr-1">Teacher:</span>{t.teacher}</div>
                      )}
                      {t.student && (
                        <div><span className="text-gray-400 mr-1">Student:</span>{t.student}</div>
                      )}
                      {t.born && (
                        <div><span className="text-gray-400 mr-1">Born:</span>{t.born}</div>
                      )}
                      {t.died && (
                        <div><span className="text-gray-400 mr-1">Died:</span>{t.died}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

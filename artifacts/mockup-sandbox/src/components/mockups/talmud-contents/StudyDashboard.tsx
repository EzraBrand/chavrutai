import { useState } from "react";

const SEDARIM = [
  {
    name: "Zeraim",
    fullName: "Seder Zeraim",
    hebrew: "סדר זרעים",
    icon: "🌱",
    tractates: [
      { name: "Berakhot", hebrew: "ברכות", dafim: 64, topic: "Prayers & Blessings" },
    ],
  },
  {
    name: "Moed",
    fullName: "Seder Moed",
    hebrew: "סדר מועד",
    icon: "🕯️",
    tractates: [
      { name: "Shabbat", hebrew: "שבת", dafim: 157, topic: "The Sabbath" },
      { name: "Eruvin", hebrew: "עירובין", dafim: 105, topic: "Boundaries" },
      { name: "Pesachim", hebrew: "פסחים", dafim: 121, topic: "Passover" },
      { name: "Rosh Hashanah", hebrew: "ראש השנה", dafim: 35, topic: "New Year" },
      { name: "Yoma", hebrew: "יומא", dafim: 88, topic: "Yom Kippur" },
      { name: "Sukkah", hebrew: "סוכה", dafim: 56, topic: "Tabernacles" },
      { name: "Beitzah", hebrew: "ביצה", dafim: 40, topic: "Festival Laws" },
      { name: "Taanit", hebrew: "תענית", dafim: 31, topic: "Fast Days" },
      { name: "Megillah", hebrew: "מגילה", dafim: 32, topic: "Purim" },
      { name: "Moed Katan", hebrew: "מועד קטן", dafim: 29, topic: "Intermediate Days" },
      { name: "Chagigah", hebrew: "חגיגה", dafim: 27, topic: "Pilgrimage" },
    ],
  },
  {
    name: "Nashim",
    fullName: "Seder Nashim",
    hebrew: "סדר נשים",
    icon: "💍",
    tractates: [
      { name: "Yevamot", hebrew: "יבמות", dafim: 122, topic: "Levirate Marriage" },
      { name: "Ketubot", hebrew: "כתובות", dafim: 112, topic: "Marriage Contracts" },
      { name: "Nedarim", hebrew: "נדרים", dafim: 91, topic: "Vows" },
      { name: "Nazir", hebrew: "נזיר", dafim: 66, topic: "Nazirite Vow" },
      { name: "Sotah", hebrew: "סוטה", dafim: 49, topic: "Suspected Adultery" },
      { name: "Gittin", hebrew: "גיטין", dafim: 90, topic: "Divorce" },
      { name: "Kiddushin", hebrew: "קידושין", dafim: 82, topic: "Betrothal" },
    ],
  },
  {
    name: "Nezikin",
    fullName: "Seder Nezikin",
    hebrew: "סדר נזיקין",
    icon: "⚖️",
    tractates: [
      { name: "Bava Kamma", hebrew: "בבא קמא", dafim: 119, topic: "Torts & Damages" },
      { name: "Bava Metzia", hebrew: "בבא מציעא", dafim: 119, topic: "Commerce" },
      { name: "Bava Batra", hebrew: "בבא בתרא", dafim: 176, topic: "Property Law" },
      { name: "Sanhedrin", hebrew: "סנהדרין", dafim: 113, topic: "Courts" },
      { name: "Makkot", hebrew: "מכות", dafim: 24, topic: "Lashes" },
      { name: "Shevuot", hebrew: "שבועות", dafim: 49, topic: "Oaths" },
      { name: "Avodah Zarah", hebrew: "עבודה זרה", dafim: 76, topic: "Idolatry" },
      { name: "Horayot", hebrew: "הוריות", dafim: 14, topic: "Rulings" },
    ],
  },
  {
    name: "Kodashim",
    fullName: "Seder Kodashim",
    hebrew: "סדר קדשים",
    icon: "🕍",
    tractates: [
      { name: "Zevachim", hebrew: "זבחים", dafim: 120, topic: "Animal Offerings" },
      { name: "Menachot", hebrew: "מנחות", dafim: 110, topic: "Meal Offerings" },
      { name: "Chullin", hebrew: "חולין", dafim: 142, topic: "Secular Slaughter" },
      { name: "Bekhorot", hebrew: "בכורות", dafim: 61, topic: "Firstborns" },
      { name: "Arakhin", hebrew: "ערכין", dafim: 34, topic: "Valuations" },
      { name: "Temurah", hebrew: "תמורה", dafim: 34, topic: "Substitution" },
      { name: "Keritot", hebrew: "כריתות", dafim: 28, topic: "Excision" },
      { name: "Meilah", hebrew: "מעילה", dafim: 22, topic: "Sacrilege" },
      { name: "Tamid", hebrew: "תמיד", dafim: 33, topic: "Daily Offering" },
    ],
  },
  {
    name: "Tohorot",
    fullName: "Seder Tohorot",
    hebrew: "סדר טהרות",
    icon: "💧",
    tractates: [
      { name: "Niddah", hebrew: "נדה", dafim: 73, topic: "Menstrual Purity" },
    ],
  },
];

const totalDafim = SEDARIM.flatMap(s => s.tractates).reduce((sum, t) => sum + t.dafim, 0);

export function StudyDashboard() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>("Moed");

  const filteredSedarim = SEDARIM.map(s => ({
    ...s,
    tractates: s.tractates.filter(
      t => t.name.toLowerCase().includes(search.toLowerCase()) || t.hebrew.includes(search)
    )
  })).filter(s => s.tractates.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-sm font-bold">ת</div>
          <span className="font-semibold text-white">ChavrutAI</span>
          <span className="text-gray-600 text-sm">/</span>
          <span className="text-gray-400 text-sm">Talmud Bavli</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-800 px-2 py-1 rounded">37 tractates</span>
          <span className="bg-gray-800 px-2 py-1 rounded">{totalDafim.toLocaleString()} folios</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Hero row */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Study Talmud</h1>
            <p className="text-gray-400 text-sm">Complete Babylonian Talmud — 6 orders, 37 tractates</p>
          </div>
          <div className="text-3xl text-gray-600" style={{ fontFamily: "serif" }}>תלמוד בבלי</div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tractates in English or Hebrew…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Seder accordions */}
        <div className="space-y-3">
          {filteredSedarim.map((seder) => {
            const isOpen = expanded === seder.name || search.length > 0;
            const sederDafim = seder.tractates.reduce((s, t) => s + t.dafim, 0);

            return (
              <div key={seder.name} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
                {/* Seder header */}
                <button
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors text-left"
                  onClick={() => setExpanded(expanded === seder.name && !search ? null : seder.name)}
                >
                  <span className="text-xl">{seder.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{seder.fullName}</span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{seder.tractates.length} tractates</span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{sederDafim} daf</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "serif" }}>{seder.hebrew}</div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Tractate grid */}
                {isOpen && (
                  <div className="px-5 pb-4 grid grid-cols-3 gap-2 border-t border-gray-800">
                    {seder.tractates.map((t) => (
                      <div
                        key={t.name}
                        className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-700/60 rounded-lg px-3 py-2.5 cursor-pointer group transition-colors mt-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-100 group-hover:text-white">{t.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t.topic}</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-sm text-gray-400" style={{ fontFamily: "serif" }}>{t.hebrew}</div>
                          <div className="text-[10px] text-indigo-400 mt-0.5">{t.dafim}d</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

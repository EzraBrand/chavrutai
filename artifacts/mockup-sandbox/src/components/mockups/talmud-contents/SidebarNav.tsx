import { useState } from "react";

const SEDARIM = [
  {
    name: "Seder Zeraim",
    hebrew: "סדר זרעים",
    description: "Agriculture & blessings",
    color: "emerald",
    tractates: [
      { name: "Berakhot", hebrew: "ברכות", dafim: 64 },
    ],
  },
  {
    name: "Seder Moed",
    hebrew: "סדר מועד",
    description: "Holidays & appointed times",
    color: "blue",
    tractates: [
      { name: "Shabbat", hebrew: "שבת", dafim: 157 },
      { name: "Eruvin", hebrew: "עירובין", dafim: 105 },
      { name: "Pesachim", hebrew: "פסחים", dafim: 121 },
      { name: "Rosh Hashanah", hebrew: "ראש השנה", dafim: 35 },
      { name: "Yoma", hebrew: "יומא", dafim: 88 },
      { name: "Sukkah", hebrew: "סוכה", dafim: 56 },
      { name: "Beitzah", hebrew: "ביצה", dafim: 40 },
      { name: "Taanit", hebrew: "תענית", dafim: 31 },
      { name: "Megillah", hebrew: "מגילה", dafim: 32 },
      { name: "Moed Katan", hebrew: "מועד קטן", dafim: 29 },
      { name: "Chagigah", hebrew: "חגיגה", dafim: 27 },
    ],
  },
  {
    name: "Seder Nashim",
    hebrew: "סדר נשים",
    description: "Women & family law",
    color: "rose",
    tractates: [
      { name: "Yevamot", hebrew: "יבמות", dafim: 122 },
      { name: "Ketubot", hebrew: "כתובות", dafim: 112 },
      { name: "Nedarim", hebrew: "נדרים", dafim: 91 },
      { name: "Nazir", hebrew: "נזיר", dafim: 66 },
      { name: "Sotah", hebrew: "סוטה", dafim: 49 },
      { name: "Gittin", hebrew: "גיטין", dafim: 90 },
      { name: "Kiddushin", hebrew: "קידושין", dafim: 82 },
    ],
  },
  {
    name: "Seder Nezikin",
    hebrew: "סדר נזיקין",
    description: "Damages & civil law",
    color: "amber",
    tractates: [
      { name: "Bava Kamma", hebrew: "בבא קמא", dafim: 119 },
      { name: "Bava Metzia", hebrew: "בבא מציעא", dafim: 119 },
      { name: "Bava Batra", hebrew: "בבא בתרא", dafim: 176 },
      { name: "Sanhedrin", hebrew: "סנהדרין", dafim: 113 },
      { name: "Makkot", hebrew: "מכות", dafim: 24 },
      { name: "Shevuot", hebrew: "שבועות", dafim: 49 },
      { name: "Avodah Zarah", hebrew: "עבודה זרה", dafim: 76 },
      { name: "Horayot", hebrew: "הוריות", dafim: 14 },
    ],
  },
  {
    name: "Seder Kodashim",
    hebrew: "סדר קדשים",
    description: "Holy things & sacrifices",
    color: "violet",
    tractates: [
      { name: "Zevachim", hebrew: "זבחים", dafim: 120 },
      { name: "Menachot", hebrew: "מנחות", dafim: 110 },
      { name: "Chullin", hebrew: "חולין", dafim: 142 },
      { name: "Bekhorot", hebrew: "בכורות", dafim: 61 },
      { name: "Arakhin", hebrew: "ערכין", dafim: 34 },
      { name: "Temurah", hebrew: "תמורה", dafim: 34 },
      { name: "Keritot", hebrew: "כריתות", dafim: 28 },
      { name: "Meilah", hebrew: "מעילה", dafim: 22 },
      { name: "Tamid", hebrew: "תמיד", dafim: 33 },
    ],
  },
  {
    name: "Seder Tohorot",
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    color: "teal",
    tractates: [
      { name: "Niddah", hebrew: "נדה", dafim: 73 },
    ],
  },
];

const colorMap: Record<string, { accent: string; badge: string; dot: string; hover: string; active: string; activeBg: string }> = {
  emerald: { accent: "#10b981", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", hover: "hover:bg-emerald-50", active: "text-emerald-700 font-semibold", activeBg: "bg-emerald-50 border-l-2 border-emerald-500" },
  blue: { accent: "#3b82f6", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", hover: "hover:bg-blue-50", active: "text-blue-700 font-semibold", activeBg: "bg-blue-50 border-l-2 border-blue-500" },
  rose: { accent: "#f43f5e", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500", hover: "hover:bg-rose-50", active: "text-rose-700 font-semibold", activeBg: "bg-rose-50 border-l-2 border-rose-500" },
  amber: { accent: "#f59e0b", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", hover: "hover:bg-amber-50", active: "text-amber-700 font-semibold", activeBg: "bg-amber-50 border-l-2 border-amber-500" },
  violet: { accent: "#8b5cf6", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", hover: "hover:bg-violet-50", active: "text-violet-700 font-semibold", activeBg: "bg-violet-50 border-l-2 border-violet-500" },
  teal: { accent: "#14b8a6", badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500", hover: "hover:bg-teal-50", active: "text-teal-700 font-semibold", activeBg: "bg-teal-50 border-l-2 border-teal-500" },
};

export function SidebarNav() {
  const [selected, setSelected] = useState(0);
  const seder = SEDARIM[selected];
  const c = colorMap[seder.color];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">ChavrutAI</div>
          <div className="text-xs text-gray-500 mt-0.5">Babylonian Talmud</div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-xs text-gray-400">Search tractates…</span>
          </div>
        </div>

        {/* Seder list */}
        <nav className="flex-1 px-2 pb-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 px-2 mb-2 mt-1">Orders</div>
          {SEDARIM.map((s, i) => {
            const cc = colorMap[s.color];
            const isActive = i === selected;
            return (
              <button
                key={s.name}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-3 transition-all duration-150 ${isActive ? cc.activeBg : "hover:bg-gray-50"}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${cc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${isActive ? cc.active : "text-gray-700"}`}>{s.name}</div>
                  <div className="text-[10px] text-gray-400 truncate" style={{ fontFamily: "serif" }}>{s.hebrew}</div>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{s.tractates.length}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-[10px] text-gray-400">37 tractates · 2,711 folios</div>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{seder.name}</h1>
            <p className="text-sm text-gray-500">{seder.description} · {seder.tractates.length} tractates</p>
          </div>
          <div className="text-2xl text-gray-400" style={{ fontFamily: "serif" }}>{seder.hebrew}</div>
        </div>

        {/* Tractate grid */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-4">
            {seder.tractates.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-150 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{t.dafim} daf</div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="text-base font-medium text-gray-900 mb-1">{t.name}</div>
                <div className="text-lg text-gray-500" style={{ fontFamily: "serif" }}>{t.hebrew}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

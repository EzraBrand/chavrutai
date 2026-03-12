const SEDARIM = [
  {
    name: "Seder Zeraim",
    hebrew: "סדר זרעים",
    latin: "Seeds",
    description: "Agriculture, blessings, and the foundation of daily life",
    tractates: [
      { name: "Berakhot", hebrew: "ברכות" },
    ],
  },
  {
    name: "Seder Moed",
    hebrew: "סדר מועד",
    latin: "Appointed Times",
    description: "The sacred calendar — Sabbath, festivals, and holy days",
    tractates: [
      { name: "Shabbat", hebrew: "שבת" },
      { name: "Eruvin", hebrew: "עירובין" },
      { name: "Pesachim", hebrew: "פסחים" },
      { name: "Rosh Hashanah", hebrew: "ראש השנה" },
      { name: "Yoma", hebrew: "יומא" },
      { name: "Sukkah", hebrew: "סוכה" },
      { name: "Beitzah", hebrew: "ביצה" },
      { name: "Taanit", hebrew: "תענית" },
      { name: "Megillah", hebrew: "מגילה" },
      { name: "Moed Katan", hebrew: "מועד קטן" },
      { name: "Chagigah", hebrew: "חגיגה" },
    ],
  },
  {
    name: "Seder Nashim",
    hebrew: "סדר נשים",
    latin: "Women",
    description: "Marriage, divorce, vows, and the laws of family life",
    tractates: [
      { name: "Yevamot", hebrew: "יבמות" },
      { name: "Ketubot", hebrew: "כתובות" },
      { name: "Nedarim", hebrew: "נדרים" },
      { name: "Nazir", hebrew: "נזיר" },
      { name: "Sotah", hebrew: "סוטה" },
      { name: "Gittin", hebrew: "גיטין" },
      { name: "Kiddushin", hebrew: "קידושין" },
    ],
  },
  {
    name: "Seder Nezikin",
    hebrew: "סדר נזיקין",
    latin: "Damages",
    description: "Civil and criminal law, courts, oaths, and ethics",
    tractates: [
      { name: "Bava Kamma", hebrew: "בבא קמא" },
      { name: "Bava Metzia", hebrew: "בבא מציעא" },
      { name: "Bava Batra", hebrew: "בבא בתרא" },
      { name: "Sanhedrin", hebrew: "סנהדרין" },
      { name: "Makkot", hebrew: "מכות" },
      { name: "Shevuot", hebrew: "שבועות" },
      { name: "Avodah Zarah", hebrew: "עבודה זרה" },
      { name: "Horayot", hebrew: "הוריות" },
    ],
  },
  {
    name: "Seder Kodashim",
    hebrew: "סדר קדשים",
    latin: "Holy Things",
    description: "Temple service, sacrificial offerings, and sacred consecration",
    tractates: [
      { name: "Zevachim", hebrew: "זבחים" },
      { name: "Menachot", hebrew: "מנחות" },
      { name: "Chullin", hebrew: "חולין" },
      { name: "Bekhorot", hebrew: "בכורות" },
      { name: "Arakhin", hebrew: "ערכין" },
      { name: "Temurah", hebrew: "תמורה" },
      { name: "Keritot", hebrew: "כריתות" },
      { name: "Meilah", hebrew: "מעילה" },
      { name: "Tamid", hebrew: "תמיד" },
    ],
  },
  {
    name: "Seder Tohorot",
    hebrew: "סדר טהרות",
    latin: "Purities",
    description: "Ritual purity, impurity, and spiritual cleanliness",
    tractates: [
      { name: "Niddah", hebrew: "נדה" },
    ],
  },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export function LibraryEditorial() {
  return (
    <div className="min-h-screen" style={{ background: "#FAF6EF", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <header style={{ background: "#2C1810", color: "#F5E6D0" }} className="px-12 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm tracking-[0.25em] uppercase opacity-70 mb-1">ChavrutAI</div>
            <div className="text-2xl font-bold tracking-wide">Talmud Bavli</div>
          </div>
          <div className="text-right">
            <div className="text-3xl" style={{ fontFamily: "serif", color: "#D4A96A" }}>תלמוד בבלי</div>
            <div className="text-xs tracking-widest uppercase opacity-60 mt-1">Babylonian Talmud</div>
          </div>
        </div>
      </header>

      {/* Subtitle band */}
      <div style={{ background: "#D4A96A" }} className="px-12 py-2">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: "#2C1810" }}>
            Complete Digital Collection · 37 Tractates · 2,711 Folios
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-12 py-10">
        {SEDARIM.map((seder, i) => (
          <section key={seder.name} className="mb-12">
            {/* Seder heading */}
            <div className="flex items-center gap-6 mb-6">
              <div className="text-5xl font-bold opacity-10" style={{ color: "#2C1810", fontFamily: "Georgia, serif", lineHeight: 1 }}>
                {ROMAN[i]}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl font-bold" style={{ color: "#2C1810" }}>{seder.name}</h2>
                  <span className="text-base opacity-50" style={{ color: "#2C1810" }}>·</span>
                  <span className="text-base italic opacity-60" style={{ color: "#2C1810" }}>{seder.latin}</span>
                </div>
                <div className="text-xs tracking-wider uppercase opacity-50 mt-0.5" style={{ color: "#2C1810" }}>{seder.description}</div>
              </div>
              <div className="text-2xl" style={{ color: "#D4A96A", fontFamily: "serif" }}>{seder.hebrew}</div>
            </div>

            {/* Decorative rule */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #D4A96A, transparent)" }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4A96A" }} />
              <div className="w-1 h-1 rounded-full" style={{ background: "#D4A96A", opacity: 0.5 }} />
            </div>

            {/* Tractate list */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {seder.tractates.map((t, ti) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between py-2 cursor-pointer group"
                  style={{ borderBottom: "1px solid rgba(44,24,16,0.08)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-30 w-4 text-right" style={{ color: "#2C1810" }}>{ti + 1}</span>
                    <span className="text-base group-hover:underline transition-all" style={{ color: "#2C1810" }}>{t.name}</span>
                  </div>
                  <span className="text-base" style={{ color: "#8B6914", fontFamily: "serif" }}>{t.hebrew}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ background: "#2C1810", color: "#F5E6D0" }} className="px-12 py-6 mt-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs tracking-widest uppercase opacity-50">Powered by ChavrutAI · Sefaria Partnership</div>
        </div>
      </footer>
    </div>
  );
}

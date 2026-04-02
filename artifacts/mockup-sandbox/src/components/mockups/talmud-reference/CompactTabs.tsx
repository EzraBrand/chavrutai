import { useState } from "react";

const MOCK_TALMUD_SECTIONS = [
  {
    hebrew: "אָמַר רָבָא: לֹא שָׁנוּ אֶלָּא שֶׁלֹּא כְּנֶגֶד זְמַן, אֲבָל כְּנֶגֶד זְמַן – דִּבְרֵי הַכֹּל מֻתָּר.",
    english: `<strong>Rava</strong> stated: They taught this <strong>halakha</strong> only when it is not adjacent to the set time. But if it is adjacent to the time, everyone agrees it is permitted.`,
  },
  {
    hebrew: "מֵיתִיבִי: כָּל מָקוֹם שֶׁנֶּאֱמַר ״בְּרֵאשִׁית״ אֵינוֹ אֶלָּא לְהַחְמִיר.",
    english: `An objection is raised from a <strong>baraita</strong>: Wherever it is stated "<a href="/bible/genesis/1#1" style="color: var(--talmud-blue, #2563eb); text-decoration: none; border-bottom: 1px solid currentColor;">Genesis 1:1</a>," it serves only to be stringent.`,
  },
  {
    hebrew: "וְאָמַר אַבַּיֵּי: כֵּיוָן שֶׁגָּלוּ לְבָבֶל, פָּקְעָה מֵהֶם זְכוּת יְרוּשָׁלַיִם.",
    english: `And <strong>Abaye</strong> said: Once they were exiled to <strong>Babylonia</strong>, the merit of <strong>Jerusalem</strong> departed from them. As it is written: "<a href="/bible/exodus/20#2" style="color: var(--talmud-blue, #2563eb); text-decoration: none; border-bottom: 1px solid currentColor;">Exodus 20:2</a>" — I am YHWH thy God.`,
  },
  {
    hebrew: "דִּכְתִיב: שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד.",
    english: `As it is written: "<a href="/bible/deuteronomy/6#4" style="color: var(--talmud-blue, #2563eb); text-decoration: none; border-bottom: 1px solid currentColor;">Deuteronomy 6:4</a>" — Hear, O Israel: YHWH our God, YHWH is one.`,
  },
];

const MOCK_TERMS = [
  { name: "Rava", hebrew: "רָבָא", category: "name" as const, desc: "4th-generation Babylonian Amora. Frequent debate partner of Abaye. Head of the academy in Mahoza.", variants: "", count: 3450 },
  { name: "Abaye", hebrew: "אַבַּיֵּי", category: "name" as const, desc: "4th-generation Babylonian Amora. Head of the academy in Pumbedita. Student of Rabbah and Rav Yosef.", variants: "", count: 3120 },
  { name: "Halakha", hebrew: "הֲלָכָה", category: "concept" as const, desc: "Jewish religious law derived from the Written and Oral Torah.", variants: "Halakhot", count: 15300 },
  { name: "Baraita", hebrew: "בָּרַיְיתָא", category: "concept" as const, desc: "A tradition in the Jewish oral law not incorporated in the Mishnah.", variants: "Baraitot", count: 8400 },
  { name: "Jerusalem", hebrew: "יְרוּשָׁלַיִם", category: "place" as const, desc: "The holy city and site of the Temple.", variants: "Yerushalayim", count: 2150 },
  { name: "Babylonia", hebrew: "בָּבֶל", category: "place" as const, desc: "Major center of Jewish learning. Location where the Babylonian Talmud was compiled.", variants: "Bavel", count: 4800 },
];

const MOCK_VERSES = [
  { ref: "Genesis 1:1", hebrew: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", english: "In the beginning God created the heaven and the earth." },
  { ref: "Exodus 20:2", hebrew: "אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם מִבֵּית עֲבָדִים", english: "I am YHWH thy God, who brought thee out of the land of Egypt, out of the house of bondage." },
  { ref: "Deuteronomy 6:4", hebrew: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", english: "Hear, O Israel: YHWH our God, YHWH is one." },
];

const CATEGORY_BG: Record<string, string> = {
  name: "rgba(180, 140, 60, 0.12)",
  concept: "rgba(80, 120, 180, 0.10)",
  place: "rgba(100, 160, 100, 0.10)",
};

export function CompactTabs() {
  const [activeTab, setActiveTab] = useState<"text" | "terms" | "verses">("text");

  const tabs = [
    { id: "text" as const, label: "Text & Translation" },
    { id: "terms" as const, label: "Key Terms" },
    { id: "verses" as const, label: "Bible Verses" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Roboto', sans-serif", background: "#F5EEE8", color: "hsl(25, 12%, 18%)", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "hsl(28, 30%, 93%)", borderBottom: "1px solid hsl(25, 18%, 80%)", padding: "16px 24px" }}>
        <nav style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", maxWidth: "800px", margin: "0 auto" }}>
          Talmud Bavli &gt; Sanhedrin &gt; Chapter 11 (Perek Chelek) &gt; 90a
        </nav>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        {/* Page Title */}
        <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "4px", color: "hsl(20, 60%, 35%)" }}>
          Sanhedrin 90a
        </h1>
        <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", marginBottom: "20px" }}>
          This passage discusses the concept of resurrection of the dead as derived from the Torah.
        </p>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid hsl(25, 18%, 80%)", marginBottom: "24px", display: "flex", gap: "0" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "hsl(20, 60%, 35%)" : "hsl(25, 8%, 42%)",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid hsl(20, 60%, 35%)" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Text & Translation Tab */}
        {activeTab === "text" && (
          <div style={{ background: "hsl(28, 30%, 93%)", border: "1px solid hsl(25, 18%, 80%)", borderRadius: "6px", padding: "24px" }}>
            {MOCK_TALMUD_SECTIONS.map((section, idx) => (
              <div key={idx} style={{ borderBottom: idx < MOCK_TALMUD_SECTIONS.length - 1 ? "1px solid hsl(25, 18%, 85%)" : "none", paddingBottom: "20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", color: "hsl(25, 8%, 52%)", textAlign: "center", marginBottom: "12px" }}>
                  section {idx + 1}
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div style={{ flex: "1" }}>
                    <div style={{ fontSize: "15px", lineHeight: 1.8, color: "hsl(25, 12%, 25%)" }} dangerouslySetInnerHTML={{ __html: section.english }} />
                  </div>
                  <div style={{ flex: "0.6", textAlign: "right" }}>
                    <p style={{ fontSize: "18px", lineHeight: 1.9, fontWeight: 700, direction: "rtl" as const }}>
                      {section.hebrew}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key Terms Tab */}
        {activeTab === "terms" && (
          <div>
            <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", marginBottom: "16px" }}>
              {MOCK_TERMS.length} unique terms identified on this page.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "hsl(25, 18%, 80%)", border: "1px solid hsl(25, 18%, 80%)", borderRadius: "6px", overflow: "hidden" }}>
              {MOCK_TERMS.map((term, idx) => (
                <div key={idx} style={{ background: "hsl(28, 30%, 93%)", padding: "14px 20px", display: "flex", alignItems: "baseline", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "15px" }}>{term.name}</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, direction: "rtl" as const, color: "hsl(25, 12%, 35%)" }}>{term.hebrew}</span>
                      <span style={{ fontSize: "11px", color: "hsl(25, 8%, 52%)", textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "1px 6px", background: CATEGORY_BG[term.category], borderRadius: "3px" }}>
                        {term.category}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", lineHeight: 1.5, margin: 0 }}>
                      {term.desc}
                      {term.variants && <span style={{ color: "hsl(25, 8%, 58%)" }}> Also: {term.variants}.</span>}
                    </p>
                  </div>
                  <div style={{ fontSize: "12px", color: "hsl(25, 8%, 52%)", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                    {term.count.toLocaleString()} occurrences
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bible Verses Tab */}
        {activeTab === "verses" && (
          <div>
            <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", marginBottom: "16px" }}>
              {MOCK_VERSES.length} biblical citations found on this page.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {MOCK_VERSES.map((verse, idx) => (
                <div key={idx} style={{ background: "hsl(28, 30%, 93%)", border: "1px solid hsl(25, 18%, 80%)", borderRadius: "6px", padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "hsl(20, 60%, 35%)" }}>{verse.ref}</span>
                    <a href="#" style={{ fontSize: "12px", color: "hsl(207, 70%, 45%)", textDecoration: "none" }}>
                      Open in Bible Reader
                    </a>
                  </div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "hsl(25, 12%, 30%)", margin: 0 }}>{verse.english}</p>
                    </div>
                    <div style={{ flex: "0.6", textAlign: "right" }}>
                      <p style={{ fontSize: "17px", lineHeight: 1.9, fontWeight: 700, direction: "rtl" as const, margin: 0 }}>{verse.hebrew}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "20px", fontSize: "12px", color: "hsl(25, 8%, 52%)", borderTop: "1px solid hsl(25, 18%, 85%)", marginTop: "40px" }}>
        ChavrutAI · Data provided by Sefaria
      </footer>
    </div>
  );
}

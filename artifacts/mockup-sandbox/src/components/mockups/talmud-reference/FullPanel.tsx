import { useState } from "react";

const MOCK_TALMUD_SECTIONS = [
  {
    hebrew: "אָמַר רָבָא: לֹא שָׁנוּ אֶלָּא שֶׁלֹּא כְּנֶגֶד זְמַן, אֲבָל כְּנֶגֶד זְמַן – דִּבְרֵי הַכֹּל מֻתָּר.",
    english: `<strong>Rava</strong> stated: They taught this <strong>halakha</strong> only when it is not adjacent to the set time. But if it is adjacent to the time, everyone agrees it is permitted.`,
    highlightedTerms: ["Rava", "halakha"],
  },
  {
    hebrew: "מֵיתִיבִי: כָּל מָקוֹם שֶׁנֶּאֱמַר ״בְּרֵאשִׁית״ אֵינוֹ אֶלָּא לְהַחְמִיר.",
    english: `An objection is raised from a <strong>baraita</strong>: Wherever it is stated "<a href="/bible/genesis/1#1" style="color: hsl(207, 70%, 45%); text-decoration: none; border-bottom: 1px solid currentColor;">Genesis 1:1</a>," it serves only to be stringent.`,
    highlightedTerms: ["baraita"],
  },
  {
    hebrew: "וְאָמַר אַבַּיֵּי: כֵּיוָן שֶׁגָּלוּ לְבָבֶל, פָּקְעָה מֵהֶם זְכוּת יְרוּשָׁלַיִם.",
    english: `And <strong>Abaye</strong> said: Once they were exiled to <strong>Babylonia</strong>, the merit of <strong>Jerusalem</strong> departed from them. As it is written: "<a href="/bible/exodus/20#2" style="color: hsl(207, 70%, 45%); text-decoration: none; border-bottom: 1px solid currentColor;">Exodus 20:2</a>" — I am YHWH thy God.`,
    highlightedTerms: ["Abaye", "Babylonia", "Jerusalem"],
  },
  {
    hebrew: "דִּכְתִיב: שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד.",
    english: `As it is written: "<a href="/bible/deuteronomy/6#4" style="color: hsl(207, 70%, 45%); text-decoration: none; border-bottom: 1px solid currentColor;">Deuteronomy 6:4</a>" — Hear, O Israel: YHWH our God, YHWH is one.`,
    highlightedTerms: [],
  },
];

const MOCK_TERMS = [
  { name: "Rava", hebrew: "רָבָא", category: "name" as const, desc: "4th-generation Babylonian Amora. Frequent debate partner of Abaye. Head of the academy in Mahoza.", teacher: "Rav Nachman", studentOf: "Rav Yosef", count: 3450, pageCount: 3 },
  { name: "Abaye", hebrew: "אַבַּיֵּי", category: "name" as const, desc: "4th-generation Babylonian Amora. Head of the academy in Pumbedita.", teacher: "Rabbah", studentOf: "Rav Yosef", count: 3120, pageCount: 1 },
  { name: "Halakha", hebrew: "הֲלָכָה", category: "concept" as const, desc: "Jewish religious law derived from the Written and Oral Torah.", count: 15300, pageCount: 2 },
  { name: "Baraita", hebrew: "בָּרַיְיתָא", category: "concept" as const, desc: "A tradition in the Jewish oral law not incorporated in the Mishnah.", count: 8400, pageCount: 1 },
  { name: "Jerusalem", hebrew: "יְרוּשָׁלַיִם", category: "place" as const, desc: "The holy city and site of the Temple.", count: 2150, pageCount: 1 },
  { name: "Babylonia", hebrew: "בָּבֶל", category: "place" as const, desc: "Major center of Jewish learning. Location where the Babylonian Talmud was compiled.", count: 4800, pageCount: 1 },
];

const MOCK_VERSES = [
  { ref: "Genesis 1:1", hebrew: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", english: "In the beginning God created the heaven and the earth." },
  { ref: "Exodus 20:2", hebrew: "אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם מִבֵּית עֲבָדִים", english: "I am YHWH thy God, who brought thee out of the land of Egypt, out of the house of bondage." },
  { ref: "Deuteronomy 6:4", hebrew: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", english: "Hear, O Israel: YHWH our God, YHWH is one." },
];

const CATEGORY_LABEL_STYLE: Record<string, { bg: string; color: string }> = {
  name: { bg: "rgba(180, 140, 60, 0.12)", color: "hsl(35, 40%, 35%)" },
  concept: { bg: "rgba(80, 120, 180, 0.10)", color: "hsl(207, 30%, 35%)" },
  place: { bg: "rgba(100, 160, 100, 0.10)", color: "hsl(130, 20%, 32%)" },
};

export function FullPanel() {
  const [panelTab, setPanelTab] = useState<"terms" | "verses">("verses");
  const [panelOpen, setPanelOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "name" | "concept" | "place">("all");

  const filteredTerms = (categoryFilter === "all" ? MOCK_TERMS : MOCK_TERMS.filter(t => t.category === categoryFilter))
    .slice()
    .sort((a, b) => b.pageCount - a.pageCount);

  return (
    <div style={{ fontFamily: "'Inter', 'Roboto', sans-serif", background: "#F5EEE8", color: "hsl(25, 12%, 18%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "hsl(28, 30%, 93%)", borderBottom: "1px solid hsl(25, 18%, 80%)", padding: "16px 24px", flexShrink: 0 }}>
        <nav style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", maxWidth: "800px", margin: "0 auto" }}>
          Talmud Bavli &gt; Sanhedrin &gt; Chapter 11 (Perek Chelek) &gt; 90a
        </nav>
      </header>

      {/* Main Text Area */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "4px", color: "hsl(20, 60%, 35%)" }}>
            Sanhedrin 90a
          </h1>
          <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", marginBottom: "20px" }}>
            This passage discusses the concept of resurrection of the dead as derived from the Torah.
          </p>

          {/* Jump to section */}
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "hsl(25, 8%, 52%)" }}>Jump to section:</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "20px" }}>
            {MOCK_TALMUD_SECTIONS.map((_, idx) => (
              <span key={idx} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "4px", fontSize: "13px", fontWeight: 500, background: "hsl(28, 20%, 90%)", color: "hsl(25, 12%, 18%)", cursor: "pointer" }}>
                {idx + 1}
              </span>
            ))}
          </div>

          {/* Text Content */}
          <div style={{ background: "hsl(28, 30%, 93%)", border: "1px solid hsl(25, 18%, 80%)", borderRadius: "6px", padding: "24px" }}>
            {MOCK_TALMUD_SECTIONS.map((section, idx) => (
              <div key={idx} style={{ borderBottom: idx < MOCK_TALMUD_SECTIONS.length - 1 ? "1px solid hsl(25, 18%, 85%)" : "none", paddingBottom: "20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", color: "hsl(25, 8%, 52%)", textAlign: "center", marginBottom: "12px" }}>
                  section {idx + 1}
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", lineHeight: 1.8, color: "hsl(25, 12%, 25%)" }} dangerouslySetInnerHTML={{ __html: section.english }} />
                  </div>
                  <div style={{ flex: "0.6", textAlign: "right" }}>
                    <p style={{ fontSize: "18px", lineHeight: 1.9, fontWeight: 700, direction: "rtl" as const, margin: 0 }}>
                      {section.hebrew}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Collapsible Reference Panel */}
      <div style={{ borderTop: "1px solid hsl(25, 18%, 75%)", background: "hsl(28, 30%, 93%)", flexShrink: 0 }}>
        {/* Panel Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: panelOpen ? "1px solid hsl(25, 18%, 80%)" : "none" }}>
          <div style={{ display: "flex", gap: "0" }}>
            <button
              onClick={() => { setPanelTab("verses"); setPanelOpen(true); }}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: panelTab === "verses" && panelOpen ? 600 : 400,
                color: panelTab === "verses" && panelOpen ? "hsl(20, 60%, 35%)" : "hsl(25, 8%, 42%)",
                background: "transparent",
                border: "none",
                borderBottom: panelTab === "verses" && panelOpen ? "2px solid hsl(20, 60%, 35%)" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              Bible Verses ({MOCK_VERSES.length})
            </button>
            <button
              onClick={() => { setPanelTab("terms"); setPanelOpen(true); }}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: panelTab === "terms" && panelOpen ? 600 : 400,
                color: panelTab === "terms" && panelOpen ? "hsl(20, 60%, 35%)" : "hsl(25, 8%, 42%)",
                background: "transparent",
                border: "none",
                borderBottom: panelTab === "terms" && panelOpen ? "2px solid hsl(20, 60%, 35%)" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              Key Terms (beta) ({MOCK_TERMS.length})
            </button>
          </div>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{ padding: "6px 12px", fontSize: "12px", color: "hsl(25, 8%, 42%)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            {panelOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {/* Panel Content */}
        {panelOpen && (
          <div style={{ maxHeight: "340px", overflow: "auto", padding: "16px 24px" }}>
            {panelTab === "terms" && (
              <div>
                {/* Category filters */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  {(["all", "name", "concept", "place"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        borderRadius: "3px",
                        border: "1px solid",
                        borderColor: categoryFilter === cat ? "hsl(20, 60%, 35%)" : "hsl(25, 18%, 80%)",
                        background: categoryFilter === cat ? "hsl(20, 60%, 35%)" : "transparent",
                        color: categoryFilter === cat ? "#F5EEE8" : "hsl(25, 8%, 42%)",
                        cursor: "pointer",
                        textTransform: "capitalize" as const,
                      }}
                    >
                      {cat === "all" ? "All" : cat + "s"} ({cat === "all" ? MOCK_TERMS.length : MOCK_TERMS.filter(t => t.category === cat).length})
                    </button>
                  ))}
                </div>

                {/* Terms list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "hsl(25, 18%, 82%)", borderRadius: "6px", overflow: "hidden" }}>
                  {filteredTerms.map((term, idx) => (
                    <div key={idx} style={{ background: "#F5EEE8", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "3px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{term.name}</span>
                        <span style={{ fontSize: "15px", fontWeight: 700, direction: "rtl" as const, color: "hsl(25, 12%, 35%)" }}>{term.hebrew}</span>
                        <span style={{ fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "1px 5px", borderRadius: "2px", background: CATEGORY_LABEL_STYLE[term.category].bg, color: CATEGORY_LABEL_STYLE[term.category].color }}>
                          {term.category}
                        </span>
                        <span style={{ fontSize: "11px", color: "hsl(25, 8%, 55%)", marginLeft: "auto" }}>
                          {term.pageCount}× on page
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "hsl(25, 8%, 42%)", lineHeight: 1.4, margin: 0 }}>
                        {term.desc}
                      </p>
                      {"teacher" in term && term.teacher && (
                        <p style={{ fontSize: "12px", color: "hsl(25, 8%, 52%)", margin: "4px 0 0 0" }}>
                          Teacher: {term.teacher} · Student of: {term.studentOf}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {panelTab === "verses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {MOCK_VERSES.map((verse, idx) => (
                  <div key={idx} style={{ background: "#F5EEE8", border: "1px solid hsl(25, 18%, 82%)", borderRadius: "6px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "hsl(20, 60%, 35%)" }}>{verse.ref}</span>
                      <a href="#" style={{ fontSize: "12px", color: "hsl(207, 70%, 45%)", textDecoration: "none" }}>Open in Bible Reader</a>
                    </div>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <p style={{ flex: 1, fontSize: "13px", lineHeight: 1.7, color: "hsl(25, 12%, 30%)", margin: 0 }}>{verse.english}</p>
                      <p style={{ flex: "0.6", fontSize: "16px", lineHeight: 1.8, fontWeight: 700, direction: "rtl" as const, textAlign: "right", margin: 0 }}>{verse.hebrew}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

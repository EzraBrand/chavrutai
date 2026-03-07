import { describe, expect, it } from "vitest";
import {
  extractSefariaReferenceFromUrl,
  locateTalmudSourceProvenance,
} from "../server/lib/talmud-source-provenance";

describe("talmud source provenance", () => {
  it("extracts a Sefaria reference from a URL", () => {
    expect(
      extractSefariaReferenceFromUrl("https://www.sefaria.org/Shabbat.118a.7-118b.4?lang=bi"),
    ).toBe("Shabbat.118a.7-118b.4");
  });

  it("finds the exact Hebrew section for a gold-set unit", () => {
    const provenance = locateTalmudSourceProvenance({
      hebrewText: "אמר רבי שמעון בן פזי אמר רבי יהושע בן לוי משום בר קפרא",
      englishText: "R' Shimon ben Pazi said that R' Yehoshua ben Levi said in the name of Bar Kappara",
      hebrewSections: [
        "תניא רבי מאיר אומר כל העוסק בתורה לשמה זוכה לדברים הרבה",
        "אמר רבי שמעון בן פזי אמר רבי יהושע בן לוי משום בר קפרא כל הקובע סעודה בשבת ניצול משלש פורעניות",
      ],
      englishSections: [
        "It is taught in a baraita that Rabbi Meir says: Anyone who engages in Torah for its own sake merits many things.",
        "R' Shimon ben Pazi said that R' Yehoshua ben Levi said in the name of Bar Kappara: Anyone who establishes a meal on Shabbat is saved from three calamities.",
      ],
      sectionRefs: ["Shabbat.118a.7", "Shabbat.118a.8"],
    });

    expect(provenance).not.toBeNull();
    expect(provenance?.sectionIndex).toBe(1);
    expect(provenance?.sectionRef).toBe("Shabbat.118a.8");
    expect(provenance?.matchStrategy).toBe("hebrew_exact");
  });

  it("falls back to overlap scoring when the exact text is condensed", () => {
    const provenance = locateTalmudSourceProvenance({
      hebrewText: "",
      englishText: "Abaye heard a certain man say to a woman let us rise early and go on the road",
      hebrewSections: [
        "תנו רבנן לעולם יהא אדם זהיר בתפלת המנחה",
        "כי הא דאביי שמעיה לההוא גברא דקאמר לההיא איתתא נקדים וניזיל באורחא",
      ],
      englishSections: [
        "The Sages taught: A person should always be careful with the afternoon prayer.",
        "Abaye once heard a certain man say to a certain woman: Let us rise early and go on the road.",
      ],
      sectionRefs: ["Sukkah.52a.10", "Sukkah.52a.11"],
    });

    expect(provenance).not.toBeNull();
    expect(provenance?.sectionRef).toBe("Sukkah.52a.11");
    expect(["english_exact", "bilingual_overlap"]).toContain(provenance?.matchStrategy);
  });
});

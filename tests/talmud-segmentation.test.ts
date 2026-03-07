import { describe, expect, it } from "vitest";
import {
  TALMUD_SEGMENTATION_VERSION,
  buildTalmudPageSegmentationScaffolds,
  buildTalmudSectionSegmentationScaffold,
} from "../server/lib/talmud-segmentation";

describe("Talmud segmentation scaffold", () => {
  it("extracts bold English anchors and candidate segments", () => {
    const scaffold = buildTalmudSectionSegmentationScaffold({
      ref: "Sukkah.52a:11",
      sectionIndex: 10,
      hebrew:
        "כִּי הָא דְּאַבָּיֵי שַׁמְעֵיהּ לְהָהוּא גַּבְרָא דְּקָאָמַר לְהַהִיא אִתְּתָא: נַקְדֵּים וְנֵיזִיל בְּאוֹרְחָא.",
      english:
        'It is <b>like this</b> incident, <b>as Abaye once heard a certain man say to a certain woman: Let us rise early and go on the road.</b>',
    });

    expect(scaffold.version).toBe(TALMUD_SEGMENTATION_VERSION);
    expect(scaffold.status).toBe("rules_only");
    expect(scaffold.englishAnchors.length).toBe(2);
    expect(scaffold.englishAnchors[0].text).toBe("like this");
    expect(scaffold.englishCandidates.length).toBeGreaterThan(1);
    expect(scaffold.hebrewCandidates.length).toBeGreaterThan(0);
  });

  it("builds page-level scaffolds for uneven section arrays", () => {
    const scaffolds = buildTalmudPageSegmentationScaffolds(
      "Berakhot.2a",
      ["הכא במאי עסקינן.", "אמר רב יהודה:"],
      ['<b>The Gemara asks:</b> With what are we dealing here?'],
    );

    expect(scaffolds.length).toBe(2);
    expect(scaffolds[0].ref).toBe("Berakhot.2a:1");
    expect(scaffolds[1].normalizedEnglish).toBe("");
  });
});

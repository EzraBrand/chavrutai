import { describe, expect, it } from "vitest";
import { scoreBlogpostSegmentationEvalDataset } from "../server/lib/blogpost-segmentation-scorer";

describe("blogpost segmentation scorer", () => {
  it("scores coverage and candidate-count match for section-grouped examples", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({
      he: ["אמר רבי שמעון בן פזי אמר רבי יהושע בן לוי משום בר קפרא כל המקיים שלש סעודות בשבת ניצול משלש פורעניות"],
      text: ["R' Shimon ben Pazi said that R' Yehoshua ben Levi said in the name of bar Kappara: Anyone who fulfills three meals on Shabbat is rescued from three punishments."],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    try {
      const report = await scoreBlogpostSegmentationEvalDataset({
        generatedAt: new Date().toISOString(),
        source: {
          archiveRoot: "archive",
          mappingCsvPath: "mapping.csv",
        },
        postCount: 1,
        exampleCount: 1,
        examples: [
          {
            exampleId: "post-1::0",
            ref: "Shabbat 118a-b :: unit 1",
            pageRange: "Shabbat 118a-b",
            heading: null,
            postId: "post-1",
            postDate: "2026-03-07T00:00:00.000Z",
            postTitle: "Title",
            htmlPath: "post.html",
            sefariaUrl: "https://www.sefaria.org/Shabbat.118a.7-118b.4",
            sefariaRef: "Shabbat.118a.7-118b.4",
            sourceKind: "block",
            hebrew: "אמר רבי שמעון בן פזי אמר רבי יהושע בן לוי משום בר קפרא כל המקיים שלש סעודות בשבת ניצול משלש פורעניות",
            english: "R' Shimon ben Pazi said that R' Yehoshua ben Levi said in the name of bar Kappara: Anyone who fulfills three meals on Shabbat is rescued from three punishments.",
            hebrewHtml: "<p>אמר רבי שמעון</p>",
            englishHtml: "<p>R' Shimon</p>",
            sourceProvenance: {
              sectionIndex: 0,
              sectionNumber: 1,
              sectionRef: "Shabbat.118a.7",
              matchStrategy: "hebrew_exact",
              matchConfidence: 1,
              startChar: 0,
              endChar: 104,
            },
          },
        ],
      }, "eval.json");

      expect(report.sectionCount).toBe(1);
      expect(report.exampleCount).toBe(1);
      expect(report.hebrewCoverageRate).toBeGreaterThanOrEqual(0);
      expect(report.englishCoverageRate).toBeGreaterThanOrEqual(0);
      expect(report.sections[0].goldSegmentCount).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

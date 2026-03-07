import fs from "fs";
import { describe, expect, it } from "vitest";
import { buildBlogpostSegmentationEvalDataset, convertBlogpostGoldsetToEvalDataset } from "../server/lib/blogpost-goldset-eval";

const archiveRoot = "c:\\Users\\ezrab\\Downloads\\blogpost_archive_tmp2";
const mappingCsvPath = "c:\\Users\\ezrab\\Downloads\\talmud-blogpost-dafyomi-grid\\blogpost_dafyomi_db.csv";
const hasLocalFixtures = fs.existsSync(archiveRoot) && fs.existsSync(mappingCsvPath);

describe("blogpost goldset eval conversion", () => {
  it.skipIf(!hasLocalFixtures)("converts extracted units into evaluation examples", () => {
    const dataset = buildBlogpostSegmentationEvalDataset({
      archiveRoot,
      mappingCsvPath,
      limit: 1,
    });

    expect(dataset.postCount).toBe(1);
    expect(dataset.exampleCount).toBeGreaterThan(5);
    expect(dataset.examples[0].pageRange).toBe("Shabbat 118a-b");
    expect(dataset.examples[0].ref).toContain("Shabbat 118a-b");
    expect(dataset.examples[0].hebrew).toContain("אמר רבי שמעון");
    expect(dataset.examples[0].english).toContain("R");
  });

  it("preserves unit-level source provenance in eval examples", () => {
    const dataset = convertBlogpostGoldsetToEvalDataset({
      generatedAt: new Date().toISOString(),
      archiveRoot: "archive",
      mappingCsvPath: "mapping.csv",
      provenanceStatus: "section_level",
      posts: [
        {
          postId: "post-1",
          postDate: "2026-03-07T00:00:00.000Z",
          title: "Title",
          pageRange: "Shabbat 118a-b",
          baseMappedTitle: "Title",
          htmlPath: "post.html",
          sefariaUrl: "https://www.sefaria.org/Shabbat.118a.7-118b.4",
          sefariaRef: "Shabbat.118a.7-118b.4",
          units: [
            {
              index: 0,
              heading: null,
              hebrewHtml: "<p>אמר רבי שמעון</p>",
              englishHtml: "<p>R' Shimon said</p>",
              hebrewText: "אמר רבי שמעון",
              englishText: "R' Shimon said",
              sourceKind: "block",
              sourceProvenance: {
                sectionIndex: 1,
                sectionNumber: 2,
                sectionRef: "Shabbat.118a.8",
                matchStrategy: "hebrew_exact",
                matchConfidence: 1,
                startChar: 0,
                endChar: 12,
              },
            },
          ],
        },
      ],
    });

    expect(dataset.examples[0].sourceProvenance?.sectionRef).toBe("Shabbat.118a.8");
    expect(dataset.examples[0].sourceProvenance?.sectionIndex).toBe(1);
  });
});

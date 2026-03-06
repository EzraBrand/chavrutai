import { describe, expect, it } from "vitest";
import { buildBlogpostSegmentationEvalDataset } from "../server/lib/blogpost-goldset-eval";

describe("blogpost goldset eval conversion", () => {
  it("converts extracted units into evaluation examples", () => {
    const dataset = buildBlogpostSegmentationEvalDataset({
      archiveRoot: "c:\\Users\\ezrab\\Downloads\\blogpost_archive_tmp2",
      mappingCsvPath: "c:\\Users\\ezrab\\Downloads\\talmud-blogpost-dafyomi-grid\\blogpost_dafyomi_db.csv",
      limit: 1,
    });

    expect(dataset.postCount).toBe(1);
    expect(dataset.exampleCount).toBeGreaterThan(5);
    expect(dataset.examples[0].pageRange).toBe("Shabbat 118a-b");
    expect(dataset.examples[0].ref).toContain("Shabbat 118a-b");
    expect(dataset.examples[0].hebrew).toContain("אמר רבי שמעון");
    expect(dataset.examples[0].english).toContain("R’ Shimon");
  });
});

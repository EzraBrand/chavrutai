import { describe, expect, it } from "vitest";
import { buildBlogpostGoldsetDataset } from "../server/lib/blogpost-goldset";

describe("blogpost goldset extractor", () => {
  it("builds paired units from the newest mapped archive post", () => {
    const dataset = buildBlogpostGoldsetDataset({
      archiveRoot: "c:\\Users\\ezrab\\Downloads\\blogpost_archive_tmp2",
      mappingCsvPath: "c:\\Users\\ezrab\\Downloads\\talmud-blogpost-dafyomi-grid\\blogpost_dafyomi_db.csv",
      limit: 1,
    });

    expect(dataset.posts).toHaveLength(1);
    expect(dataset.posts[0].pageRange).toBe("Shabbat 118a-b");
    expect(dataset.posts[0].sefariaRef).toBe("Shabbat.118a.7-118b.4");
    expect(dataset.posts[0].units.length).toBeGreaterThan(5);
    expect(dataset.posts[0].units[0].hebrewText).toContain("אמר רבי שמעון");
    expect(dataset.posts[0].units[0].englishText).toContain("R’ Shimon");
  });
});

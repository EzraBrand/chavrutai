import fs from "fs";
import {
  buildBlogpostGoldsetDataset,
  type BlogpostGoldsetBuildOptions,
  type BlogpostGoldsetDataset,
} from "./blogpost-goldset";

export interface TalmudSegmentationEvalExample {
  exampleId: string;
  ref: string;
  pageRange: string;
  heading: string | null;
  postId: string;
  postDate: string;
  postTitle: string;
  htmlPath: string;
  sefariaUrl: string | null;
  sefariaRef: string | null;
  sourceKind: "block" | "subblock";
  hebrew: string;
  english: string;
  hebrewHtml: string;
  englishHtml: string;
}

export interface TalmudSegmentationEvalDataset {
  generatedAt: string;
  source: {
    archiveRoot: string;
    mappingCsvPath: string;
  };
  postCount: number;
  exampleCount: number;
  examples: TalmudSegmentationEvalExample[];
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildExampleRef(pageRange: string, heading: string | null, unitIndex: number): string {
  const headingPart = heading
    ? heading.replace(/\s+/g, " ").trim()
    : "untitled";
  return `${pageRange} :: ${headingPart} :: ${unitIndex + 1}`;
}

export function convertBlogpostGoldsetToEvalDataset(
  dataset: BlogpostGoldsetDataset,
): TalmudSegmentationEvalDataset {
  const examples: TalmudSegmentationEvalExample[] = [];

  dataset.posts.forEach((post) => {
    post.units.forEach((unit) => {
      const hebrew = normalizeWhitespace(unit.hebrewText);
      const english = normalizeWhitespace(unit.englishText);
      if (!hebrew || !english) {
        return;
      }

      examples.push({
        exampleId: `${post.postId}::${unit.index}`,
        ref: buildExampleRef(post.pageRange, unit.heading, unit.index),
        pageRange: post.pageRange,
        heading: unit.heading,
        postId: post.postId,
        postDate: post.postDate,
        postTitle: post.title,
        htmlPath: post.htmlPath,
        sefariaUrl: post.sefariaUrl,
        sefariaRef: post.sefariaRef,
        sourceKind: unit.sourceKind,
        hebrew,
        english,
        hebrewHtml: unit.hebrewHtml,
        englishHtml: unit.englishHtml,
      });
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    source: {
      archiveRoot: dataset.archiveRoot,
      mappingCsvPath: dataset.mappingCsvPath,
    },
    postCount: dataset.posts.length,
    exampleCount: examples.length,
    examples,
  };
}

export function buildBlogpostSegmentationEvalDataset(
  options: BlogpostGoldsetBuildOptions,
): TalmudSegmentationEvalDataset {
  return convertBlogpostGoldsetToEvalDataset(
    buildBlogpostGoldsetDataset(options),
  );
}

export function writeBlogpostSegmentationEvalDataset(
  outputPath: string,
  options: BlogpostGoldsetBuildOptions,
): TalmudSegmentationEvalDataset {
  const dataset = buildBlogpostSegmentationEvalDataset(options);
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  return dataset;
}

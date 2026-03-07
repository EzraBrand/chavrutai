import fs from "fs";
import path from "path";
import { scoreBlogpostSegmentationEvalFile } from "./lib/blogpost-segmentation-scorer";

const outputDir = process.env.BLOGPOST_GOLDSET_OUTPUT_DIR
  || path.join(process.cwd(), "tmp", "blogpost-goldset");
const evalPath = process.env.BLOGPOST_EVAL_PATH
  || path.join(outputDir, "blogpost-segmentation-eval.json");
const scorePath = process.env.BLOGPOST_SCORE_PATH
  || path.join(outputDir, "blogpost-segmentation-score.json");

async function main() {
  const report = await scoreBlogpostSegmentationEvalFile(evalPath);
  fs.writeFileSync(scorePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote segmentation score report to ${scorePath}`);
  console.log(`Sections scored: ${report.sectionCount}`);
  console.log(`Examples scored: ${report.exampleCount}`);
  console.log(`English coverage: ${report.englishCoverageRate.toFixed(3)}`);
  console.log(`Hebrew coverage: ${report.hebrewCoverageRate.toFixed(3)}`);
  console.log(`Bilingual coverage: ${report.bilingualCoverageRate.toFixed(3)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

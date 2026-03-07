import fs from "fs";
import path from "path";
import {
  writeEnrichedBlogpostGoldsetDataset,
} from "./lib/blogpost-goldset";
import {
  writeEnrichedBlogpostSegmentationEvalDataset,
} from "./lib/blogpost-goldset-eval";

const archiveRoot = process.env.BLOGPOST_ARCHIVE_ROOT
  || "c:\\Users\\ezrab\\Downloads\\blogpost_archive_tmp2";
const mappingCsvPath = process.env.BLOGPOST_MAPPING_CSV
  || "c:\\Users\\ezrab\\Downloads\\talmud-blogpost-dafyomi-grid\\blogpost_dafyomi_db.csv";
const outputDir = process.env.BLOGPOST_GOLDSET_OUTPUT_DIR
  || path.join(process.cwd(), "tmp", "blogpost-goldset");
const limit = process.env.BLOGPOST_GOLDSET_LIMIT
  ? Number.parseInt(process.env.BLOGPOST_GOLDSET_LIMIT, 10)
  : 10;

if (!Number.isFinite(limit) || limit <= 0) {
  throw new Error(`Invalid BLOGPOST_GOLDSET_LIMIT: ${process.env.BLOGPOST_GOLDSET_LIMIT}`);
}

const goldsetPath = path.join(outputDir, "blogpost-goldset.json");
const evalPath = path.join(outputDir, "blogpost-segmentation-eval.json");

fs.mkdirSync(outputDir, { recursive: true });

const options = {
  archiveRoot,
  mappingCsvPath,
  limit,
};

async function main() {
  const goldset = await writeEnrichedBlogpostGoldsetDataset(goldsetPath, options);
  const evalDataset = await writeEnrichedBlogpostSegmentationEvalDataset(evalPath, options);

  console.log(`Wrote ${goldset.posts.length} posts to ${goldsetPath} (${goldset.provenanceStatus})`);
  console.log(`Wrote ${evalDataset.exampleCount} eval examples to ${evalPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

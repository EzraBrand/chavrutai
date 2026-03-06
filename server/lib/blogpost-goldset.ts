import fs from "fs";
import path from "path";

export interface BlogpostGoldsetBuildOptions {
  archiveRoot: string;
  mappingCsvPath: string;
  limit?: number;
}

export interface BlogpostGoldsetPost {
  postId: string;
  postDate: string;
  title: string;
  pageRange: string;
  baseMappedTitle: string;
  htmlPath: string;
  sefariaUrl: string | null;
  sefariaRef: string | null;
  units: BlogpostGoldsetUnit[];
}

export interface BlogpostGoldsetUnit {
  index: number;
  heading: string | null;
  hebrewHtml: string;
  englishHtml: string;
  hebrewText: string;
  englishText: string;
  sourceKind: "block" | "subblock";
}

export interface BlogpostGoldsetDataset {
  generatedAt: string;
  archiveRoot: string;
  mappingCsvPath: string;
  posts: BlogpostGoldsetPost[];
}

interface MappingRow {
  pageRange: string;
  blogpostTitle: string;
  dafYomiStartDate: string;
}

interface ArchivePostRow {
  postId: string;
  postDate: string;
  title: string;
}

interface TopLevelBlock {
  tagName: string;
  html: string;
}

const BLOCK_TAG_NAMES = new Set([
  "p",
  "blockquote",
  "ol",
  "ul",
  "h2",
  "h3",
  "h4",
  "div",
]);

function decodeCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsvFile(csvPath: string): string[][] {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(decodeCsvLine);
}

function loadMappingRows(csvPath: string): MappingRow[] {
  const [header, ...rows] = parseCsvFile(csvPath);
  const indexes = {
    pageRange: header.indexOf("page range"),
    blogpostTitle: header.indexOf("blogpost title"),
    dafYomiStartDate: header.indexOf("daf yomi start date"),
  };

  return rows.map((row) => ({
    pageRange: row[indexes.pageRange] || "",
    blogpostTitle: row[indexes.blogpostTitle] || "",
    dafYomiStartDate: row[indexes.dafYomiStartDate] || "",
  }));
}

function loadArchivePosts(postsCsvPath: string): ArchivePostRow[] {
  const [header, ...rows] = parseCsvFile(postsCsvPath);
  const indexes = {
    postId: header.indexOf("post_id"),
    postDate: header.indexOf("post_date"),
    title: header.indexOf("title"),
  };

  return rows.map((row) => ({
    postId: row[indexes.postId] || "",
    postDate: row[indexes.postDate] || "",
    title: row[indexes.title] || "",
  }));
}

function extractPageRangeFromTitle(title: string): string | null {
  const match = title.match(/\(([^()]+)\)\s*$/);
  return match ? match[1].trim() : null;
}

function classifyTextDirection(text: string): "hebrew" | "english" | "neutral" {
  const hebrewCount = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  if (hebrewCount > 0 && hebrewCount >= latinCount) {
    return "hebrew";
  }
  if (latinCount > 0) {
    return "english";
  }
  return "neutral";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(html: string): string {
  const withBlockBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|blockquote|ol|ul|li|h2|h3|h4|div)>/gi, "$&\n")
    .replace(/<(p|blockquote|ol|ul|li|h2|h3|h4|div)(\s[^>]*)?>/gi, "\n$&");

  return decodeHtmlEntities(
    withBlockBreaks
      .replace(/<\/?[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function stripFootnotes(html: string): string {
  return html.replace(/<div class="footnote"[\s\S]*?<\/div>/gi, "");
}

function extractPassageHtml(html: string): string {
  const withoutFootnotes = stripFootnotes(html);
  const passageHeadingIndex = withoutFootnotes.search(/<h2>\s*The Passage\s*<\/h2>/i);

  if (passageHeadingIndex >= 0) {
    return withoutFootnotes.slice(passageHeadingIndex);
  }

  const firstHebrewIndex = withoutFootnotes.search(/[\u0590-\u05FF]/);
  if (firstHebrewIndex >= 0) {
    const previousHeadingIndex = withoutFootnotes.lastIndexOf("<h3", firstHebrewIndex);
    if (previousHeadingIndex >= 0) {
      return withoutFootnotes.slice(previousHeadingIndex);
    }
  }

  return withoutFootnotes;
}

function extractSefariaUrl(html: string): string | null {
  const match = html.match(/<a[^>]+href="(https?:\/\/www\.sefaria\.org(?:\.il)?\/[^"]+)"/i);
  return match ? match[1] : null;
}

function extractSefariaRefFromUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart || null;
}

function findMatchingCloseTag(fragment: string, tagName: string, openIndex: number): number {
  const openTagPattern = new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi");
  const closeTagPattern = new RegExp(`</${tagName}>`, "gi");
  let depth = 1;
  let cursor = openIndex;

  while (depth > 0) {
    openTagPattern.lastIndex = cursor;
    closeTagPattern.lastIndex = cursor;

    const nextOpen = openTagPattern.exec(fragment);
    const nextClose = closeTagPattern.exec(fragment);

    if (!nextClose) {
      return fragment.length;
    }

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
      continue;
    }

    depth -= 1;
    cursor = nextClose.index + nextClose[0].length;
  }

  return cursor;
}

function splitTopLevelBlocks(fragment: string): TopLevelBlock[] {
  const blocks: TopLevelBlock[] = [];
  let cursor = 0;

  while (cursor < fragment.length) {
    const nextTagIndex = fragment.indexOf("<", cursor);
    if (nextTagIndex < 0) {
      break;
    }

    const tagMatch = fragment.slice(nextTagIndex).match(/^<([a-z0-9]+)(\s[^>]*)?>/i);
    if (!tagMatch) {
      cursor = nextTagIndex + 1;
      continue;
    }

    const tagName = tagMatch[1].toLowerCase();
    if (!BLOCK_TAG_NAMES.has(tagName)) {
      cursor = nextTagIndex + tagMatch[0].length;
      continue;
    }

    const endIndex = findMatchingCloseTag(fragment, tagName, nextTagIndex + tagMatch[0].length);
    const html = fragment.slice(nextTagIndex, endIndex);
    blocks.push({ tagName, html });
    cursor = endIndex;
  }

  return blocks;
}

function extractInnerHtml(blockHtml: string, tagName: string): string {
  const openMatch = blockHtml.match(new RegExp(`^<${tagName}(\\s[^>]*)?>`, "i"));
  if (!openMatch) {
    return blockHtml;
  }

  const closeTag = `</${tagName}>`;
  return blockHtml.slice(openMatch[0].length, blockHtml.length - closeTag.length);
}

function splitDirectChildren(innerHtml: string, childTagNames: string[]): TopLevelBlock[] {
  const childSet = new Set(childTagNames);
  return splitTopLevelBlocks(innerHtml).filter((block) => childSet.has(block.tagName));
}

function buildSubunits(
  heading: string | null,
  hebrewHtml: string,
  englishHtml: string,
): BlogpostGoldsetUnit[] {
  const hebrewTag = hebrewHtml.match(/^<([a-z0-9]+)/i)?.[1]?.toLowerCase() || "";
  const englishTag = englishHtml.match(/^<([a-z0-9]+)/i)?.[1]?.toLowerCase() || "";

  if (hebrewTag !== englishTag) {
    return [];
  }

  if (hebrewTag === "blockquote") {
    const hebrewChildren = splitDirectChildren(extractInnerHtml(hebrewHtml, "blockquote"), ["p"]);
    const englishChildren = splitDirectChildren(extractInnerHtml(englishHtml, "blockquote"), ["p"]);
    if (hebrewChildren.length === englishChildren.length && hebrewChildren.length > 1) {
      return hebrewChildren.map((child, index) => ({
        index,
        heading,
        hebrewHtml: child.html,
        englishHtml: englishChildren[index].html,
        hebrewText: stripHtml(child.html),
        englishText: stripHtml(englishChildren[index].html),
        sourceKind: "subblock",
      }));
    }
  }

  if (hebrewTag === "ol" || hebrewTag === "ul") {
    const hebrewChildren = splitDirectChildren(extractInnerHtml(hebrewHtml, hebrewTag), ["li"]);
    const englishChildren = splitDirectChildren(extractInnerHtml(englishHtml, englishTag), ["li"]);
    if (hebrewChildren.length === englishChildren.length && hebrewChildren.length > 0) {
      return hebrewChildren.map((child, index) => ({
        index,
        heading,
        hebrewHtml: child.html,
        englishHtml: englishChildren[index].html,
        hebrewText: stripHtml(child.html),
        englishText: stripHtml(englishChildren[index].html),
        sourceKind: "subblock",
      }));
    }
  }

  return [];
}

function pairPassageBlocks(passageHtml: string): BlogpostGoldsetUnit[] {
  const blocks = splitTopLevelBlocks(passageHtml);
  const units: BlogpostGoldsetUnit[] = [];

  let currentHeading: string | null = null;
  let pendingHebrew: TopLevelBlock[] = [];
  let pendingEnglish: TopLevelBlock[] = [];

  const flushPair = () => {
    if (pendingHebrew.length === 0 || pendingEnglish.length === 0) {
      pendingHebrew = [];
      pendingEnglish = [];
      return;
    }

    const hebrewHtml = pendingHebrew.map((block) => block.html).join("");
    const englishHtml = pendingEnglish.map((block) => block.html).join("");
    const subunits = buildSubunits(currentHeading, hebrewHtml, englishHtml)
      .filter((unit) => unit.hebrewText && unit.englishText);

    if (subunits.length > 0) {
      subunits.forEach((unit) => {
        units.push({ ...unit, index: units.length });
      });
    } else {
      units.push({
        index: units.length,
        heading: currentHeading,
        hebrewHtml,
        englishHtml,
        hebrewText: stripHtml(hebrewHtml),
        englishText: stripHtml(englishHtml),
        sourceKind: "block",
      });
    }

    pendingHebrew = [];
    pendingEnglish = [];
  };

  for (const block of blocks) {
    if (block.tagName === "h2" || block.tagName === "h3" || block.tagName === "h4") {
      flushPair();
      currentHeading = stripHtml(block.html) || currentHeading;
      continue;
    }

    if (block.tagName === "div" && /class="footnote"/i.test(block.html)) {
      continue;
    }

    const text = stripHtml(block.html);
    if (!text) {
      continue;
    }

    const direction = classifyTextDirection(text);
    if (direction === "hebrew") {
      if (pendingEnglish.length > 0) {
        flushPair();
      }
      pendingHebrew.push(block);
      continue;
    }

    if (direction === "english") {
      if (pendingHebrew.length === 0) {
        continue;
      }
      pendingEnglish.push(block);
      continue;
    }

    if (pendingEnglish.length > 0) {
      pendingEnglish.push(block);
    } else if (pendingHebrew.length > 0) {
      pendingHebrew.push(block);
    }
  }

  flushPair();
  return units.filter((unit) => unit.hebrewText && unit.englishText);
}

function buildHtmlPath(archiveRoot: string, postId: string): string {
  const numericPrefix = postId.split(".")[0];
  const postsDir = path.join(archiveRoot, "posts");
  const candidates = fs
    .readdirSync(postsDir)
    .filter((filename) => filename.startsWith(`${numericPrefix}.`) && filename.endsWith(".html"));

  if (candidates.length === 0) {
    throw new Error(`Could not find HTML file for post ${postId}`);
  }

  return path.join(postsDir, candidates[0]);
}

export function buildBlogpostGoldsetDataset(
  options: BlogpostGoldsetBuildOptions,
): BlogpostGoldsetDataset {
  const mappingRows = loadMappingRows(options.mappingCsvPath);
  const postsCsvPath = path.join(options.archiveRoot, "posts.csv");
  const archivePosts = loadArchivePosts(postsCsvPath);

  const mappedPosts = archivePosts
    .map((post) => {
      const pageRange = extractPageRangeFromTitle(post.title);
      if (!pageRange) {
        return null;
      }

      const mappingRow = mappingRows.find((row) => row.pageRange === pageRange);
      if (!mappingRow) {
        return null;
      }

      const htmlPath = buildHtmlPath(options.archiveRoot, post.postId);
      const html = fs.readFileSync(htmlPath, "utf8");
      const passageHtml = extractPassageHtml(html);
      const sefariaUrl = extractSefariaUrl(passageHtml);
      const units = pairPassageBlocks(passageHtml);

      return {
        postId: post.postId,
        postDate: post.postDate,
        title: post.title,
        pageRange,
        baseMappedTitle: mappingRow.blogpostTitle,
        htmlPath,
        sefariaUrl,
        sefariaRef: extractSefariaRefFromUrl(sefariaUrl),
        units,
      } satisfies BlogpostGoldsetPost;
    })
    .filter((post): post is BlogpostGoldsetPost => Boolean(post))
    .sort((a, b) => b.postDate.localeCompare(a.postDate));

  const limitedPosts = typeof options.limit === "number"
    ? mappedPosts.slice(0, options.limit)
    : mappedPosts;

  return {
    generatedAt: new Date().toISOString(),
    archiveRoot: options.archiveRoot,
    mappingCsvPath: options.mappingCsvPath,
    posts: limitedPosts,
  };
}

export function writeBlogpostGoldsetDataset(
  outputPath: string,
  options: BlogpostGoldsetBuildOptions,
): BlogpostGoldsetDataset {
  const dataset = buildBlogpostGoldsetDataset(options);
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  return dataset;
}

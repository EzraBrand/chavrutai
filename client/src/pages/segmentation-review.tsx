import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { removeNikud } from "@/lib/text-processing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ExternalLink, FileJson, Upload } from "lucide-react";

type SourceMode = "goldset" | "eval" | "upload";

type GoldsetDataset = {
  generatedAt: string;
  posts: Array<{
    postId: string;
    postDate: string;
    title: string;
    pageRange: string;
    baseMappedTitle: string;
    htmlPath: string;
    sefariaUrl: string | null;
    sefariaRef: string | null;
    units: Array<{
      index: number;
      heading: string | null;
      hebrewHtml: string;
      englishHtml: string;
      hebrewText: string;
      englishText: string;
      sourceKind: "block" | "subblock";
    }>;
  }>;
};

type EvalDataset = {
  generatedAt: string;
  postCount: number;
  exampleCount: number;
  examples: Array<{
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
  }>;
};

type SegmentationSection = {
  ref: string;
  sectionIndex: number;
  status: string;
  strategy: string;
  version: string;
  normalizedHebrew: string;
  normalizedEnglish: string;
  englishAnchors: Array<{ index: number; text: string; startChar: number; endChar: number }>;
  hebrewCandidates: Array<{ index: number; text: string; reason: string }>;
  englishCandidates: Array<{ index: number; text: string; reason: string }>;
  alignedSegments: Array<{ index: number; hebrew: string; english: string; confidence?: number | null }>;
  confidence?: number | null;
  notes?: string[];
};

type ReviewRecord = {
  id: string;
  groupId: string;
  groupLabel: string;
  title: string;
  subtitle: string;
  heading: string | null;
  sourceKind: string;
  postDate?: string;
  htmlPath?: string;
  sefariaUrl?: string | null;
  sefariaRef?: string | null;
  pageRange?: string;
  hebrewText: string;
  englishText: string;
  hebrewHtml?: string;
  englishHtml?: string;
  segments: Array<{ index: number; hebrew: string; english: string; confidence?: number | null }>;
  notes: string[];
  englishAnchors?: SegmentationSection["englishAnchors"];
  hebrewCandidates?: SegmentationSection["hebrewCandidates"];
  englishCandidates?: SegmentationSection["englishCandidates"];
  strategy?: string;
  status?: string;
  version?: string;
};

type RawSefariaResponse = {
  ref: string;
  tractate: string;
  page: string;
  url: string;
  hebrewSections: string[];
  englishSections: string[];
  sectionRefs?: string[];
  matchedSectionIndex?: number | null;
  matchedSectionNumber?: number | null;
  matchedSectionRef?: string | null;
  matchStrategy?: string | null;
  matchConfidence?: number | null;
  matchStartChar?: number | null;
  matchEndChar?: number | null;
};

function summarizeText(text: string, maxLength = 90): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function htmlToReadableText(html: string | undefined, fallback: string): string {
  if (!html || typeof window === "undefined") {
    return fallback;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) {
    return fallback;
  }

  const lines: string[] = [];

  const readNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (!(node instanceof HTMLElement)) {
      return "";
    }

    if (node.tagName === "BR") {
      return "\n";
    }

    if (node.tagName === "LI") {
      const text = Array.from(node.childNodes).map(readNode).join(" ").replace(/\s+/g, " ").trim();
      return text ? `• ${text}` : "";
    }

    const text = Array.from(node.childNodes).map(readNode).join(" ");
    return text.replace(/\s+/g, " ").trim();
  };

  Array.from(root.childNodes).forEach((node) => {
    const text = readNode(node).trim();
    if (text) {
      lines.push(text);
    }
  });

  return lines.length > 0 ? lines.join("\n\n") : fallback;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function normalizeRawHebrewForReview(text: string): string {
  return removeNikud(text)
    .replace(/[^\u05D0-\u05EA\u05BE\u05F3\u05F4\s.,;:!?'"()\-[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGoldsetDataset(dataset: GoldsetDataset): ReviewRecord[] {
  return dataset.posts.flatMap((post) =>
    post.units.map((unit) => ({
      id: `${post.postId}::${unit.index}`,
      groupId: post.postId,
      groupLabel: `${post.pageRange} · ${post.title}`,
      title: `${post.pageRange} · ${unit.heading || `Unit ${unit.index + 1}`}`,
      subtitle: post.baseMappedTitle,
      heading: unit.heading,
      sourceKind: unit.sourceKind,
      postDate: post.postDate,
      htmlPath: unit.index === 0 ? post.htmlPath : post.htmlPath,
      sefariaUrl: post.sefariaUrl,
      sefariaRef: post.sefariaRef,
      pageRange: post.pageRange,
      hebrewText: unit.hebrewText,
      englishText: unit.englishText,
      hebrewHtml: unit.hebrewHtml,
      englishHtml: unit.englishHtml,
      segments: [{ index: 0, hebrew: unit.hebrewText, english: unit.englishText }],
      notes: [],
    })),
  );
}

function normalizeEvalDataset(dataset: EvalDataset): ReviewRecord[] {
  return dataset.examples.map((example) => ({
    id: example.exampleId,
    groupId: example.postId,
    groupLabel: `${example.pageRange} · ${example.postTitle}`,
    title: example.ref,
    subtitle: example.postTitle,
    heading: example.heading,
    sourceKind: example.sourceKind,
    postDate: example.postDate,
    htmlPath: example.htmlPath,
    sefariaUrl: example.sefariaUrl,
    sefariaRef: example.sefariaRef,
    pageRange: example.pageRange,
    hebrewText: example.hebrew,
    englishText: example.english,
    hebrewHtml: example.hebrewHtml,
    englishHtml: example.englishHtml,
    segments: [{ index: 0, hebrew: example.hebrew, english: example.english }],
    notes: [],
  }));
}

function normalizeSegmentationSections(sections: SegmentationSection[]): ReviewRecord[] {
  return sections.map((section) => ({
    id: `${section.ref}::${section.sectionIndex}`,
    groupId: section.ref.split(":")[0] || section.ref,
    groupLabel: section.ref.split(":")[0] || section.ref,
    title: section.ref,
    subtitle: `${section.strategy} · ${section.status}`,
    heading: null,
    sourceKind: "segmentation",
    pageRange: section.ref,
    sefariaUrl: null,
    sefariaRef: section.ref,
    hebrewText: section.normalizedHebrew,
    englishText: section.normalizedEnglish,
    segments: section.alignedSegments,
    notes: section.notes || [],
    englishAnchors: section.englishAnchors,
    hebrewCandidates: section.hebrewCandidates,
    englishCandidates: section.englishCandidates,
    strategy: section.strategy,
    status: section.status,
    version: section.version,
  }));
}

function normalizeUnknownDataset(data: unknown): ReviewRecord[] {
  if (!data || typeof data !== "object") return [];
  const maybeGoldset = data as Partial<GoldsetDataset>;
  if (Array.isArray(maybeGoldset.posts)) return normalizeGoldsetDataset(maybeGoldset as GoldsetDataset);
  const maybeEval = data as Partial<EvalDataset>;
  if (Array.isArray(maybeEval.examples)) return normalizeEvalDataset(maybeEval as EvalDataset);
  if (Array.isArray(data) && data.every((item) => item && typeof item === "object" && "ref" in item)) {
    return normalizeSegmentationSections(data as SegmentationSection[]);
  }
  const wrapped = data as { sectionSegmentations?: SegmentationSection[] };
  if (Array.isArray(wrapped.sectionSegmentations)) return normalizeSegmentationSections(wrapped.sectionSegmentations);
  return [];
}

function buildGroupOptions(records: ReviewRecord[]) {
  const groups = new Map<string, { id: string; label: string; count: number }>();
  records.forEach((record) => {
    const existing = groups.get(record.groupId);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(record.groupId, { id: record.groupId, label: record.groupLabel, count: 1 });
    }
  });
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function DetailHtml({ html }: { html?: string }) {
  if (!html) return null;
  const cleanedHtml = html.replace(/<a[^>]*class="footnote-anchor"[^>]*>[\s\S]*?<\/a>/gi, "");
  return (
    <div
      className="space-y-3 text-sm leading-7 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: cleanedHtml }}
    />
  );
}

export default function SegmentationReviewPage() {
  useSEO({
    title: "Segmentation Review | ChavrutAI",
    description: "Local QA page for reviewing gold-set segmentation and future Talmud segmentation outputs.",
    canonical: `${window.location.origin}/segmentation-review`,
    robots: "noindex, nofollow",
  });

  const [sourceMode, setSourceMode] = useState<SourceMode>("goldset");
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [uploadedRecords, setUploadedRecords] = useState<ReviewRecord[]>([]);
  const [uploadError, setUploadError] = useState("");

  const goldsetQuery = useQuery<GoldsetDataset>({ queryKey: ["/api/segmentation-review/goldset"] });
  const evalQuery = useQuery<EvalDataset>({ queryKey: ["/api/segmentation-review/eval"] });

  const currentRecords = useMemo(() => {
    if (sourceMode === "upload") return uploadedRecords;
    if (sourceMode === "eval") return evalQuery.data ? normalizeEvalDataset(evalQuery.data) : [];
    return goldsetQuery.data ? normalizeGoldsetDataset(goldsetQuery.data) : [];
  }, [sourceMode, uploadedRecords, evalQuery.data, goldsetQuery.data]);

  const groups = useMemo(() => buildGroupOptions(currentRecords), [currentRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return currentRecords.filter((record) => {
      if (selectedGroupId !== "all" && record.groupId !== selectedGroupId) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        record.title,
        record.subtitle,
        record.heading || "",
        record.pageRange || "",
        record.hebrewText,
        record.englishText,
      ].join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [currentRecords, search, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId !== "all" && !groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId("all");
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setSelectedRecordId(null);
      return;
    }
    if (!filteredRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedIndex = filteredRecords.findIndex((record) => record.id === selectedRecordId);
  const selectedRecord = selectedIndex >= 0 ? filteredRecords[selectedIndex] : null;
  const rawSefariaQuery = useQuery<RawSefariaResponse>({
    queryKey: [
      "/api/sefaria-raw",
      selectedRecord?.sefariaUrl || "",
      selectedRecord?.hebrewText || "",
      selectedRecord?.englishText || "",
    ],
    enabled: Boolean(selectedRecord?.sefariaUrl),
    queryFn: async () => {
      const params = new URLSearchParams({
        url: selectedRecord?.sefariaUrl || "",
        hebrew: selectedRecord?.hebrewText || "",
        english: selectedRecord?.englishText || "",
      });
      const response = await fetch(`/api/sefaria-raw?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Could not load raw Sefaria data.");
      }
      return response.json();
    },
  });

  const localError = sourceMode === "goldset"
    ? goldsetQuery.error
    : sourceMode === "eval"
      ? evalQuery.error
      : null;

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const records = normalizeUnknownDataset(parsed);
      if (records.length === 0) {
        setUploadError("Uploaded JSON did not match the supported gold-set, eval, or segmentation formats.");
        setUploadedRecords([]);
      } else {
        setUploadError("");
        setUploadedRecords(records);
      }
      setUploadedName(file.name);
      setSourceMode("upload");
      setSelectedGroupId("all");
    } catch (error) {
      setUploadedName(file.name);
      setUploadedRecords([]);
      setUploadError(error instanceof Error ? error.message : "Failed to read uploaded JSON.");
      setSourceMode("upload");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
              <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-10 h-10 object-cover" />
            </div>
            <div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
              <div className="text-xs text-muted-foreground">Segmentation Review</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileJson className="h-4 w-4" />
            <span>Gold set QA and future segmentation review</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Review Source</CardTitle>
              <CardDescription>Load the local datasets or upload a future segmentation JSON file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="source-mode">Dataset</Label>
                  <Select value={sourceMode} onValueChange={(value) => setSourceMode(value as SourceMode)}>
                    <SelectTrigger id="source-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goldset">Local Gold Set</SelectItem>
                      <SelectItem value="eval">Local Eval Set</SelectItem>
                      <SelectItem value="upload">Uploaded JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-json">Upload JSON</Label>
                  <div className="flex items-center gap-3">
                    <Input id="upload-json" type="file" accept=".json,application/json" onChange={handleUpload} />
                    <Button type="button" variant="outline" onClick={() => setSourceMode("upload")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Review Upload
                    </Button>
                  </div>
                  {uploadedName ? <p className="text-xs text-muted-foreground">Latest upload: {uploadedName}</p> : null}
                </div>
              </div>

              {localError ? (
                <Alert variant="destructive">
                  <AlertDescription>{localError instanceof Error ? localError.message : "Could not load the local dataset."}</AlertDescription>
                </Alert>
              ) : null}

              {uploadError ? (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dataset Summary</CardTitle>
              <CardDescription>Quick counts for the active source.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Records</div>
                <div className="text-2xl font-semibold">{currentRecords.length}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Groups</div>
                <div className="text-2xl font-semibold">{groups.length}</div>
              </div>
              <div className="rounded-lg border border-border p-3 col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Filtered</div>
                <div className="text-2xl font-semibold">{filteredRecords.length}</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <Card className="h-[calc(100vh-16rem)]">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Record List</CardTitle>
                <CardDescription>Filter by group and search across Hebrew, English, and metadata.</CardDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-filter">Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger id="group-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.label} ({group.count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="record-search">Search</Label>
                <Input
                  id="record-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search page, heading, Hebrew, English..."
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 h-[calc(100%-13rem)]">
              <ScrollArea className="h-full pr-3">
                <div className="space-y-2">
                  {filteredRecords.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        selectedRecordId === record.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{record.title}</div>
                        <Badge variant="outline">{record.sourceKind}</Badge>
                      </div>
                      {record.heading ? <div className="text-xs text-muted-foreground mt-1">{record.heading}</div> : null}
                      <div className="text-xs text-muted-foreground mt-2">
                        {summarizeText(htmlToReadableText(record.englishHtml, record.englishText || record.hebrewText))}
                      </div>
                    </button>
                  ))}
                  {filteredRecords.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8">No records matched the current filters.</div>
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedRecord ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <CardTitle>{selectedRecord.title}</CardTitle>
                        <CardDescription>{selectedRecord.subtitle}</CardDescription>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.pageRange ? <Badge variant="secondary">{selectedRecord.pageRange}</Badge> : null}
                          {selectedRecord.postDate ? <Badge variant="outline">{formatDate(selectedRecord.postDate)}</Badge> : null}
                          {selectedRecord.status ? <Badge variant="outline">{selectedRecord.status}</Badge> : null}
                          {selectedRecord.strategy ? <Badge variant="outline">{selectedRecord.strategy}</Badge> : null}
                          {selectedRecord.version ? <Badge variant="outline">{selectedRecord.version}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={selectedIndex <= 0} onClick={() => selectedIndex > 0 && setSelectedRecordId(filteredRecords[selectedIndex - 1].id)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={selectedIndex < 0 || selectedIndex >= filteredRecords.length - 1} onClick={() => selectedIndex >= 0 && selectedIndex < filteredRecords.length - 1 && setSelectedRecordId(filteredRecords[selectedIndex + 1].id)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecord.htmlPath ? (
                      <div className="text-xs text-muted-foreground break-all flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        {selectedRecord.htmlPath}
                      </div>
                    ) : null}
                    {selectedRecord.sefariaUrl ? (
                      <a
                        href={selectedRecord.sefariaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary break-all flex items-center gap-2 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {selectedRecord.sefariaRef || selectedRecord.sefariaUrl}
                      </a>
                    ) : null}
                    {selectedRecord.notes.length > 0 ? (
                      <Alert><AlertDescription>{selectedRecord.notes.join(" ")}</AlertDescription></Alert>
                    ) : null}
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle className="text-base">English</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <DetailHtml html={selectedRecord.englishHtml} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-base">Hebrew</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <DetailHtml html={selectedRecord.hebrewHtml} />
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Derived English text</div>
                        <div className="rounded-md bg-muted/40 p-3 text-sm leading-7 whitespace-pre-wrap">
                          {htmlToReadableText(selectedRecord.englishHtml, selectedRecord.englishText)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Derived Hebrew text</div>
                        <div dir="rtl" className="rounded-md bg-muted/40 p-3 text-sm leading-8 whitespace-pre-wrap">
                          {htmlToReadableText(selectedRecord.hebrewHtml, selectedRecord.hebrewText)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Segments</CardTitle>
                    <CardDescription>Review the aligned segment units for this record.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedRecord.segments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedRecord.segments.map((segment) => (
                          <div key={segment.index} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">Segment {segment.index + 1}</Badge>
                              {segment.confidence !== undefined && segment.confidence !== null ? (
                                <Badge variant="secondary">confidence {segment.confidence}</Badge>
                              ) : null}
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-md bg-muted/40 p-3 text-base leading-8">
                                {segment.english}
                              </div>
                              <div dir="rtl" className="rounded-md bg-muted/40 p-3 text-lg leading-9">
                                {segment.hebrew}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No aligned segments are present in this record yet.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Raw Sefaria Source</CardTitle>
                    <CardDescription>
                      Raw source text fetched directly from Sefaria and narrowed to the closest matching section when possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecord.sefariaUrl ? (
                      rawSefariaQuery.isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading raw Sefaria data…</div>
                      ) : rawSefariaQuery.error ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {rawSefariaQuery.error instanceof Error
                              ? rawSefariaQuery.error.message
                              : "Could not load raw Sefaria data."}
                          </AlertDescription>
                        </Alert>
                      ) : rawSefariaQuery.data ? (
                        <div className="space-y-4">
                          {rawSefariaQuery.data.matchedSectionRef ? (
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{rawSefariaQuery.data.matchedSectionRef}</Badge>
                              {rawSefariaQuery.data.matchStrategy ? (
                                <Badge variant="outline">{rawSefariaQuery.data.matchStrategy}</Badge>
                              ) : null}
                              {rawSefariaQuery.data.matchConfidence !== null && rawSefariaQuery.data.matchConfidence !== undefined ? (
                                <Badge variant="outline">match {rawSefariaQuery.data.matchConfidence}</Badge>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="grid gap-4 lg:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Raw English sections</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {rawSefariaQuery.data.englishSections.map((section, index) => (
                                  <div key={`raw-en-${index}`} className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {rawSefariaQuery.data.sectionRefs?.[index] || `Section ${index + 1}`}
                                    </div>
                                    <div
                                      className="text-base leading-8 [&_b]:font-semibold [&_i]:italic"
                                      dangerouslySetInnerHTML={{ __html: section }}
                                    />
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Raw Hebrew sections</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {rawSefariaQuery.data.hebrewSections.map((section, index) => (
                                  <div key={`raw-he-${index}`} className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {rawSefariaQuery.data.sectionRefs?.[index] || `Section ${index + 1}`}
                                    </div>
                                    <div dir="rtl" className="text-base leading-8 whitespace-pre-wrap">
                                      {normalizeRawHebrewForReview(section)}
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No raw Sefaria data available.</div>
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        This record does not currently have a Sefaria source reference.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(selectedRecord.englishAnchors || selectedRecord.hebrewCandidates || selectedRecord.englishCandidates) ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Segmentation Signals</CardTitle>
                      <CardDescription>Anchor spans and candidate boundaries for QA on future segmentation runs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {selectedRecord.englishAnchors && selectedRecord.englishAnchors.length > 0 ? (
                        <div className="space-y-2">
                          <h3 className="font-medium">English anchors</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Text</TableHead>
                                <TableHead>Range</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRecord.englishAnchors.map((anchor) => (
                                <TableRow key={anchor.index}>
                                  <TableCell>{anchor.index + 1}</TableCell>
                                  <TableCell>{anchor.text}</TableCell>
                                  <TableCell>{anchor.startChar}–{anchor.endChar}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : null}

                      {selectedRecord.hebrewCandidates && selectedRecord.hebrewCandidates.length > 0 ? (
                        <div className="space-y-2">
                          <h3 className="font-medium">Hebrew candidates</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Text</TableHead>
                                <TableHead>Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRecord.hebrewCandidates.map((candidate) => (
                                <TableRow key={candidate.index}>
                                  <TableCell>{candidate.index + 1}</TableCell>
                                  <TableCell dir="rtl">{candidate.text}</TableCell>
                                  <TableCell>{candidate.reason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : null}

                      {selectedRecord.englishCandidates && selectedRecord.englishCandidates.length > 0 ? (
                        <div className="space-y-2">
                          <h3 className="font-medium">English candidates</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Text</TableHead>
                                <TableHead>Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRecord.englishCandidates.map((candidate) => (
                                <TableRow key={candidate.index}>
                                  <TableCell>{candidate.index + 1}</TableCell>
                                  <TableCell>{candidate.text}</TableCell>
                                  <TableCell>{candidate.reason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No record selected</CardTitle>
                  <CardDescription>Load a dataset or choose a record from the list to start reviewing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>If the local files are missing, regenerate them with:</p>
                  <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs">{`.\\.tools\\node-v24.13.1-win-x64\\npx.cmd tsx server/generate-blogpost-goldset.ts`}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

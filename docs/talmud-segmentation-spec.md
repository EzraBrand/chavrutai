# Talmud Segmentation Spec

## Goal

Add a section-local segmentation pipeline for Bavli text that improves over the current punctuation-based formatting without replacing it. The system should:

- Preserve the existing `processHebrewTextCore()` / `processEnglishText()` behavior.
- Build segmentation metadata per Sefaria section.
- Use Steinsaltz English formatting, especially bold spans, as a primary alignment signal.
- Support an eventual LLM boundary-selection stage with deterministic validation and caching.

Initial scope is aggadic sugyot.

## Current Fit in ChavrutAI

Existing flow:

1. `GET /api/text` fetches a page from Sefaria.
2. The page is split into section arrays (`he`, `text`).
3. Each section is processed by `shared/text-processing.ts`.
4. Processed text is stored in `texts`.

New additive flow:

1. Keep the existing processed text pipeline unchanged.
2. For each raw Sefaria section, generate a segmentation scaffold.
3. Store scaffold output in `texts.sectionSegmentations`.
4. Expose the same metadata from API responses for offline analysis and future UI use.

## Design Principles

- Section-local only. No segmentation across Sefaria sections.
- Boundary selection, not paraphrase. The model should choose boundaries on the original text, not rewrite text.
- Monotonic bilingual alignment. Segment order must stay fixed.
- Deterministic fallback. If LLM output is missing or invalid, rules-based candidates remain available.
- HTML-aware English parsing. Bold spans are semantic translation anchors and must be preserved as signals.

## Data Model

Added in `shared/schema.ts`:

- `TalmudEnglishAnchor`
  - Extracted bold English span.
  - Includes plain text plus normalized character offsets.
- `TalmudBoundaryCandidate`
  - Candidate segment span from the rules layer.
  - Includes text, offsets, and split reason.
- `TalmudAlignedSegment`
  - Final aligned Hebrew/English segment pair.
  - Includes candidate provenance and optional confidence.
- `TalmudSectionSegmentation`
  - Section-level container with status, strategy, normalized text, anchors, candidates, aligned segments, confidence, and notes.

Database addition:

- `texts.section_segmentations` as optional JSON.

Client type addition:

- `TalmudText.sectionSegmentations?: TalmudSectionSegmentation[] | null`

## Server Scaffold

Implemented in `server/lib/talmud-segmentation.ts`.

### Stage 1: Normalization

- Hebrew:
  - Strip HTML.
  - Remove nikud.
  - Normalize whitespace.
- English:
  - Convert HTML to plain text.
  - Preserve semantic signal separately via extracted bold anchors.
  - Normalize whitespace.

### Stage 2: Rules-Based Candidate Generation

- English candidates:
  - Split on terminal punctuation.
  - Split on some commas that plausibly begin new clauses.
  - Add candidate boundaries at bold anchor starts and ends.
- Hebrew candidates:
  - Split on punctuation already common in the existing pipeline.

Output at this stage is intentionally conservative and may over-generate.

### Stage 3: LLM Boundary Selection

Not implemented yet, but the scaffold exposes `buildTalmudSegmentationPromptPayload()` for this next step.

Expected LLM task:

1. Receive normalized Hebrew text, normalized English text, bold anchors, and candidate spans.
2. Select a monotonic sequence of aligned segments.
3. Return only structured segment indexes plus optional confidence/notes.

Recommended model behavior:

- Prefer grouping over splitting when uncertain.
- Preserve bold-alignment evidence.
- Avoid producing segments that strand explanatory English glue without a nearby translated anchor.

### Stage 4: Deterministic Validation

Current scaffold validates schema shape.

Next validator should enforce:

- Segment order is monotonic.
- Candidate indexes are valid.
- Reconstructed text does not drop content unexpectedly.
- Section boundaries are never crossed.
- Empty aligned segments are rejected.

## API and Storage Behavior

Current scaffold is wired into:

- `GET /api/text`
- `GET /api/sefaria-fetch`

Behavior:

- Existing processed section text is unchanged.
- Raw sections are used only to build segmentation metadata.
- Stored/cached texts can now carry `sectionSegmentations`.

## Rollout Plan

### Phase 0

- Completed in this scaffold.
- Add schema, storage field, deterministic candidate extraction, and API exposure.

### Phase 1

- Build an offline evaluation script over a curated aggadic dataset.
- Hand-label 100-300 sections.
- Compare:
  - current punctuation baseline
  - rules scaffold candidates
  - LLM-selected segments

Gold-set source:

- Use the archived blogpost HTML corpus in `Downloads`, where the Talmud passages have already been manually segmented into paired Hebrew and English units.
- Use the main mapping table `talmud-blogpost-dafyomi-grid/blogpost_dafyomi_db.csv` to identify relevant Talmud posts and prioritize the newest entries.
- Prefer recent posts first, since they most directly reflect the current segmentation style and editorial choices.
- Treat each post's "The Passage" section as labeled alignment data and keep metadata for `page range`, post title, archive HTML path, and publication date.
- The first extractor scaffold lives in `server/lib/blogpost-goldset.ts`.
- The eval-dataset converter lives in `server/lib/blogpost-goldset-eval.ts`.
- The tracked runner entrypoint is `server/generate-blogpost-goldset.ts`.
- Match archive posts to mapping rows by the `page range` embedded in the post title, not by exact title string, since archive titles often include `Pt1` / `Pt2` / `Pt3` prefixes while the mapping CSV uses a base topic title.

Suggested metrics:

- Boundary precision / recall / F1
- Exact segment-match rate
- Anchor coverage rate
- Invalid-output rate

### Phase 2

- Add LLM segmentation runner behind a feature flag or offline job.
- Cache by:
  - `sefariaRef`
  - `sectionIndex`
  - `segmentationVersion`
  - `model`

### Phase 3

- Surface aligned segments in a study UI or developer-only inspection view.
- Keep the current paragraph-splitting display as the default fallback.

## Risks

- Bold spans are helpful but not perfect; some commentary sits between translated fragments.
- English punctuation and Hebrew punctuation are not reliably isomorphic.
- Aggadic sections are easier than dense legal argument; halakhic sugyot will need stricter validation and probably different prompting.
- Character offsets are based on normalized text, so any future UI using raw HTML positions will need a mapping layer.

## Immediate Next Step

Implement the LLM boundary-selection stage as an offline service that consumes `TalmudSegmentationPromptPayload`, returns structured aligned segments, and writes validated results back into `sectionSegmentations`.

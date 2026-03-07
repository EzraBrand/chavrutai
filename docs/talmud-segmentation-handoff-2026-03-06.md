# Talmud Segmentation Handoff

Date: 2026-03-07

## Scope

This document summarizes the current state of the Talmud segmentation work in `chavrutai`, including what was completed, what was verified locally, the environment constraints that matter for resuming work, and the most important next implementation steps.

## Branch / Repo State

- Main working branch: `feature/talmud-segmentation`
- PR `#122` was retargeted from `main` to `feature/talmud-segmentation` and merged on 2026-03-07.
- Subsequent follow-up work was pushed directly to `feature/talmud-segmentation`.
- Latest known branch head at handoff time: `c68cabbdcf4c81226e7daab877f86454333b60b0`

## Work Completed

### 1. Segmentation scaffold

Implemented the initial section-local segmentation scaffold.

Files:

- `shared/schema.ts`
- `client/src/types/talmud.ts`
- `server/lib/talmud-segmentation.ts`
- `server/routes.ts`
- `server/storage.ts`

What exists:

- shared schemas for anchors, candidate boundaries, aligned segments, and section-level segmentation
- deterministic normalization of Hebrew and English section text
- English bold-anchor extraction from Sefaria HTML
- rules-based candidate generation for both languages
- prompt-payload shape for future LLM selection
- route/storage wiring so segmentation metadata can travel with fetched text

### 2. Technical spec

Created the segmentation design spec.

File:

- `docs/talmud-segmentation-spec.md`

The spec describes:

- section-local processing
- deterministic preprocessing before any LLM step
- use of English bold spans as alignment anchors
- deterministic validation expectations
- offline evaluation before production rollout

### 3. Gold-set extraction from blogposts

Built the gold-set extraction pipeline from the archived blogpost corpus.

Files:

- `server/lib/blogpost-goldset.ts`
- `server/lib/blogpost-goldset-eval.ts`
- `server/generate-blogpost-goldset.ts`

What it now does:

- loads the mapping CSV and archive metadata
- matches blogposts by daf/page range
- extracts the blogpost passage HTML blocks
- pairs Hebrew and English units
- preserves raw HTML and normalized plain text
- enriches each extracted unit with stored section-level `sourceProvenance`
- emits:
  - `tmp/blogpost-goldset/blogpost-goldset.json`
  - `tmp/blogpost-goldset/blogpost-segmentation-eval.json`

### 4. Review / QA page

Built and refined the local review UI at `/segmentation-review`.

Files:

- `client/src/pages/segmentation-review.tsx`
- `client/src/App.tsx`
- `server/routes.ts`

What it now supports:

- loading local gold-set JSON
- loading local eval JSON
- loading uploaded future segmentation JSON
- filtering/searching records
- structured side-by-side English/Hebrew rendering
- derived text/debug rendering
- exact section-ref badges from stored provenance
- raw Sefaria fetch narrowed to the closest section

### 5. Raw Sefaria source integration

Added a backend route and UI support for fetching raw Sefaria source text for review.

Files:

- `server/routes.ts`
- `server/lib/talmud-source-provenance.ts`
- `server/lib/talmud-sefaria-source.ts`
- `client/src/pages/segmentation-review.tsx`

What it now does:

- accepts a Sefaria URL/ref
- fetches raw Hebrew and English sections from Sefaria
- strips nikud from displayed raw Hebrew in the review UI
- narrows the fetch to a stored exact section when provenance is available
- otherwise falls back to heuristic section matching

### 6. Offline scorer

Built the first offline scorer over the eval set.

Files:

- `server/lib/blogpost-segmentation-scorer.ts`
- `server/evaluate-blogpost-segmentation.ts`
- `tests/blogpost-segmentation-scorer.test.ts`

What it currently does:

- groups eval examples by exact `sourceProvenance.sectionRef`
- fetches each unique source section from Sefaria
- builds the current rules-based scaffold for that section
- scores baseline candidate coverage and boundary metrics
- writes:
  - `tmp/blogpost-goldset/blogpost-segmentation-score.json`

## Environment / Operational Notes

### 1. Windows / PowerShell / portable Node

Important facts:

- This repo is being run on Windows / PowerShell.
- Portable Node lives in `.tools/node-v24.13.1-win-x64/`.
- `npm`, `npx`, and `node` may not be on `PATH` by default.
- `npm run dev` is not a reliable default path because the repo's `dev` script is Unix-style.

Verified working local launch sequence:

1. `Set-Location "C:\Users\ezrab\Ezra Brandt\chavrutai"`
2. `$env:PATH = ".\.tools\node-v24.13.1-win-x64;" + $env:PATH`
3. `$env:NODE_ENV = "development"`
4. `$env:OPENAI_API_KEY = "dummy-local-key"` (or a real key)
5. `$env:HOST = "127.0.0.1"`
6. `$env:PORT = "5000"`
7. `$env:REUSE_PORT = "false"`
8. `.\.tools\node-v24.13.1-win-x64\node.exe .\node_modules\tsx\dist\cli.mjs server\index.ts`

Related files:

- `AGENTS.md`
- `.vscode/tasks.json`
- `package.json`

### 2. OpenAI startup quirk

Important fact:

- `server/routes.ts` instantiates `OpenAI` during startup.
- The server will not boot at all unless `OPENAI_API_KEY` is set, even for non-chat pages.
- For local non-LLM UI work, a dummy value is enough.

### 3. Asset locations moved out of Downloads

The relevant local assets are now under `C:\Users\ezrab\Ezra Brandt\...`, not `Downloads`.

Verified current paths:

- archive root:
  - `C:\Users\ezrab\Ezra Brandt\blogpost_archive_tmp2`
- mapping CSV:
  - `C:\Users\ezrab\Ezra Brandt\talmud-blogpost-dafyomi-grid\blogpost_dafyomi_db.csv`

When regenerating local artifacts, set:

- `BLOGPOST_ARCHIVE_ROOT`
- `BLOGPOST_MAPPING_CSV`

accordingly.

### 4. TypeScript noise outside this work

There are still unrelated repo-level TypeScript failures that block a clean full-project typecheck.

Known unrelated problem files:

- `client/src/hooks/use-seo.ts`
- `client/src/lib/html-sanitizer.ts`

No new known typecheck failures from the Talmud segmentation work remained at handoff time.

## Current Status

### What is working

- Segmentation schema/scaffold exists.
- Gold-set extraction exists.
- Gold-set and eval artifacts now include stored section-level provenance.
- A local QA page exists at `/segmentation-review`.
- Review-page layout is flipped to English left / Hebrew right.
- Top Hebrew rendering is RTL.
- Raw Sefaria fetch now works in the review page and can use stored exact provenance.
- An offline rules-based scorer exists and produces a JSON report.
- Focused extraction / provenance / segmentation tests are in place.

### What is still incomplete

- No actual LLM boundary-selection runner exists yet.
- No deterministic validator yet consumes LLM-selected aligned segments.
- No comparison report yet exists between rules-only and LLM-selected output.
- The review page still lacks annotation controls and a full three-way comparison workflow.

## Actual Baseline Metrics

The scorer was run locally against the current eval set and produced:

- sections scored: `33`
- examples scored: `433`
- average gold segments per section: `5.79`
- exact candidate-count match rate: `0`
- Hebrew coverage: `0.508`
- English coverage: `0.195`
- bilingual coverage: `0.119`
- Hebrew boundary F1: `0.0019`
- English boundary F1: `0`

Interpretation:

- the current deterministic rules layer is useful as a candidate generator
- it is not close to acceptable as a final segmenter
- the strongest next milestone is the offline LLM boundary-selection stage, scored against the same eval set

## Relevant Files

Core implementation:

- `shared/schema.ts`
- `client/src/types/talmud.ts`
- `client/src/pages/segmentation-review.tsx`
- `server/lib/talmud-segmentation.ts`
- `server/lib/talmud-source-provenance.ts`
- `server/lib/talmud-sefaria-source.ts`
- `server/lib/blogpost-goldset.ts`
- `server/lib/blogpost-goldset-eval.ts`
- `server/lib/blogpost-segmentation-scorer.ts`
- `server/generate-blogpost-goldset.ts`
- `server/evaluate-blogpost-segmentation.ts`
- `server/routes.ts`
- `server/storage.ts`

Documentation / operating notes:

- `docs/talmud-segmentation-spec.md`
- `docs/talmud-segmentation-handoff-2026-03-06.md`
- `AGENTS.md`

Generated local artifacts:

- `tmp/blogpost-goldset/blogpost-goldset.json`
- `tmp/blogpost-goldset/blogpost-segmentation-eval.json`
- `tmp/blogpost-goldset/blogpost-segmentation-score.json`

## Best Next Step

Implement the offline LLM boundary-selection runner.

Concretely:

1. consume `TalmudSegmentationPromptPayload`
2. call the selected LLM offline over section-local inputs
3. return structured aligned segment indexes only
4. validate those indexes deterministically
5. write the validated aligned segments back into section-level segmentation artifacts
6. score that output against `blogpost-segmentation-eval.json`
7. compare it directly to the current rules baseline

## Notes for the Next Agent

- Do not start by re-solving the review UI issues; the English/Hebrew layout, RTL top Hebrew rendering, and raw-source narrowing are already working.
- Do not assume the local assets are still in `Downloads`; use the moved `C:\Users\ezrab\Ezra Brandt\...` paths or read the relevant env vars.
- The generated JSON in `tmp/` is local and gitignored; code changes were pushed, but regenerated artifacts are not committed.
- If continuing with the scorer or LLM runner, prefer keeping the same evaluation/report path under `tmp/blogpost-goldset/`.

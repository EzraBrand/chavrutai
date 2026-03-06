# Talmud Segmentation Handoff

Date: 2026-03-06

## Scope

This document summarizes the work completed so far on the Talmud segmentation effort in `chavrutai`, the main implementation decisions, the challenges encountered, the current state of the codebase, and the next work needed.

## Work Completed

### 1. Segmentation scaffold

Implemented an initial server-side scaffold for Talmud segmentation focused on section-local processing.

Files:

- `shared/schema.ts`
- `client/src/types/talmud.ts`
- `server/lib/talmud-segmentation.ts`
- `server/routes.ts`
- `server/storage.ts`

What was added:

- Shared schemas for Talmud segmentation data, including aligned segments, anchors, boundary candidates, and per-section segmentation payloads.
- Server-side helpers to:
  - normalize Hebrew and English section text
  - extract bold English anchors from Sefaria HTML
  - generate deterministic boundary candidates
  - produce an LLM-ready payload shape for later alignment work
- Route wiring so Talmud page fetch flows can include segmentation metadata without replacing the existing text-processing behavior.

### 2. Technical spec

Created documentation for the intended segmentation pipeline.

Files:

- `docs/talmud-segmentation-spec.md`

The spec currently describes:

- section-local processing only
- deterministic preprocessing before any LLM step
- use of English bold spans as semantic alignment anchors
- deterministic validation around any future LLM output
- offline evaluation before production use

### 3. Gold-set extraction from blogposts

Built an extraction pipeline using the local archive of blogposts as a source of hand-labeled aligned Hebrew/English passage units.

Files:

- `server/lib/blogpost-goldset.ts`
- `server/lib/blogpost-goldset-eval.ts`
- `server/generate-blogpost-goldset.ts`

What it does:

- loads the mapping CSV and archive metadata
- matches blogposts by daf/page range
- extracts the “The Passage” HTML blocks
- pairs Hebrew and English units
- preserves both raw HTML and normalized text
- emits:
  - `tmp/blogpost-goldset/blogpost-goldset.json`
  - `tmp/blogpost-goldset/blogpost-segmentation-eval.json`

### 4. QA / review page

Built a local browser page for reviewing extracted gold-set data and future segmentation payloads.

Files:

- `client/src/pages/segmentation-review.tsx`
- `client/src/App.tsx`
- `server/routes.ts`

What it currently supports:

- loading local generated gold-set JSON
- loading local generated eval JSON
- filtering/searching records
- showing structured Hebrew/English content side by side
- showing a derived text/debug view
- showing uploaded future segmentation payloads

### 5. Raw Sefaria fetch integration

Added a backend endpoint and UI support for pulling raw Sefaria source text for the selected record.

Files:

- `server/routes.ts`
- `client/src/pages/segmentation-review.tsx`

What it currently does:

- accepts a Sefaria URL/ref
- fetches raw Hebrew and English sections from Sefaria
- displays them in the review page as an additional reference layer

## Challenges Encountered

### 1. Windows / local dev environment issues

Problems encountered:

- `npm run dev` used Unix-style `NODE_ENV=development`, which does not work directly in PowerShell / standard Windows shells.
- Node was not installed on the machine in a way the project could rely on.
- The working folder was under `Downloads`, which is not a stable long-term location.

What was done:

- downloaded a portable Node distribution locally into `.tools/`
- added `.tools/` to `.gitignore`
- used Windows-safe startup commands when needed

### 2. Rendering quality in the QA page

Initial issues:

- plain-text derivation from HTML over-collapsed whitespace
- inline HTML stripping caused joined words such as `said thatR'`
- the top display was initially less trustworthy than the original structure

What was done:

- improved HTML-to-readable extraction
- made the structured rendering the primary review surface
- demoted derived/plain text to a secondary debug view

### 3. Matching blogposts to source material

Problems encountered:

- the archive titles and mapping CSV titles do not always match directly
- exact-title matching was too brittle

What was done:

- used daf/page-range matching as the primary link strategy

### 4. Repo-level TypeScript noise outside this work

There are pre-existing unrelated TypeScript issues elsewhere in the repo which interfere with a clean full-project typecheck.

Known unrelated problem files:

- `client/src/hooks/use-seo.ts`
- `client/src/lib/html-sanitizer.ts`

## Current Status

### What is working

- A segmentation schema/scaffold exists.
- Blogpost extraction and eval dataset generation exist.
- A local QA page exists at `/segmentation-review`.
- Raw Sefaria data can be fetched and shown in the review page.
- The core extraction and segmentation tests added for this work are in place.

### What is not yet complete

- No actual LLM boundary-selection execution pipeline has been added yet.
- No scorer yet compares model output directly against the eval set.
- The QA page is useful for review, but still needs refinement to better match the intended workflow.
- The Sefaria reference shown in the QA page is still too broad in some cases.

## Current Challenges

### 1. Review-page layout direction

Current issue:

- In `/segmentation-review`, Hebrew is on the left and English is on the right.

Needed change:

- This should be flipped so English is on the left and Hebrew is on the right.

### 2. Raw Sefaria fetch scope is too broad

Current issue:

- The Sefaria text currently being pulled for a selected blogpost record is for the full blogpost range.

Needed change:

- Limit the Sefaria fetch to the specific section/unit relevant to the selected gold-set record, not the entire blogpost range.

Implication:

- The extraction pipeline needs a stronger mapping from each extracted passage unit back to the exact source section index / local source span.

### 3. Hebrew display normalization for raw Sefaria text

Current issue:

- Raw Sefaria Hebrew still shows nikud.

Needed change:

- Strip nikud from the displayed Hebrew.
- Preserve only the visible punctuation needed for review, such as commas, periods, colons, semicolons, etc.

### 4. Persistence / preservation

Current issue:

- The work has been happening under `Downloads`, which is not a reliable long-term location.

Needed change:

- Move the repo and relevant supporting local assets into a more stable local folder named `Ezra Brandt`.

## Future Work Needed

### Immediate next steps

1. Flip the review layout so English is on the left and Hebrew is on the right.
2. Tighten Sefaria mapping so the review page fetches the exact corresponding source section instead of the full blogpost range.
3. Strip nikud from raw Sefaria Hebrew in the review UI and retain punctuation-only display.
4. Add a better section-level provenance model to the extracted gold-set format.

### Segmentation pipeline next steps

1. Implement an offline LLM boundary-selection runner using the existing payload scaffold.
2. Add deterministic validation of returned alignments.
3. Add a scorer against `blogpost-segmentation-eval.json`.
4. Compare baseline rules-based segmentation vs. future LLM-enhanced segmentation.

### QA workflow next steps

1. Add a three-way comparison view:
   - raw Sefaria
   - blogpost gold set
   - future segmentation output
2. Add annotation controls such as:
   - accept
   - flag
   - note
3. Add better provenance display:
   - exact source ref
   - section index
   - extracted unit index

## Relevant Files

Core implementation:

- `shared/schema.ts`
- `client/src/types/talmud.ts`
- `server/lib/talmud-segmentation.ts`
- `server/lib/blogpost-goldset.ts`
- `server/lib/blogpost-goldset-eval.ts`
- `server/generate-blogpost-goldset.ts`
- `server/routes.ts`
- `server/storage.ts`
- `client/src/App.tsx`
- `client/src/pages/segmentation-review.tsx`

Documentation:

- `docs/talmud-segmentation-spec.md`
- `docs/talmud-segmentation-handoff-2026-03-06.md`

Generated local artifacts:

- `tmp/blogpost-goldset/blogpost-goldset.json`
- `tmp/blogpost-goldset/blogpost-segmentation-eval.json`

Local supporting assets used during this phase:

- blogpost archive zip
- extracted blogpost archive folder
- blogpost mapping CSV

## Notes for Resuming Work

If work resumes later, the best next implementation task is:

- improve source provenance so each gold-set record can resolve back to an exact Sefaria section and section-local text slice.

That will unlock:

- cleaner raw-source QA
- better evaluation
- future human correction workflows
- stronger section-level model prompting

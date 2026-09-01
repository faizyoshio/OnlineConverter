# Wave 1B PDF Crop and Resize Implementation Plan

> Execution mode: implement inline with test-driven development. Do not activate either route until its operation, adapter, worker, registry, UI, and browser workflow are verified.

**Goal:** Replace the `pdf.crop` and `pdf.resize` skeletons with real, browser-local PDF operations and release-gate both routes.

**Architecture:** Extend the existing `pdf-lib` operation module and shared PDF module worker. Crop changes selected pages' PDF CropBox using bounded millimetre margins. Resize rebuilds each page at A4 dimensions and draws the original page as a proportionally fitted, centered embedded page so the visible content is deterministic. Both adapters reuse the existing PDF probe and module worker; no dependency or server path is added.

**Tech stack:** TypeScript, pdf-lib 1.17.1, existing worker protocol, Vitest, Testing Library, Playwright, Next.js 16.

## Locked contracts

- Crop syntax is `left,top,right,bottom` millimetres. Each value is finite and between 0 and 200; the resulting box must retain positive width and height.
- Crop defaults to `10,10,10,10` on page 1. `applyToAll` overrides the page expression and applies the same margins to all pages.
- Selected pages use the registry's one-based page-range syntax. Invalid or empty selections fail before processing.
- Crop preserves page count and changes only selected pages' CropBox.
- Resize outputs ISO A4 portrait pages (`595.28 × 841.89` PDF points), preserves page count, and proportionally fits and centers the visible source page on every output page.
- Inputs and outputs remain in memory. No network API, server route, raw engine exception, or `StubWorker` is allowed.

### Task 1: Add red operation-contract tests

**Files:**

- Modify: `src/engines/pdf/operations.test.ts`
- Modify: `src/features/engines/pdf/worker-operation.test.ts`

Test selected-page CropBox coordinates, all-page override, invalid excessive margins, A4 output dimensions, page-count preservation, cancellation, progress, and PDF MIME metadata. Run the focused tests and confirm the new cases fail for missing implementations.

### Task 2: Implement PDF primitives

**Files:**

- Modify: `src/engines/pdf/operations.ts`

Add `cropPdfPages` and `resizePdfPagesToA4`. Use `getCropBox`/`setCropBox` for cropping. For resize, load the source document, create an output document, embed each source page using its CropBox, create an A4 page, and draw the embedded page with a centered contain scale. Re-run focused primitive tests, typecheck, and lint.

### Task 3: Connect worker operations and real adapters

**Files:**

- Modify: `src/features/engines/pdf/worker-operation.ts`
- Replace: `src/features/engines/pdf-crop.ts`
- Replace: `src/features/engines/pdf-resize.ts`
- Modify: `src/features/engines/pdf-crop.test.ts`
- Modify: `src/features/engines/pdf-resize.test.ts`
- Modify: `src/features/engines/pdf-worker-adapters.test.ts`

Parse and validate options in the adapters and worker, reuse `probePdf`, and return `BrowserWorkerBridge(new Worker(new URL(...), { type: "module" }))`. Focused tests must prove malformed option rejection, real PDF probing, module-worker construction, result metadata, and cancellation.

### Task 4: Activate routes and update generated surfaces

**Files:**

- Modify: `src/features/capabilities/registry/pdf.ts`
- Modify: `src/features/workers/active-router.ts`
- Modify: registry, visibility, site, sitemap, static-route, and router tests

Change the crop label/default to the locked comma-separated millimetre contract, set both manifests to `active`, register both lazy adapters, and update exact active-route expectations from 16 to 18. Confirm the release tests fail before activation and pass after it.

### Task 5: Add browser workflows and run the release gate

**Files:**

- Modify: `e2e/home.spec.ts`

Add a crop workflow that enters margins and verifies a PDF download, plus a resize workflow that verifies an A4 PDF download. Run:

```powershell
$env:VERCEL_ENV='production'
$env:SITE_URL='https://online-converter.example'
npm run verify
npm run test:e2e
git diff --check
```

Expected: lint, typecheck, all Vitest suites, privacy boundary, optimized production build, and Chromium/Firefox/WebKit workflows pass. Commit only reviewed source and test files; keep `src/features/capabilities/registry.test.ts.bak` untracked and untouched.

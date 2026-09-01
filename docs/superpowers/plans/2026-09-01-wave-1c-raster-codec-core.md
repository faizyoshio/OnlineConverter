# Wave 1C Raster Codec Core Implementation Plan

> Execution mode: implement inline with test-driven development. Keep all four manifests planned until real pixel decoding, output MIME validation, worker wiring, and browser workflows pass.

**Goal:** Establish the shared browser image worker and activate four dependency-free codec capabilities covering five conversion directions: `image.jpg-to-modern` (PNG and WebP targets), `image.webp-to-jpg`, `image.webp-to-png`, and `image.jfif-to-png`.

**Architecture:** Decode one local file with `createImageBitmap`, draw it to `OffscreenCanvas`, and encode with `convertToBlob`. The worker operation owns pixels and output blobs; the adapter only performs signature/dimension probing and option validation. JPEG output paints the selected alpha background before drawing. Every lossy encoder verifies the actual Blob MIME because browsers may decline a requested codec. Existing format-specific skeleton exports delegate to the shared adapter; no server route or new package is introduced.

**Tech stack:** TypeScript, browser ImageBitmap/OffscreenCanvas APIs, existing worker protocol and result manager, Vitest, Playwright, Next.js 16.

## Locked contracts

- One input only; exact JPEG/JFIF or WebP signature must match the capability.
- Decoded dimensions must be finite, positive, at most 20,000 per side, and no more than 40 megapixels.
- `image.jpg-to-modern` requires explicit `png` or `webp`; WebP quality defaults to 85.
- `image.webp-to-jpg` produces `image/jpeg`, paints `#ffffff` by default, and uses quality 85.
- `image.webp-to-png` and `image.jfif-to-png` produce `image/png` at the decoded dimensions.
- Output Blob MIME must equal the requested MIME. A browser codec fallback is a normalized device/codec failure, never a mislabeled download.
- ImageBitmap is closed in `finally`; cancellation is checked before decode, after decode, before encode, and before return.
- No raw pixels, image bytes, filenames, or dimensions derived from user content enter logs or persisted state.

### Task 1: Write red probe and worker-operation tests

**Files:**

- Add: `src/features/engines/image/probe.test.ts`
- Add: `src/features/engines/image/worker-operation.test.ts`

Use injected decoder/canvas doubles to assert target MIME, background behavior, quality normalization, metadata dimensions, cancellation, bitmap closure, and MIME mismatch rejection. Probe tests cover JPEG/WebP signatures, decoded dimension limits, corrupt decode, and cleanup.

### Task 2: Implement the shared image core

**Files:**

- Add: `src/features/engines/image/probe.ts`
- Add: `src/features/engines/image/options.ts`
- Add: `src/features/engines/image/worker-operation.ts`
- Add: `src/features/workers/image.worker.ts`

Keep browser globals behind small injectable dependencies for deterministic unit tests. Validate decoded budgets before allocating the output canvas. Emit only serializable progress and approved result metadata.

### Task 3: Implement real adapters and replace skeleton exports

**Files:**

- Add: `src/features/engines/image/adapter.ts`
- Replace: `src/features/engines/image-jpg-to-png.ts`
- Replace: `src/features/engines/image-jpg-to-webp.ts`
- Replace: `src/features/engines/image-webp-to-jpg.ts`
- Replace: `src/features/engines/image-webp-to-png.ts`
- Replace: `src/features/engines/image-jfif-to-png.ts`
- Update their tests and add a module-worker construction test

All wrappers must delegate to `createImageAdapter` with the correct capability ID and must not contain `StubWorker`.

### Task 4: Activate exactly four codec routes

**Files:**

- Modify: `src/features/capabilities/registry/image.ts`
- Modify: `src/features/workers/active-router.ts`
- Modify: registry, visibility, site, sitemap, static-route, and router tests

Register `image.jpg-to-modern`, `image.webp-to-jpg`, `image.webp-to-png`, and `image.jfif-to-png`. The JPEG combined workflow counts as one capability even though it has two target formats, so active capability count rises from 18 to 22 and planned count falls from 72 to 68.

### Task 5: Browser workflows and full release gate

**Files:**

- Modify: `e2e/home.spec.ts`

Generate tiny JPEG and WebP fixtures in the browser without remote requests. Verify JPEG→PNG, JPEG→WebP, WebP→JPEG, WebP→PNG, and JFIF→PNG downloads in Chromium, Firefox, and WebKit. Then run production `npm run verify`, the complete Playwright suite, and `git diff --check`. Leave `src/features/capabilities/registry.test.ts.bak` untracked and untouched.

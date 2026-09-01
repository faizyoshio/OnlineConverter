# Wave 1A Archive and Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six archive/utility skeleton adapters with real browser-worker implementations, activate their routes, and prove them in production-mode browser tests without sending user data to the server.

**Architecture:** Pure, directly tested operations live under `src/engines/utility`; worker-facing orchestration lives under `src/features/engines/utility` and `src/features/engines/archive`; two dedicated module workers use the existing `LocalWorkerRuntime`. Thin capability adapters share one factory per worker family and remain lazy-loaded by `createActiveEngineRouter`. Value tools emit `LocalValuePayload`; archive and barcode tools emit blobs owned by `ResultManager`.

**Tech Stack:** Node.js 24, TypeScript 6, Next.js 16.3.3, React 19, Vitest 4.1.11, Playwright 1.62.1, JSZip 3.10.1, Web Crypto, `Intl.DateTimeFormat`, OffscreenCanvas, and pinned `@bwip-js/browser` 4.11.4.

**Spec:** `docs/superpowers/specs/2026-08-28-online-converter-design.md`

## Global Constraints

- File bytes, filenames, relative paths, extracted entry names, generated passwords, barcode text, and result bytes stay inside the browser conversion plane.
- ZIP input is limited to 75 MB compressed, 200 MB expanded, 1,000 entries, and nesting depth 10.
- ZIP creation accepts at most 20 files and 100 MB aggregate input; unsafe absolute, drive-prefixed, NUL-containing, or parent-traversal names are rejected.
- ZIP extraction rejects unsafe original entry names even when JSZip exposes a sanitized name.
- Password generation requires `crypto.getRandomValues`; there is no `Math.random` fallback and no modulo-biased index selection.
- Unit conversion supports every manifest category: length, area, volume, mass, temperature, speed, pressure, energy, power, data-size, and angle.
- Time conversion interprets a zone-less local date/time in `fromZone`, produces the instant rendered in `toZone`, rejects invalid IANA zones and impossible wall times, and reports the exact UTC offset used.
- Barcode generation supports exactly Code 128, Code 39, EAN-13, EAN-8, UPC-A, ITF-14, Codabar, and QR; invalid values fail before an output is created.
- All six capabilities remain `planned` until primitive, adapter, result, cancellation, cleanup, privacy, accessibility, and browser acceptance tests pass.
- No conversion route accepts request bodies and no server module imports archive, utility, barcode, worker, or result code.

---

## File Responsibility Map

| Area | Files | Responsibility |
|---|---|---|
| Utility primitives | `src/engines/utility/operations.ts`, `src/engines/utility/operations.test.ts` | Exact unit/time/password behavior and safe ZIP create/extract helpers. |
| Barcode primitive | `src/engines/utility/barcode.ts`, `src/engines/utility/barcode.test.ts` | Validated symbology mapping and SVG generation through the pinned browser package. |
| Archive orchestration | `src/features/engines/archive/worker-operation.ts`, `src/features/engines/archive/worker-operation.test.ts` | ZIP input/output mapping, names, limits, progress, and cancellation. |
| Utility orchestration | `src/features/engines/utility/worker-operation.ts`, `src/features/engines/utility/worker-operation.test.ts` | Options-to-value results and barcode SVG/PNG output. |
| Worker entry points | `src/features/workers/archive.worker.ts`, `src/features/workers/utility.worker.ts` | Dedicated `LocalWorkerRuntime` instances. |
| Adapter factories | `src/features/engines/archive/adapter.ts`, `src/features/engines/utility/adapter.ts` | Real probe/validation plus module-worker construction. |
| Capability shims | Existing six files in `src/features/engines` | Preserve exported factory names while delegating to the family factories. |
| Release routing | `src/features/workers/active-router.ts`, `src/features/capabilities/registry/utility.ts` | Lazy-load real adapters and activate only reviewed manifests. |
| UI and browser acceptance | `src/components/workspace/tool-workspace.test.tsx`, `e2e/home.spec.ts` | Value-input interaction, downloads, password lifecycle, ZIP roundtrip, and barcode output. |

---

### Task 1: Harden the pure utility and archive operations

**Files:**
- Modify: `src/engines/utility/operations.ts`
- Modify: `src/engines/utility/operations.test.ts`

**Interfaces:**
- Produces: `convertUnits(value, category, fromUnit, toUnit, maxSignificantDigits)` for all declared categories.
- Produces: `convertTime(dateTime, fromZone, toZone)` with an exact instant and target offset.
- Produces: `generatePassword(options, randomSource?)` with secure rejection sampling; production defaults to Web Crypto.
- Produces: `createZip(files, options)` and `inspectZip(bytes)`/`extractZip(bytes, options)` with safe-name and expanded-size enforcement.

- [ ] **Step 1: Write failing unit-table tests**

  Add hand-derived expectations for pressure (`1 bar = 100000 Pa`), energy (`1 kWh = 3.6 MJ`), power (`1 hp = 745.6998715822702 W` within eight significant digits), data-size (`1 GiB = 1073741824 B`), and angle (`180 deg = π rad`). Add rejection tests for an unsupported unit and non-finite input.

- [ ] **Step 2: Run the unit tests and verify RED**

  Run `npm test -- src/engines/utility/operations.test.ts`.
  Expected: the missing categories and non-finite input assertions fail against the current tables.

- [ ] **Step 3: Implement the complete immutable conversion table**

  Normalize the manifest key `data-size`, keep temperature affine conversion separate, validate `Number.isFinite(value)`, and clamp significant digits to `1..8` before `toPrecision`.

- [ ] **Step 4: Write failing source-zone time tests**

  Assert that `2026-01-15T12:00:00` in `Asia/Jakarta` becomes `2026-01-15T05:00:00.000Z`, renders as `05:00:00` in UTC, rejects `Not/AZone`, and rejects a nonexistent DST wall time such as `2026-03-08T02:30:00` in `America/New_York`.

- [ ] **Step 5: Implement wall-time-to-instant conversion**

  Parse an ISO-like zone-less wall time into numeric parts, use `Intl.DateTimeFormat(..., { timeZone, hourCycle: "h23" })` to iteratively solve the zone offset, and round-trip the resolved instant back to the source zone. Reject when the round-trip fields differ, which covers invalid and skipped wall times. ISO strings with `Z` or an explicit numeric offset already identify an instant and bypass source-zone interpretation.

- [ ] **Step 6: Write failing password security tests**

  Assert no selected group is omitted, disabled groups never appear, no-group selection fails, lengths outside `4..128` fail, missing `crypto.getRandomValues` fails, and a deterministic byte source that first yields an out-of-range byte exercises rejection sampling.

- [ ] **Step 7: Implement secure password generation**

  Use a `RandomSource` interface with `getRandomValues<T extends ArrayBufferView>(array: T): T`; choose indices only from bytes below `256 - (256 % alphabet.length)`, place one character from every enabled group, fill remaining positions from the union, and securely shuffle with the same source.

- [ ] **Step 8: Write failing ZIP security tests**

  Assert creation rejects `../secret.txt`, `/absolute.txt`, `C:\\secret.txt`, NUL names, duplicate normalized names, and more than 20 inputs. Assert inspection/extraction rejects unsafe original names, more than 1,000 entries, depth above 10, and expanded output above 200 MB; verify safe nested entries round-trip with exact bytes.

- [ ] **Step 9: Implement bounded ZIP helpers**

  Centralize `normalizeArchiveName`, use `JSZipObject.unsafeOriginalName` when available, inspect entry count/depth before extraction, accumulate extracted byte lengths with an early 200 MB stop, and return only regular files. Never expose an entry before all safety checks pass.

- [ ] **Step 10: Verify Task 1**

  Run `npm test -- src/engines/utility/operations.test.ts`, `npm run typecheck`, and `git diff --check`.

---

### Task 2: Add validated local barcode generation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/engines/utility/barcode.ts`
- Create: `src/engines/utility/barcode.test.ts`

**Interfaces:**
- Produces: `generateBarcodeSvg(options): Promise<string>` where `options.format` is the manifest format union and output is a self-contained SVG string.
- Produces: `barcodeEncoder(format)` mapping to `code128`, `code39`, `ean13`, `ean8`, `upca`, `itf14`, `rationalizedCodabar`, or `qrcode`.

- [ ] **Step 1: Add failing validation/mapping tests**

  Use literal valid samples (`ABC-123`, `5901234123457`, `55123457`, `036000291452`, `10012345000017`, `A12345B`, and `https://example.com`) and invalid checksum/character samples. Assert generated output begins with `<svg`, contains a `viewBox`, and never contains `<script`, external URLs, or the raw text in an executable attribute.

- [ ] **Step 2: Verify RED**

  Run `npm test -- src/engines/utility/barcode.test.ts`.
  Expected: module-not-found because the barcode primitive does not exist.

- [ ] **Step 3: Install the verified browser package**

  Run `npm install @bwip-js/browser@4.11.4 --save-exact`. The package is MIT licensed and its official browser API exports SVG drawing without a server call.

- [ ] **Step 4: Implement format validation and SVG generation**

  Validate retail checksum lengths before invoking the encoder, cap barcode input at 2,048 Unicode code points, set `paddingwidth`/`paddingheight` from `quietZonePx`, and invoke the package's browser SVG drawing API through a static ESM import so Next can bundle it into the utility worker chunk.

- [ ] **Step 5: Verify Task 2**

  Run `npm test -- src/engines/utility/barcode.test.ts`, `npm run typecheck`, `npm run lint`, and `git diff --check`.

---

### Task 3: Implement archive worker operations and real adapters

**Files:**
- Create: `src/features/engines/archive/worker-operation.ts`
- Create: `src/features/engines/archive/worker-operation.test.ts`
- Create: `src/features/engines/archive/adapter.ts`
- Create: `src/features/engines/archive/adapter.test.ts`
- Create: `src/features/workers/archive.worker.ts`
- Modify: `src/features/engines/archive-zip-create.ts`
- Modify: `src/features/engines/zip-extract.ts`

**Interfaces:**
- Produces: `processArchiveOperation(context): Promise<LocalWorkerResult>`.
- Produces: `createArchiveAdapter(capabilityId): EngineAdapter<Readonly<Record<string, unknown>>>`.

- [ ] **Step 1: Write failing worker-operation tests**

  For ZIP Maker, pass two real `File` objects, assert an `application/zip` blob, exact metadata byte length, preserved/flattened safe names, progress stages, and cancellation before output. For ZIP Extractor, assert `selected-entries` mode, original safe download names, exact bytes, flatten collision rejection, unsafe original-name rejection, and cancellation.

- [ ] **Step 2: Verify RED**

  Run `npm test -- src/features/engines/archive`.
  Expected: module-not-found for the new worker operation and adapter.

- [ ] **Step 3: Implement archive orchestration**

  Convert `File` objects to `Uint8Array` only inside the worker operation. Emit progress for reading, inspecting, compressing/extracting, and finalizing. Return no partial output after cancellation. ZIP Maker returns files mode without a suggested name; ZIP Extractor returns selected-entry outputs with basename-only safe suggested names.

- [ ] **Step 4: Implement archive probe and validation**

  ZIP Maker probes opaque input using actual byte length. ZIP Extractor checks the ZIP signature, calls `inspectZip` for expanded bytes/entry count/depth, and returns `ValidationIssue` values for unsafe entries or limits instead of pretending a zero-size probe.

- [ ] **Step 5: Wire the archive module worker**

  Instantiate `LocalWorkerRuntime` in `archive.worker.ts`; the adapter creates `new Worker(new URL("../../workers/archive.worker.ts", import.meta.url), { type: "module" })` wrapped by `BrowserWorkerBridge`.

- [ ] **Step 6: Replace skeleton exports**

  `createArchiveZipCreateAdapter()` and `createZipExtractAdapter()` delegate to `createArchiveAdapter` with their exact capability IDs. Remove every `StubWorker` and eslint suppression from both files.

- [ ] **Step 7: Verify Task 3**

  Run `npm test -- src/features/engines/archive src/features/engines/archive-zip-create.test.ts src/features/engines/zip-extract.test.ts`, `npm run typecheck`, and `npm run lint`.

---

### Task 4: Implement utility worker operations and real adapters

**Files:**
- Create: `src/features/engines/utility/worker-operation.ts`
- Create: `src/features/engines/utility/worker-operation.test.ts`
- Create: `src/features/engines/utility/adapter.ts`
- Create: `src/features/engines/utility/adapter.test.ts`
- Create: `src/features/workers/utility.worker.ts`
- Modify: `src/features/engines/utility-unit.ts`
- Modify: `src/features/engines/utility-time.ts`
- Modify: `src/features/engines/utility-barcode.ts`
- Modify: `src/features/engines/utility-password.ts`

**Interfaces:**
- Produces: `processUtilityOperation(context): Promise<LocalWorkerResult>`.
- Produces: `createUtilityAdapter(capabilityId): EngineAdapter<Readonly<Record<string, unknown>>>`.

- [ ] **Step 1: Write failing operation tests**

  Assert literal number/time/password value payloads, empty output MIME/byte arrays for value results, SVG barcode file output, PNG barcode rasterization through injected `svgToPng`, progress stages, invalid options, and cancellation before output.

- [ ] **Step 2: Verify RED**

  Run `npm test -- src/features/engines/utility`.
  Expected: module-not-found for the new worker operation and adapter.

- [ ] **Step 3: Implement value operations**

  Parse typed options defensively, call the pure primitives, return the exact `LocalValuePayload` discriminant declared by each manifest, and report indeterminate or measured stages truthfully.

- [ ] **Step 4: Implement barcode file operations**

  Return SVG as `image/svg+xml`. For PNG, create an SVG Blob, decode it with `createImageBitmap`, draw to an `OffscreenCanvas`, call `convertToBlob({ type: "image/png" })`, and always close the bitmap. Reject when these browser APIs are unavailable.

- [ ] **Step 5: Implement utility module worker and adapters**

  Value tools' `probe` reports unknown only if called unexpectedly; their actual deep validation operates on options because they accept zero files. The barcode adapter requires canvas only for PNG selection. All adapter workers use `utility.worker.ts` through `BrowserWorkerBridge`.

- [ ] **Step 6: Replace the four skeleton exports**

  Preserve `createUnitConverterAdapter`, `createTimeConverterAdapter`, `createBarcodeGeneratorAdapter`, and `createPasswordGeneratorAdapter` while delegating to the real family adapter.

- [ ] **Step 7: Verify Task 4**

  Run `npm test -- src/features/engines/utility src/features/engines/utility-*.test.ts`, `npm run typecheck`, and `npm run lint`.

---

### Task 5: Activate six routes only after release-gate tests pass

**Files:**
- Modify: `src/features/workers/active-router.ts`
- Modify: `src/features/workers/active-router.test.ts`
- Modify: `src/features/capabilities/registry/utility.ts`
- Modify: `src/features/capabilities/registry.test.ts`
- Modify: `src/features/capabilities/visibility.test.ts`
- Modify: `src/lib/site.test.ts`
- Modify: `src/app/sitemap.test.ts`

**Interfaces:**
- Consumes: six real adapter factories.
- Produces: sixteen active capabilities total and statically generated routes for the six new slugs.

- [ ] **Step 1: Write failing router and release-status tests**

  Assert all six adapter keys load, all 90 manifests remain unique, exactly sixteen are active, seventy-four remain planned, and the active IDs/routes/sitemap contain the six archive/utility entries in registry order.

- [ ] **Step 2: Verify RED**

  Run `npm test -- src/features/workers/active-router.test.ts src/features/capabilities/registry.test.ts src/features/capabilities/visibility.test.ts src/lib/site.test.ts src/app/sitemap.test.ts`.
  Expected: active count and router registration assertions fail while manifests remain planned.

- [ ] **Step 3: Register lazy adapters**

  Add one lazy import per adapter key to `createActiveEngineRouter`; do not eagerly import JSZip or the barcode package from server-rendered modules.

- [ ] **Step 4: Activate all six utility manifests**

  Change only `releaseStatus` after focused primitive, adapter, result, and worker suites pass. No other planned capability changes status in this task.

- [ ] **Step 5: Verify Task 5**

  Re-run the focused suite, `npm run check:privacy`, `npm run typecheck`, and `npm run lint`.

---

### Task 6: Prove value and archive workflows in real browsers

**Files:**
- Modify: `src/components/workspace/tool-workspace.test.tsx`
- Modify: `e2e/home.spec.ts`

**Interfaces:**
- Consumes: active static routes and real module workers.
- Produces: browser acceptance evidence for the complete Wave 1A user flows.

- [ ] **Step 1: Add failing UI behavior tests**

  Assert value-mode tools do not render a drop zone, option changes reach `runner.run`, required empty text options surface validation, password output is removed on rerun/unmount, and result links expose only managed object URLs and safe download names.

- [ ] **Step 2: Verify RED and implement the smallest workspace correction**

  Run `npm test -- src/components/workspace/tool-workspace.test.tsx`. If the existing component already satisfies an assertion, keep it; only change production UI for a demonstrated failure. Re-run until green.

- [ ] **Step 3: Add browser E2E workflows**

  Exercise unit conversion, Jakarta-to-UTC time conversion, password generation, SVG and PNG barcode downloads, ZIP creation with two files, and extraction of the generated ZIP. For each route assert success, output type/value, no page error, and no request with a non-empty body during processing.

- [ ] **Step 4: Run Chromium first**

  Run `npm run test:e2e -- --project=chromium`. Correct only evidenced integration defects, then run the focused unit tests again.

- [ ] **Step 5: Run the cross-browser matrix**

  Run `npm run test:e2e`. All Chromium, Firefox, and WebKit cases must pass; PNG barcode support must be disabled with an actionable device message only if a browser demonstrably lacks the required worker APIs.

---

### Task 7: Complete Wave 1A acceptance and document the release increment

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture/wave-0.md`
- Modify: `docs/superpowers/plans/2026-08-30-wave-1-pdf-image-utility-engines.md`

**Interfaces:**
- Produces: accurate active-tool documentation and a non-misleading Wave 1 decomposition record.

- [ ] **Step 1: Replace the duplicated Wave 1 document**

  Record that Wave 1 is decomposed into Wave 1A archive/utility, Wave 1B remaining PDF, and Wave 1C image/OCR plans. Point Wave 1A to this file and list the exact remaining family counts without claiming they are implemented.

- [ ] **Step 2: Update setup and architecture docs**

  Document the utility/archive workers, barcode dependency license/version, active count, no-upload E2E gate, and browser requirements. Keep Vercel `SITE_URL` and Node 24 instructions accurate.

- [ ] **Step 3: Run complete acceptance**

  Run `npm ci`, `npm run verify` with an HTTPS `SITE_URL`, and `npm run test:e2e`. Confirm privacy scan, production SSG for sixteen tool routes, and all browser cases pass.

- [ ] **Step 4: Review the final diff**

  Run `git diff --check`, inspect every changed file, confirm no `StubWorker` remains for the six active capabilities, and confirm the pre-existing untracked `registry.test.ts.bak` is not staged.

- [ ] **Step 5: Commit Wave 1A**

  Commit independently reviewable tasks as they complete, ending with `feat: activate archive and utility tools` once the complete acceptance sequence is green.

---

## Spec Coverage Self-Review

| Requirement | Evidence task |
|---|---|
| Six declared archive/utility capabilities work locally | Tasks 1–6 |
| Universal ZIP and batch limits | Tasks 1 and 3 |
| Unsafe archive paths never escape or leak | Tasks 1, 3, and 6 |
| Web Crypto password generation | Tasks 1, 4, and 6 |
| Exact unit/time value results | Tasks 1, 4, and 6 |
| Eight declared barcode formats, PNG/SVG outputs | Tasks 2, 4, and 6 |
| Worker isolation, cancellation, progress, cleanup | Tasks 3, 4, and 6 |
| Active-only routes and sitemap | Task 5 |
| No conversion bytes cross the server boundary | Tasks 5–7 |
| Vercel production build and three-browser matrix | Task 7 |

Placeholder scan: the plan contains no implementation placeholders or deferred behavior inside Wave 1A. Remaining PDF/image/OCR families are separate approved subprojects, not hidden omissions from this plan.

Type audit: every worker returns the existing `LocalWorkerResult`, every value result uses an existing `LocalValuePayload` discriminant, every adapter implements `EngineAdapter<Readonly<Record<string, unknown>>>`, and all workers communicate through the existing `WorkerRequest`/`WorkerResponse` protocol.

# Wave 0 Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-shaped Next.js foundation that declares all 90 launch capabilities, enforces shared privacy and job contracts, and is ready for Wave 1 engine adapters without exposing nonfunctional tools as active.

**Architecture:** Next.js App Router statically renders the public shell and catalog while focused TypeScript modules own capability declarations, validation, jobs, workers, results, and privacy-safe telemetry. Heavy conversion code is absent from Wave 0; later adapters implement a stable worker protocol and must pass the contract harness created here.

**Tech Stack:** Node.js 24 LTS, npm, Next.js 16.3.3 App Router, React resolved and locked by npm, strict TypeScript, Zod 4.4.3, CSS Modules and CSS custom properties, Vitest 4.1.11, Testing Library, Playwright 1.62.1, ESLint, GitHub Actions, and Vercel previews.

**Spec:** `docs/superpowers/specs/2026-08-28-online-converter-design.md`

## Global Constraints

- The launch catalog contains exactly 90 capabilities: 27 PDF, 31 image, 13 video/audio, 11 GIF, 6 archive/utility, and 2 signature/privacy.
- The 39 excluded capabilities never appear as active tools or conversion claims.
- Files, filenames, paths, hashes, OCR text, previews, outputs, archive entry names, and conversion history never enter server routes, Neon, analytics, or telemetry.
- Conversion remains anonymous-first and independent of authentication or database availability.
- Vercel serves static pages, browser assets, auth, and tiny metadata operations only; it never receives conversion input or output.
- Universal limits are PDF 25 MB/100 pages; image 20 MB/40 MP; batch 20 files/100 MB; video 50 MB/3 minutes/1080p; audio 50 MB/15 minutes; GIF 25 MB/30 seconds/720p; ZIP 75 MB compressed/200 MB expanded/1,000 entries/depth 10; OCR 20 pages or images.
- Desktop and mobile use the same published limits; device capability can cause an earlier rejection with an actionable explanation.
- Capability result contracts are exactly `exact-structural`, `lossy-visual`, or `best-effort-semantic`.
- Every heavy engine is lazy-loaded behind an adapter and executes in a worker.
- Active tools require real validation, processing, progress or truthful stages, cancellation, cleanup, fixtures, accessibility, and privacy-safe errors.
- Wave 0 keeps every launch manifest at `planned`; planned cards may appear only in local or Vercel Preview catalog-review mode and never link to a nonfunctional workspace.
- Public UI copy is English-first; code identifiers and test names use English.
- Target WCAG 2.2 AA and respect reduced-motion preferences.
- Node runtime is `>=24 <25`; commit `package-lock.json` and pin the resolved dependency graph.
- Use npm scripts for every CI action; no globally installed package is required.

---

## File Responsibility Map

| Area | Files | Responsibility |
|---|---|---|
| Runtime and build | `package.json`, `package-lock.json`, `.nvmrc`, `.node-version`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` | Reproducible Node/Next build, strict types, scripts, and security headers. |
| Test harness | `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `e2e/`, `src/test/` | Unit, component, and three-browser smoke infrastructure. |
| Application shell | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`, `src/app/globals.css` | Static public frame, metadata, home catalog, and fallback page. |
| Design system | `src/styles/tokens.css`, `src/components/ui/` | Bright Utility tokens and small accessible primitives. |
| Capability domain | `src/features/capabilities/schema.ts`, `registry/*.ts`, `index.ts`, `search.ts`, `visibility.ts` | Normative 90-manifest registry, search ranking, categories, and release-state filtering. |
| Validation | `src/features/validation/types.ts`, `limits.ts`, `signatures.ts`, `validate.ts` | Format probes, exact universal limits, normalized preflight issues. |
| Job lifecycle | `src/features/jobs/types.ts`, `errors.ts`, `reducer.ts`, `controller.ts` | State machine, normalized failures, cancellation, progress, and worker orchestration. |
| Worker boundary | `src/features/workers/protocol.ts`, `adapter.ts` | Serializable messages and the stable engine-adapter interface used by Waves 1–3. |
| Result ownership | `src/features/results/result-manager.ts` | Object URL creation, download metadata, and deterministic disposal. |
| Telemetry boundary | `src/features/telemetry/events.ts`, `sanitize.ts` | Closed event schema that cannot accept file-derived fields or raw exceptions. |
| Catalog UI | `src/components/catalog/` | Search input, category filters, cards, counts, empty state, and preview-mode planned labels. |
| Workspace UI | `src/components/workspace/` | Testable file selection, configuration slot, progress, warning, failure, result, and cancel UI with an injected job runner. |
| Routes and SEO | `src/app/tools/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/site.ts` | Active-only static tool routes, metadata, sitemap, robots, and canonical site configuration. |
| CI and policy | `.github/workflows/ci.yml`, `scripts/check-privacy-boundary.mjs`, `README.md`, `docs/architecture/wave-0.md` | Repeatable quality gates, privacy regression scan, and developer handoff. |

---

### Task 1: Bootstrap the strict Next.js and test toolchain

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.nvmrc`
- Create: `.node-version`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.test.tsx`
- Create: `e2e/home.spec.ts`

**Interfaces:**
- Consumes: approved design spec only.
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, and `verify`; a renderable App Router shell; reusable Vitest and Playwright configuration.

- [ ] **Step 1: Verify the required runtime**

Run:

```powershell
node --version
npm --version
```

Expected: Node reports `v24.x`; npm exits successfully. Stop this task if Node is outside `>=24 <25`.

- [ ] **Step 2: Create the package manifest and install the pinned starting toolchain**

Create `package.json`:

```json
{
  "name": "online-converter",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

Run:

```powershell
npm install next@16.3.3 react@latest react-dom@latest zod@4.4.3
npm install --save-dev typescript@7.0.2 @types/node@latest @types/react@latest @types/react-dom@latest eslint@10.9.1 eslint-config-next@16.3.3 vitest@4.1.11 jsdom@latest @vitejs/plugin-react@latest @testing-library/react@16.3.3 @testing-library/jest-dom@latest @testing-library/user-event@latest @playwright/test@1.62.1
```

Expected: npm creates `package-lock.json`; `npm ls --depth=0` exits successfully. If a peer-dependency conflict occurs, retain Next.js 16.3.3 and choose the newest peer-compatible TypeScript/ESLint package rather than using `--force`; record the resolved version in the plan execution note and lockfile.

- [ ] **Step 3: Create runtime markers and strict configuration**

Set both `.nvmrc` and `.node-version` to:

```text
24
```

Create `tsconfig.json` with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `moduleResolution: "bundler"`, and alias `@/*` to `./src/*`. Configure `vitest.config.ts` for `jsdom`, `vitest.setup.ts`, CSS support, and aliases. Configure `playwright.config.ts` with `webServer.command = "npm run dev"`, `baseURL = "http://127.0.0.1:3000"`, and projects named `chromium`, `firefox`, and `webkit`.

- [ ] **Step 4: Write the failing home-page unit test**

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

test("introduces local browser conversion", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: /convert files locally/i })).toBeVisible();
  expect(screen.getByText(/files never leave your device/i)).toBeVisible();
});
```

- [ ] **Step 5: Run the unit test and observe the expected failure**

Run:

```powershell
npm test -- src/app/page.test.tsx
```

Expected: FAIL because `src/app/page.tsx` does not exist or does not render the required copy.

- [ ] **Step 6: Implement the smallest server-rendered shell**

Create `src/app/layout.tsx` with English metadata, `<html lang="en">`, a skip link, `<main id="main-content">`, and global CSS import. Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <p>Private by design</p>
      <h1 id="home-title">Convert files locally in your browser</h1>
      <p>Files never leave your device.</p>
    </section>
  );
}
```

Create `src/app/not-found.tsx` with a heading, plain explanation, and link to `/`.

- [ ] **Step 7: Add the browser smoke test**

Create `e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home page explains the privacy boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/convert files locally/i);
  await expect(page.getByText(/files never leave your device/i)).toBeVisible();
});
```

- [ ] **Step 8: Verify the bootstrap**

Run:

```powershell
npm run lint
npm run typecheck
npm test -- src/app/page.test.tsx
npm run build
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

Expected: every command exits 0 and Next reports a successful production build.

- [ ] **Step 9: Commit the bootstrap**

```powershell
git add package.json package-lock.json .nvmrc .node-version tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src/app e2e/home.spec.ts
git commit -m "build: bootstrap Next.js foundation"
```

---

### Task 2: Define and validate the complete 90-capability registry

**Files:**
- Create: `src/features/capabilities/schema.ts`
- Create: `src/features/capabilities/registry/pdf.ts`
- Create: `src/features/capabilities/registry/image.ts`
- Create: `src/features/capabilities/registry/media.ts`
- Create: `src/features/capabilities/registry/gif.ts`
- Create: `src/features/capabilities/registry/utility.ts`
- Create: `src/features/capabilities/registry/trust.ts`
- Create: `src/features/capabilities/index.ts`
- Create: `src/features/capabilities/registry.test.ts`

**Interfaces:**
- Consumes: Zod and the normative matrix in spec Sections 17.1–17.6.
- Produces: `CapabilityManifest`, `CapabilityId`, `CapabilityCategory`, `capabilityRegistry`, `getCapabilityBySlug(slug)`, `assertValidRegistry(manifests)`, and `validateOptionValues(manifest, input)`.

- [ ] **Step 1: Write the failing registry invariants**

Create `src/features/capabilities/registry.test.ts` with these exact assertions:

```ts
import { capabilityRegistry, validateOptionValues } from "./index";

const expectedCategoryCounts = {
  pdf: 27,
  image: 31,
  media: 13,
  gif: 11,
  utility: 6,
  trust: 2,
} as const;

test("declares 90 unique planned launch capabilities", () => {
  expect(capabilityRegistry).toHaveLength(90);
  expect(new Set(capabilityRegistry.map((item) => item.id)).size).toBe(90);
  expect(new Set(capabilityRegistry.map((item) => item.slug)).size).toBe(90);
  expect(capabilityRegistry.every((item) => item.releaseStatus === "planned")).toBe(true);
});

test.each(Object.entries(expectedCategoryCounts))("declares the %s category count", (category, count) => {
  expect(capabilityRegistry.filter((item) => item.category === category)).toHaveLength(count);
});

test("keeps server processing impossible by contract", () => {
  expect(capabilityRegistry.every((item) => item.execution === "browser-worker")).toBe(true);
});

test("carries the activation contract for every planned capability", () => {
  for (const item of capabilityRegistry) {
    expect(item.optionFields.length).toBeGreaterThan(0);
    expect(item.limits.profiles.length).toBeGreaterThan(0);
    expect(item.adapterKey).toMatch(/^[a-z]+\.[a-z0-9-]+$/);
    expect(Object.keys(item.fixturePlan)).toEqual([
      "minimumValid",
      "representative",
      "malformed",
      "atLimit",
      "overLimit",
      "cancellation",
      "cleanup",
    ]);
    expect(item.browserRequirements).toContain("worker");
    expect(item.unsupportedMessage).toMatch(/not supported/i);
  }
});

test("validates option choices and numeric bounds from the manifest", () => {
  const manifest = capabilityRegistry.find((item) => item.id === "pdf.to-image");
  expect(manifest).toBeDefined();
  expect(validateOptionValues(manifest!, { format: "png", dpi: 144 })).toEqual({ format: "png", dpi: 144 });
  expect(() => validateOptionValues(manifest!, { format: "exe", dpi: 10_000 })).toThrow(/invalid option/i);
});
```

- [ ] **Step 2: Run the registry test and observe the expected failure**

Run:

```powershell
npm test -- src/features/capabilities/registry.test.ts
```

Expected: FAIL because the registry modules do not exist.

- [ ] **Step 3: Define the runtime manifest schema**

Create `schema.ts` with this public shape:

```ts
import { z } from "zod";

export const capabilityCategorySchema = z.enum(["pdf", "image", "media", "gif", "utility", "trust"]);
export const resultContractSchema = z.enum(["exact-structural", "lossy-visual", "best-effort-semantic"]);
export const releaseStatusSchema = z.enum(["planned", "active", "disabled"]);
const optionValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const optionFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  label: z.string().min(2).max(64),
  control: z.enum(["select", "number", "range", "toggle", "text", "color", "page-range", "crop-box"]),
  defaultValue: optionValueSchema,
  required: z.boolean(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  step: z.number().positive().optional(),
  choices: z.array(z.object({ label: z.string(), value: optionValueSchema })).optional(),
});
const fixturePlanSchema = z.object({
  minimumValid: z.string().min(3),
  representative: z.string().min(3),
  malformed: z.string().min(3),
  atLimit: z.string().min(3),
  overLimit: z.string().min(3),
  cancellation: z.string().min(3),
  cleanup: z.string().min(3),
});
export const fileKindSchema = z.enum([
  "pdf", "jpeg", "png", "webp", "bmp", "jfif", "heic", "svg", "html", "text",
  "gif", "apng", "zip", "mp4", "mov", "webm", "avi", "mp3", "wav", "ogg",
  "aac", "m4a", "flac", "binary",
]);
export const probeRuleSchema = z.enum([
  "pdf-header", "jpeg-soi", "png-signature", "webp-riff", "bmp-header", "heic-brand",
  "sanitized-svg", "sanitized-html", "utf8-text", "gif-header", "apng-chunks", "zip-header",
  "iso-bmff-brand", "webm-ebml", "avi-riff", "mp3-frame-or-id3", "wav-riff", "ogg-header",
  "aac-adts", "flac-header", "opaque-local-file",
]);
const inputDescriptorSchema = z.object({
  kind: fileKindSchema,
  mimeTypes: z.array(z.string().min(3)).min(1),
  extensions: z.array(z.string().regex(/^(\.[a-z0-9]+|\*)$/)).min(1),
  probeRule: probeRuleSchema,
});
const outputDescriptorSchema = z.object({
  kind: fileKindSchema,
  mimeType: z.string().min(3),
  extension: z.union([z.string().regex(/^\.[a-z0-9]+$/), z.literal("preserve")]),
  fallback: z.enum(["reject", "explicit-user-choice", "listed-fallback"]),
  fallbackKind: fileKindSchema.optional(),
});
const resultDefinitionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("files"), files: z.array(outputDescriptorSchema).min(1) }),
  z.object({ mode: z.literal("selected-entries"), files: z.array(outputDescriptorSchema).min(1) }),
  z.object({
    mode: z.literal("value"),
    value: z.object({
      kind: z.enum(["number", "text", "time", "color", "palette", "password"]),
      copyable: z.boolean(),
      sensitive: z.boolean(),
    }),
  }),
]);
const limitContractSchema = z.object({
  profiles: z.array(z.enum(["pdf", "image", "batch", "video", "audio", "gif", "zip", "ocr", "utility"])).min(1),
  minimumFiles: z.number().int().nonnegative(),
  maximumFiles: z.number().int().nonnegative(),
  allowMixedKinds: z.boolean(),
});

export const capabilityManifestSchema = z.object({
  id: z.string().regex(/^[a-z]+\.[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(64),
  description: z.string().min(20).max(180),
  category: capabilityCategorySchema,
  aliases: z.array(z.string().min(2).max(48)).max(12),
  execution: z.literal("browser-worker"),
  workerFamily: z.enum(["pdf", "image", "media", "archive", "ocr", "utility"]),
  adapterKey: z.string().regex(/^[a-z]+\.[a-z0-9-]+$/),
  resultContract: resultContractSchema,
  releaseStatus: releaseStatusSchema,
  inputMode: z.enum(["files", "files-or-blank", "camera-or-files", "values"]),
  inputs: z.array(inputDescriptorSchema),
  result: resultDefinitionSchema,
  optionFields: z.array(optionFieldSchema).min(1),
  limits: limitContractSchema,
  warningCodes: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  unsupportedCodes: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
  unsupportedMessage: z.string().min(20).max(180),
  browserRequirements: z.array(z.enum(["worker", "wasm", "canvas", "offscreen-canvas", "camera", "web-crypto"])).min(1),
  fixturePlan: fixturePlanSchema,
}).superRefine((manifest, context) => {
  const fileMode = manifest.inputMode !== "values";
  if (fileMode && manifest.inputs.length === 0) {
    context.addIssue({ code: "custom", path: ["inputs"], message: "File input mode requires a descriptor" });
  }
  if (!fileMode && manifest.inputs.length !== 0) {
    context.addIssue({ code: "custom", path: ["inputs"], message: "Value input mode cannot declare file descriptors" });
  }
  if (manifest.limits.minimumFiles > manifest.limits.maximumFiles) {
    context.addIssue({ code: "custom", path: ["limits"], message: "Minimum files exceeds maximum files" });
  }
});

export type CapabilityManifest = z.infer<typeof capabilityManifestSchema>;
export type CapabilityId = CapabilityManifest["id"];
export type CapabilityCategory = z.infer<typeof capabilityCategorySchema>;
export type FileKind = z.infer<typeof fileKindSchema>;
export type ProbeRule = z.infer<typeof probeRuleSchema>;
```

- [ ] **Step 4: Enter all manifests from the approved matrix**

Create one frozen array per family. Transcribe each row from spec Sections 17.1–17.6; set `releaseStatus: "planned"`, `execution: "browser-worker"`, `adapterKey` equal to the capability ID until a later wave binds its loader, and `browserRequirements` beginning with `worker`. Use `files`, `files-or-blank`, `camera-or-files`, or `values` as the exact input mode. Encode every accepted file input as a typed descriptor with MIME list, extension list, and probe rule; value-only utilities use an empty descriptor array and express their values through `optionFields`. Use result mode `files` for generated downloads, `selected-entries` for ZIP extraction with safe local names, and `value` for Unit, Time, Password, Color Picker, and Color Extractor. Value definitions must mark Password as `sensitive: true`; the other value tools are not sensitive. Encode file outputs with one MIME, one extension, and explicit fallback behavior. Encode every option and default shown in the matrix as `optionFields`; an option that requires an explicit user choice uses `defaultValue: null` and `required: true`. Assign typed limit profiles plus exact minimum/maximum file cardinality and mixed-kind behavior; value-only utilities use the `utility` profile and `0/0` file cardinality. Assign normalized unsupported codes, fixed unsupported copy, and seven fixture IDs prefixed by the capability ID. Use exactly these IDs, in this order, to make omissions reviewable:

```text
pdf.merge, pdf.merge-image, pdf.split, pdf.compress, pdf.add-content, pdf.annotate,
pdf.organize, pdf.rotate, pdf.crop, pdf.resize, pdf.delete-pages, pdf.extract-pages,
pdf.page-numbers, pdf.watermark, pdf.flatten, pdf.compare, pdf.scan, pdf.ocr,
pdf.forms, pdf.converter, pdf.to-image, pdf.to-jpg, pdf.to-text, pdf.html-to-pdf,
pdf.image-to-pdf, pdf.heic-to-pdf, pdf.text-to-pdf,
image.converter, image.to-jpg, image.jpg-to-modern, image.to-png, image.to-webp,
image.webp-to-jpg, image.webp-to-png, image.jfif-to-png, image.heic-to-jpg,
image.heic-to-png, image.png-to-svg, image.svg-converter, image.html-to-image,
image.compress, image.compress-jpeg, image.compress-png, image.compress-webp,
image.compress-bmp, image.resize, image.crop, image.circle-crop, image.rotate,
image.flip, image.merge, image.enlarge, image.photo-editor, image.meme,
image.color-picker, image.watermark, image.color-extractor, image.signature-resize,
media.compress-video, media.compress-mp3, media.compress-wav, media.video-converter,
media.audio-converter, media.mp3-converter, media.mp4-converter, media.mp4-to-mp3,
media.video-to-mp3, media.mov-to-mp4, media.mp3-to-ogg, media.crop-video,
media.trim-video,
gif.compress, gif.make, gif.video-to-gif, gif.mp4-to-gif, gif.webm-to-gif,
gif.apng-to-gif, gif.to-mp4, gif.to-apng, gif.mov-to-gif, gif.avi-to-gif,
gif.to-images,
archive.zip-create, archive.zip-extract, utility.unit, utility.time,
utility.barcode, utility.password,
trust.sign-pdf, trust.blur-faces
```

Use the canonical route without its leading slash as `slug`. For `pdf.to-image`, for example, use `slug: "pdf-to-image"`. Copy titles, exact input/output descriptors, contract, options/defaults, limits/cardinality, browser requirements, applicable warnings, and unsupported states from the normative matrix; do not add excluded formats. Use fixture IDs such as `pdf.merge/minimum-valid` and `pdf.merge/cleanup`; Wave 1 supplies the corresponding files before changing that manifest to `active`.

Create and commit the Vitest inline snapshot of the normalized compatibility projection `{ id, inputMode, inputs, result, limits }` for all 90 entries. Add direct assertions that `image.converter` includes BMP/HEIC/safe-SVG input, `image.html-to-image` includes sanitized HTML, `media.audio-converter` includes AAC/M4A/FLAC, `gif.apng-to-gif` includes APNG, `pdf.text-to-pdf` includes UTF-8 text, and Unit/Time/Password/Color tools use value results. Assert ZIP Extractor uses `selected-entries` and declares both `{ kind: "binary", mimeType: "application/octet-stream", extension: "preserve" }` for arbitrary safe entries and `{ kind: "zip", mimeType: "application/zip", extension: ".zip" }` for the selected-entry bundle. Snapshot review is the manifest-to-matrix compatibility gate; a format change produces a deliberate spec-review diff.

- [ ] **Step 5: Implement aggregate validation, lookup, and option parsing**

Create `index.ts`:

```ts
import { capabilityManifestSchema, type CapabilityManifest } from "./schema";
import { pdfCapabilities } from "./registry/pdf";
import { imageCapabilities } from "./registry/image";
import { mediaCapabilities } from "./registry/media";
import { gifCapabilities } from "./registry/gif";
import { utilityCapabilities } from "./registry/utility";
import { trustCapabilities } from "./registry/trust";

export function assertValidRegistry(input: readonly unknown[]): readonly CapabilityManifest[] {
  const parsed = input.map((item) => capabilityManifestSchema.parse(item));
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) throw new Error("Duplicate capability id");
  if (new Set(parsed.map((item) => item.slug)).size !== parsed.length) throw new Error("Duplicate capability slug");
  return Object.freeze(parsed);
}

export const capabilityRegistry = assertValidRegistry(
  pdfCapabilities.concat(
    imageCapabilities,
    mediaCapabilities,
    gifCapabilities,
    utilityCapabilities,
    trustCapabilities,
  ),
);

export function getCapabilityBySlug(slug: string): CapabilityManifest | undefined {
  return capabilityRegistry.find((item) => item.slug === slug);
}
```

Implement `validateOptionValues` by starting from manifest defaults, rejecting unknown keys, checking required non-null choices, validating primitive type, enforcing `choices`, and enforcing inclusive `minimum`/`maximum` plus `step`. Return a new frozen record. The function must never coerce strings into numbers or booleans.

- [ ] **Step 6: Run the registry suite**

Run:

```powershell
npm test -- src/features/capabilities/registry.test.ts
npm run typecheck
```

Expected: PASS with exactly 90 manifests and the six approved category counts.

- [ ] **Step 7: Commit the registry**

```powershell
git add src/features/capabilities
git commit -m "feat: define launch capability registry"
```

---

### Task 3: Add deterministic search, categories, and release visibility

**Files:**
- Create: `src/features/capabilities/search.ts`
- Create: `src/features/capabilities/visibility.ts`
- Create: `src/features/capabilities/search.test.ts`
- Create: `src/features/capabilities/visibility.test.ts`

**Interfaces:**
- Consumes: `CapabilityManifest`, `CapabilityCategory`, and `capabilityRegistry` from Task 2.
- Produces: `normalizeSearchText(value)`, `searchCapabilities(query, manifests)`, and `getVisibleCapabilities(manifests, context)`.

- [ ] **Step 1: Write failing ranking and visibility tests**

```ts
import { capabilityRegistry } from "./index";
import { searchCapabilities } from "./search";
import { getVisibleCapabilities } from "./visibility";

test("ranks an exact title match before alias matches", () => {
  const results = searchCapabilities("PDF to JPG", capabilityRegistry);
  expect(results[0]?.id).toBe("pdf.to-jpg");
});

test("normalizes arrows, spacing, and case", () => {
  const results = searchCapabilities("  PDF ↔ IMAGE  ", capabilityRegistry);
  expect(results.some((item) => item.id === "pdf.to-image")).toBe(true);
});

test("production hides every planned capability", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "production", previewRequested: true })).toEqual([]);
});

test("preview review mode returns planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "preview", previewRequested: true })).toHaveLength(90);
});
```

- [ ] **Step 2: Run the focused tests and observe failure**

Run `npm test -- src/features/capabilities/search.test.ts src/features/capabilities/visibility.test.ts`.

Expected: FAIL because search and visibility functions do not exist.

- [ ] **Step 3: Implement normalization and stable scoring**

Implement `normalizeSearchText` using Unicode NFKD normalization, lowercase, arrow-to-space replacement, punctuation removal, and whitespace collapse. Score title exact match `100`, title prefix `80`, complete title token coverage `60`, alias exact `50`, alias token coverage `30`, and description token coverage `10`. Break ties by title using `localeCompare("en")` so server and browser ordering match.

- [ ] **Step 4: Implement environment-safe visibility**

Use this signature:

```ts
export type CatalogEnvironment = "local" | "preview" | "production";

export function getVisibleCapabilities(
  manifests: readonly CapabilityManifest[],
  context: { environment: CatalogEnvironment; previewRequested: boolean },
): readonly CapabilityManifest[] {
  return manifests.filter((item) => {
    if (item.releaseStatus === "active") return true;
    return item.releaseStatus === "planned" && context.environment !== "production" && context.previewRequested;
  });
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm test -- src/features/capabilities/search.test.ts src/features/capabilities/visibility.test.ts
npm run typecheck
git add src/features/capabilities
git commit -m "feat: add capability discovery rules"
```

Expected: tests and typecheck pass; commit succeeds.

---

### Task 4: Build the Bright Utility shell and accessible catalog

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/catalog/tool-search.tsx`
- Create: `src/components/catalog/category-filter.tsx`
- Create: `src/components/catalog/tool-card.tsx`
- Create: `src/components/catalog/tool-catalog.tsx`
- Create: `src/components/catalog/tool-catalog.test.tsx`

**Interfaces:**
- Consumes: visible `CapabilityManifest[]`, `searchCapabilities`, and category values.
- Produces: `<ToolCatalog capabilities={visibleCapabilities} previewMode={previewMode} />` and reusable Bright Utility primitives.

- [ ] **Step 1: Write failing catalog interaction tests**

Create `tool-catalog.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { capabilityRegistry } from "@/features/capabilities";
import { ToolCatalog } from "./tool-catalog";

test("filters the catalog without turning planned cards into links", async () => {
  const user = userEvent.setup();
  render(<ToolCatalog capabilities={capabilityRegistry} previewMode />);
  await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "pdf to jpg");
  expect(screen.getByText("PDF to JPG")).toBeVisible();
  expect(screen.queryByRole("link", { name: /pdf to jpg/i })).not.toBeInTheDocument();
  expect(screen.getByText(/in development/i)).toBeVisible();
});

test("announces the result count", () => {
  render(<ToolCatalog capabilities={capabilityRegistry.slice(0, 3)} previewMode />);
  expect(screen.getByRole("status")).toHaveTextContent("3 tools");
});
```

- [ ] **Step 2: Run the test and observe failure**

Run `npm test -- src/components/catalog/tool-catalog.test.tsx`.

Expected: FAIL because the catalog components do not exist.

- [ ] **Step 3: Create the design tokens**

Define tokens in `src/styles/tokens.css`:

```css
:root {
  --ink: #241b18;
  --paper: #fffaf5;
  --surface: #ffffff;
  --coral: #ff6f59;
  --blue: #3186ca;
  --lime: #9ed455;
  --yellow: #f0ca38;
  --purple: #8c6bdd;
  --muted: #76655e;
  --line: 1.5px solid var(--ink);
  --radius-sm: 0.75rem;
  --radius-md: 1rem;
  --shadow-hard: 4px 4px 0 var(--ink);
  --focus-ring: 0 0 0 3px #ffffff, 0 0 0 6px #236da6;
}
```

Add reset, readable type scale, skip-link, focus-visible, 44×44 px target minimum, reduced-motion rule, and responsive container rules to `globals.css`. Do not load a third-party font.

- [ ] **Step 4: Implement the catalog components**

Use a client component only for search/filter state. Render active manifests as links to `/tools/{slug}`. Render planned manifests as noninteractive cards with an `In development` badge. Use a native search input, native buttons for category filters, a polite `role="status"` result count, and an empty state with a clear-filter button.

- [ ] **Step 5: Wire server-side visibility into the homepage**

In `src/app/page.tsx`, derive environment as follows:

```ts
const environment = process.env.VERCEL_ENV === "production"
  ? "production"
  : process.env.VERCEL_ENV === "preview"
    ? "preview"
    : "local";
const previewRequested = process.env.CATALOG_PREVIEW === "1" || environment === "local";
```

Pass `getVisibleCapabilities(capabilityRegistry, { environment, previewRequested })` to `ToolCatalog`. Keep the privacy promise and search heading above the catalog.

- [ ] **Step 6: Verify accessibility-oriented behavior**

Run:

```powershell
npm test -- src/components/catalog/tool-catalog.test.tsx src/app/page.test.tsx
npm run lint
npm run typecheck
```

Expected: all checks pass and planned cards have no link in component tests.

- [ ] **Step 7: Commit the catalog shell**

```powershell
git add src/app src/styles src/components/ui src/components/catalog
git commit -m "feat: build searchable Bright Utility catalog"
```

---

### Task 5: Implement universal limit and file-signature validation

**Files:**
- Create: `src/features/validation/types.ts`
- Create: `src/features/validation/limits.ts`
- Create: `src/features/validation/signatures.ts`
- Create: `src/features/validation/validate.ts`
- Create: `src/features/validation/capability-validator.ts`
- Create: `src/features/validation/limits.test.ts`
- Create: `src/features/validation/signatures.test.ts`
- Create: `src/features/validation/capability-validator.test.ts`
- Create: `src/test/fixtures/headers.ts`

**Interfaces:**
- Consumes: browser `File` metadata and adapter-produced `FileProbe` metadata.
- Produces: `UNIVERSAL_LIMITS`, `detectSignature(bytes)`, `validateBatch(files)`, `validateProbe(probe, manifest)`, `ProbeAndValidateAdapter`, and `CapabilityValidator` with cheap and adapter-assisted phases.

- [ ] **Step 1: Define the probe and issue types in the failing tests**

Tests consume this contract:

```ts
import type { FileKind, ProbeRule } from "@/features/capabilities/schema";

export type SignatureDetection = {
  kind: FileKind | "unknown";
  probeRule: ProbeRule | "unknown";
  confidence: "exact" | "candidate" | "none";
};

export type FileProbe = {
  kind: FileKind | "unknown";
  probeRule: ProbeRule | "unknown";
  bytes: number;
  pages?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  frames?: number;
  expandedBytes?: number;
  archiveEntries?: number;
  archiveDepth?: number;
};

export type ValidationIssue = {
  code: "unsupported-format" | "limit-exceeded" | "malformed-input" | "device-capability";
  field: string;
  measured?: number;
  limit?: number;
  message: string;
};

export interface ProbeAndValidateAdapter<
  TOptions extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  probe(input: File): Promise<FileProbe>;
  validate(inputs: readonly File[], options: TOptions): Promise<readonly ValidationIssue[]>;
}

export interface CapabilityValidator {
  validateCheap(
    capability: CapabilityManifest,
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
  ): Promise<readonly ValidationIssue[]>;
  validateWithAdapter(
    capability: CapabilityManifest,
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
    adapter: ProbeAndValidateAdapter<Readonly<Record<string, unknown>>>,
  ): Promise<readonly ValidationIssue[]>;
}
```

Write boundary tests for PDF bytes/pages, image bytes/pixels, batch count/aggregate bytes, video duration/dimensions, audio duration, GIF duration/dimensions, ZIP compressed/expanded/entries/depth, and OCR count. Each family gets one at-limit PASS and one one-unit-over FAIL assertion.

- [ ] **Step 2: Add signature fixtures and failing detection tests**

Create byte fixtures for `%PDF-`, JPEG `FF D8 FF`, PNG signature, BMP `BM`, `RIFF` followed by a four-byte size and `WEBP`, GIF87a/GIF89a, ZIP local header, ISO-BMFF `ftyp` brands for HEIC/MP4/MOV/M4A, EBML WebM, RIFF AVI/WAV, `ID3` and MPEG-frame MP3, `OggS`, AAC ADTS, and `fLaC`. Assert declared MIME never overrides a conflicting detected kind. A PNG header returns a `candidate` PNG detection because APNG requires later chunk inspection; UTF-8 text, sanitized HTML, and sanitized SVG are validated by their declared manifest probe rule rather than guessed from a short header.

- [ ] **Step 3: Run validation tests and observe failure**

Run `npm test -- src/features/validation`.

Expected: FAIL because validators do not exist.

- [ ] **Step 4: Implement immutable exact limits**

```ts
export const UNIVERSAL_LIMITS = Object.freeze({
  pdf: { bytes: 25 * 1024 * 1024, pages: 100 },
  image: { bytes: 20 * 1024 * 1024, pixels: 40_000_000 },
  batch: { files: 20, bytes: 100 * 1024 * 1024 },
  video: { bytes: 50 * 1024 * 1024, durationSeconds: 180, width: 1920, height: 1080 },
  audio: { bytes: 50 * 1024 * 1024, durationSeconds: 900 },
  gif: { bytes: 25 * 1024 * 1024, durationSeconds: 30, width: 1280, height: 720 },
  zip: { compressedBytes: 75 * 1024 * 1024, expandedBytes: 200 * 1024 * 1024, entries: 1000, depth: 10 },
  ocr: { items: 20 },
} as const);
```

Implement validators as pure functions. Return every cheaply knowable issue in stable field order. Never include `File.name` in `message`.

- [ ] **Step 5: Implement magic-byte detection**

Read at most the first 32 bytes for initial detection and return `SignatureDetection`. Return `unknown`/`none` for ambiguity and let the manifest-selected family adapter perform deeper probing later. Do not infer a kind from the extension. `validateProbe` compares the adapter's final kind and probe rule against the selected capability's typed input descriptors, so BMP, SVG, HTML, TXT, APNG, AAC, M4A, and FLAC remain representable without broadening the raw-header detector into a parser. `opaque-local-file` is permitted only for `archive.zip-create`; it intentionally performs no format claim and still enforces batch, aggregate-byte, safe-name, and archive-output rules.

- [ ] **Step 6: Implement and test the two-phase validator facade**

Before verification, implement `CapabilityValidator` with this exact order:

1. `validateOptionValues(capability, options)`; convert fixed option errors to `ValidationIssue`.
2. Enforce file cardinality, aggregate bytes, and value-only/file-mode rules.
3. Read short signatures and compare exact detections with the manifest input descriptors.
4. Stop and return cheap issues without loading an adapter.
5. For the adapter-assisted phase, call `adapter.probe()` for every file.
6. Run `validateProbe()` against typed kind/probe descriptors and universal limit profiles.
7. Run `adapter.validate()` for codec/parser/capability-specific checks.
8. Return a stable de-duplicated issue list; do not create a worker.

In `capability-validator.test.ts`, create a file named `picture.png` whose bytes are JPEG. Assert `validateCheap()` returns `unsupported-format`, `adapter.probe` is not called for the exact mismatch, and no worker/controller exists in this layer. Create an ISO-BMFF candidate that requires deep probing and assert the adapter phase determines HEIC versus MP4 before acceptance.

- [ ] **Step 7: Verify and commit validation**

```powershell
npm test -- src/features/validation
npm run typecheck
git add src/features/validation src/test/fixtures
git commit -m "feat: enforce universal input limits"
```

Expected: every boundary and signature test passes.

---

### Task 6: Implement normalized errors and the pure job state machine

**Files:**
- Create: `src/features/jobs/types.ts`
- Create: `src/features/jobs/errors.ts`
- Create: `src/features/jobs/reducer.ts`
- Create: `src/features/jobs/reducer.test.ts`
- Create: `src/features/jobs/errors.test.ts`

**Interfaces:**
- Consumes: `ValidationIssue` and serializable worker responses.
- Produces: `JobState`, `JobAction`, `jobReducer(state, action)`, `NormalizedJobError`, and `normalizeJobError(value)`.

- [ ] **Step 1: Write failing transition tests**

Use these states:

```ts
export type JobPhase = "idle" | "validating" | "ready" | "loading-engine" | "processing" | "success" | "success-with-warnings" | "failure" | "cancelled" | "cleanup";

export type JobState = {
  phase: JobPhase;
  progress: number | null;
  stageLabel: string | null;
  warnings: readonly string[];
  error: NormalizedJobError | null;
  result: JobResultMetadata | null;
};

export type JobResultMetadata = {
  resultMode: "files" | "selected-entries" | "value";
  outputMimeTypes: readonly string[];
  outputBytes: readonly number[];
  pages?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  frames?: number;
};

export type JobAction =
  | { type: "start-validation" }
  | { type: "validation-passed" }
  | { type: "engine-loading"; stageLabel: string }
  | { type: "processing-started"; stageLabel: string }
  | { type: "progress"; value: number | null; stageLabel: string }
  | { type: "warning"; code: string }
  | { type: "succeeded"; result: JobResultMetadata }
  | { type: "failed"; error: NormalizedJobError }
  | { type: "cancelled" }
  | { type: "cleanup-started" }
  | { type: "cleaned" };
```

Assert the full happy path, success-with-warning path, validation failure, cooperative cancellation, hard cancellation, retry-to-validating, and cleanup-to-idle. Assert an impossible transition such as `idle -> success` throws `Invalid job transition` in development/test.

- [ ] **Step 2: Write failing error-sanitization tests**

Pass an `Error("C:\\Users\\person\\secret.pdf failed")` and assert the normalized output contains only a fixed code, fixed public message, retryability, and source phase. Assert neither `secret.pdf` nor the original message survives serialization.

- [ ] **Step 3: Run focused tests and observe failure**

Run `npm test -- src/features/jobs`.

Expected: FAIL because reducer and normalizer do not exist.

- [ ] **Step 4: Implement the closed error vocabulary**

```ts
export type JobErrorCode =
  | "unsupported-format"
  | "limit-exceeded"
  | "encrypted-or-corrupt"
  | "device-capability"
  | "engine-load-failed"
  | "conversion-failed"
  | "cancelled";

export type NormalizedJobError = {
  code: JobErrorCode;
  publicMessage: string;
  retryable: boolean;
  phase: JobPhase;
};
```

Map known internal tagged errors to fixed public strings. Map unknown values to `conversion-failed`. Never copy an unknown message, stack, filename, or object property.

- [ ] **Step 5: Implement the reducer transition table**

Represent allowed transitions as a typed map, update progress only during `loading-engine` or `processing`, clamp determinate progress to `0..1`, and use `null` for indeterminate stages. Enter `cleanup` after every terminal phase before returning to `idle`.

- [ ] **Step 6: Verify and commit**

```powershell
npm test -- src/features/jobs
npm run typecheck
git add src/features/jobs
git commit -m "feat: add converter job state machine"
```

---

### Task 7: Define the worker protocol and cancellable job controller

**Files:**
- Create: `src/features/workers/protocol.ts`
- Create: `src/features/workers/adapter.ts`
- Create: `src/features/workers/router.ts`
- Create: `src/features/workers/router.test.ts`
- Create: `src/features/jobs/controller.ts`
- Create: `src/features/jobs/controller.test.ts`
- Create: `src/test/fakes/fake-worker.ts`

**Interfaces:**
- Consumes: `JobAction`, `JobResultMetadata`, `NormalizedJobError`, `FileProbe`, `CapabilityManifest`.
- Produces: `EngineAdapter`, `WorkerRequest`, `WorkerResponse`, `WorkerLike`, `EngineRouter`, and `BrowserJobController` with `run()`, `cancel()`, and `dispose()`.

- [ ] **Step 1: Write failing controller behavior tests**

Test that the controller:

- emits `loading-engine` before `processing`;
- forwards determinate progress;
- uses stage labels for indeterminate progress;
- resolves once for `result`;
- posts cooperative `cancel` first;
- calls `terminate()` if no `cancelled` response arrives within 250 ms in tests;
- ignores stale messages from a prior job ID;
- disposes the worker after terminal cleanup.

- [ ] **Step 2: Define the serializable protocol**

```ts
export type WorkerRequest =
  | { type: "initialize"; jobId: string; capabilityId: string }
  | { type: "process"; jobId: string; inputs: readonly File[]; options: Readonly<Record<string, unknown>> }
  | { type: "cancel"; jobId: string }
  | { type: "dispose"; jobId: string };

export type WorkerResponse =
  | { type: "ready"; jobId: string }
  | { type: "progress"; jobId: string; value: number | null; stageLabel: string }
  | { type: "warning"; jobId: string; code: string }
  | { type: "result"; jobId: string; result: LocalWorkerResult }
  | { type: "failure"; jobId: string; code: string }
  | { type: "cancelled"; jobId: string }
  | { type: "disposed"; jobId: string };

export type LocalOutput = {
  blob: Blob;
  suggestedDownloadName?: string;
};

export type LocalValuePayload =
  | { kind: "number"; display: string; numericValue: number; unit?: string }
  | { kind: "text"; text: string }
  | { kind: "time"; display: string; iso: string; zone: string; utcOffset: string }
  | { kind: "color"; hex: string; rgb: string; hsl: string }
  | { kind: "palette"; colors: readonly { hex: string; proportion: number }[] }
  | { kind: "password"; value: string };

export type LocalResultPayload =
  | { mode: "files"; outputs: readonly LocalOutput[] }
  | { mode: "selected-entries"; outputs: readonly LocalOutput[] }
  | { mode: "value"; value: LocalValuePayload };

export type LocalWorkerResult = LocalResultPayload & {
  metadata: JobResultMetadata;
};
```

The worker never sends a source-device path, raw exception, extracted document text, or preview payload outside local result objects. `suggestedDownloadName` is optional, local-only, and used only when an output contract must preserve a safe archive entry name; it is never passed to telemetry or server code. Value payloads remain inside the runner and result UI; password, time, color, palette, and converted values are excluded from `JobState`, telemetry, logs, and server data.

- [ ] **Step 3: Define the adapter interface**

```ts
export interface EngineAdapter<TOptions extends Readonly<Record<string, unknown>>>
  extends ProbeAndValidateAdapter<TOptions> {
  createWorker(): WorkerLike;
}
```

Define `WorkerLike` with the exact surface used by `BrowserJobController` so tests need no real Worker:

```ts
export type WorkerMessageListener = (event: MessageEvent<WorkerResponse>) => void;

export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  addEventListener(type: "message", listener: WorkerMessageListener): void;
  removeEventListener(type: "message", listener: WorkerMessageListener): void;
  terminate(): void;
}
```

- [ ] **Step 4: Run tests and observe failure**

Run `npm test -- src/features/jobs/controller.test.ts src/features/workers/router.test.ts`.

Expected: FAIL because the controller and engine router are not implemented.

- [ ] **Step 5: Implement the lazy engine router**

Use these interfaces:

```ts
export type AdapterLoader = () => Promise<EngineAdapter<Readonly<Record<string, unknown>>>>;

export class EngineRouter {
  register(adapterKey: string, loader: AdapterLoader): void;
  load(adapterKey: string): Promise<EngineAdapter<Readonly<Record<string, unknown>>>>;
  has(adapterKey: string): boolean;
}
```

Reject duplicate registrations, reject unknown keys with `engine-load-failed`, call no loader during registration, and cache one resolved adapter promise per key. If a load rejects, remove that rejected promise so an explicit user retry can invoke the loader again. Wave 0 constructs an empty router in production because every manifest is planned.

- [ ] **Step 6: Implement controller ownership and cancellation**

The controller creates a cryptographically random job ID with `crypto.randomUUID()`, owns exactly one worker, accepts a dispatch callback `(action: JobAction) => void`, removes listeners during disposal, and rejects concurrent runs with a normalized fixed error. Use this public method:

```ts
run(request: {
  capabilityId: string;
  inputs: readonly File[];
  options: Readonly<Record<string, unknown>>;
}): Promise<LocalWorkerResult>;
```

The controller dispatches loading, processing, progress, warning, and cancellation stages but never places `Blob` objects in `JobState`. It resolves `LocalWorkerResult` exactly once when the worker emits `result`; the composition layer in Task 8 creates managed URLs before dispatching `succeeded`. Cancellation timeout is injectable and defaults to 1,000 ms in production.

- [ ] **Step 7: Verify and commit**

```powershell
npm test -- src/features/jobs/controller.test.ts src/features/workers/router.test.ts
npm run typecheck
git add src/features/workers src/features/jobs/controller.ts src/features/jobs/controller.test.ts src/test/fakes
git commit -m "feat: add cancellable worker job controller"
```

---

### Task 8: Own result URLs and deterministic cleanup

**Files:**
- Create: `src/features/results/result-manager.ts`
- Create: `src/features/results/result-manager.test.ts`
- Create: `src/features/jobs/workspace-runner.ts`
- Create: `src/features/jobs/workspace-runner.test.ts`

**Interfaces:**
- Consumes: `BrowserJobController`, local `LocalWorkerResult`, local `LocalOutput[]`, non-content `JobResultMetadata`, and validation functions.
- Produces: `ManagedResult`, `ResultManager.create(capability, localResult)`, `ResultManager.dispose(resultId)`, `ResultManager.disposeAll()`, `WorkspaceJobRunner`, and `createWorkspaceJobRunner(dependencies)`.

- [ ] **Step 1: Write failing URL-lifecycle tests**

Mock `URL.createObjectURL` and `URL.revokeObjectURL`. Assert one URL per output, exact-once revocation, safe repeated disposal, replacement cleanup, and `disposeAll()` cleanup. Assert normal conversions receive generated labels such as `output-1.pdf`. Assert an archive entry suggestion such as `folder/report.txt` is reduced to safe basename `report.txt`, while drive prefixes, traversal, control characters, empty names, reserved Windows names, and names longer than 120 characters fall back to a generated label.

- [ ] **Step 2: Run the test and observe failure**

Run `npm test -- src/features/results/result-manager.test.ts`.

Expected: FAIL because `ResultManager` does not exist.

- [ ] **Step 3: Implement result ownership**

```ts
export type ManagedOutput = {
  url: string;
  mimeType: string;
  bytes: number;
  downloadName: string;
};

export type ManagedResult =
  | { id: string; mode: "files" | "selected-entries"; outputs: readonly ManagedOutput[]; metadata: JobResultMetadata }
  | { id: string; mode: "value"; value: LocalValuePayload; metadata: JobResultMetadata };

export class ResultManager {
  create(capability: CapabilityManifest, result: LocalWorkerResult): ManagedResult;
  dispose(resultId: string): void;
  disposeAll(): void;
}
```

Before creating any URL or retaining any value, require `result.mode === capability.result.mode` and `result.metadata.resultMode === result.mode`. For `value`, require the local value discriminant to equal `capability.result.value.kind`. For file-bearing modes, require at least one output, equal metadata MIME/byte array lengths, every `Blob.type` to match a declared descriptor MIME, and every metadata MIME/byte value to match the corresponding Blob.

For `files` and `selected-entries`, keep blobs and URLs in a private map. Generate names from output index and MIME-to-extension mapping unless a local output includes an allowed `suggestedDownloadName`; sanitize that suggestion to one safe basename. Reject unknown output MIME types unless the capability's declared output descriptor is opaque `binary` with extension behavior `preserve`. Allow `suggestedDownloadName` only when result mode is `selected-entries` and the matched output descriptor is `{ kind: "binary", extension: "preserve" }`; reject it for ordinary generated outputs.

For `value`, create no Blob and no object URL. Store the discriminated local value under the result ID so disposal removes the manager's reference; `ManagedResult` returns the value for local rendering/copy. Never serialize, persist, or send a value result through telemetry. Tests cover Unit number, Time, Password, Color Picker, Color Extractor palette, ordinary file output, and ZIP selected entries.

- [ ] **Step 4: Implement the workspace runner bridge and its integration test**

Before verification, define the single worker-to-UI bridge:

```ts
export interface WorkspaceJobRunner {
  subscribe(listener: (state: JobState) => void): () => void;
  validateInputs(
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
  ): Promise<readonly ValidationIssue[]>;
  run(files: readonly File[], options: Readonly<Record<string, unknown>>): Promise<ManagedResult>;
  cancel(): void;
  disposeResult(resultId: string): void;
  dispose(): void;
}

export function createWorkspaceJobRunner(dependencies: {
  capability: CapabilityManifest;
  validator: CapabilityValidator;
  router: EngineRouter;
  results: ResultManager;
  createController: (
    adapter: EngineAdapter<Readonly<Record<string, unknown>>>,
    dispatch: (action: JobAction) => void,
  ) => BrowserJobController;
}): WorkspaceJobRunner;
```

`validateInputs()` runs `validator.validateCheap()` only, so extension/header/cardinality/options failures appear before engine loading. `run()` repeats the cheap phase, returns without router loading when issues exist, dispatches `engine-loading`, awaits `router.load(capability.adapterKey)`, runs `validator.validateWithAdapter()`, and creates the controller only after deep validation passes. It then disposes the prior managed result, awaits `controller.run()`, immediately calls `results.create(capability, localResult)`, drops its raw result references, dispatches `succeeded` with metadata only, and resolves the discriminated `ManagedResult`. On result-contract mismatch or another failure it disposes partial results and dispatches one normalized failure. `disposeResult()` delegates to the manager; `dispose()` cancels/disposes the current controller and calls `disposeAll()`.

In `workspace-runner.test.ts`, first pass a `.png`-named file with JPEG bytes. Assert `validateInputs()` returns `unsupported-format`, `router.load`, adapter probe, `createController`, and worker creation remain uncalled. Then pass an exact cheap signature but a deep probe that conflicts with the manifest; assert the router and probe run but controller creation remains uncalled. Finally use a valid fake file result containing a unique Blob marker. Assert the marker and raw Blob never appear in subscribed `JobState` or the public `ManagedResult`; the object URL stays valid until explicit replacement/disposal and is revoked exactly once on replacement and runner disposal. Return number, time, password, color, palette, and selected-entry results and assert each retains its discriminant, creates URLs only for file-bearing modes, and becomes unreachable from the manager after disposal. Add rejection tests for a file capability returning `value`, a value capability returning `files`, metadata mode mismatch, undeclared Blob MIME, metadata size mismatch, and a suggested filename on a non-selected-entry result.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- src/features/results/result-manager.test.ts src/features/jobs/workspace-runner.test.ts
npm run typecheck
git add src/features/results src/features/jobs/workspace-runner.ts src/features/jobs/workspace-runner.test.ts
git commit -m "feat: manage local conversion results"
```

---

### Task 9: Enforce a closed privacy-safe telemetry schema

**Files:**
- Create: `src/features/telemetry/events.ts`
- Create: `src/features/telemetry/sanitize.ts`
- Create: `src/features/telemetry/sanitize.test.ts`
- Create: `scripts/check-privacy-boundary.mjs`
- Create: `scripts/check-privacy-boundary.test.mjs`
- Create: `scripts/fixtures/privacy/allowed-metadata-route.ts`
- Create: `scripts/fixtures/privacy/forbidden-file-route.ts`
- Create: `scripts/fixtures/privacy/forbidden-import-route.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: capability ID, lifecycle stage, coarse duration/device buckets, normalized error code, app version, engine version.
- Produces: `TelemetryEvent`, `buildTelemetryEvent(input)`, and npm script `check:privacy`.

- [ ] **Step 1: Write failing telemetry allowlist tests**

```ts
test("drops content-derived and free-form fields", () => {
  const event = buildTelemetryEvent({
    capabilityId: "pdf.merge",
    stage: "failure",
    durationBucket: "1-5s",
    deviceClass: "desktop",
    errorCode: "conversion-failed",
    appVersion: "0.1.0",
    engineVersion: "none",
    filename: "private.pdf",
    message: "C:\\secret\\private.pdf failed",
  } as never);
  const serialized = JSON.stringify(event);
  expect(serialized).not.toContain("private.pdf");
  expect(serialized).not.toContain("secret");
});
```

Also assert that exact byte counts, dimensions, durations, page counts, OCR text, hashes, URLs, and raw exceptions cannot appear in the returned object.

Add an integration case that feeds the metadata-only subscribed state produced by `createWorkspaceJobRunner` into the telemetry mapping. Assert a fake worker Blob marker, object URL, output byte count, generated download name, converted number, time string, password, color value, and palette do not appear in the event. This is the telemetry half of the Task 8 ownership test.

- [ ] **Step 2: Run the test and observe failure**

Run `npm test -- src/features/telemetry/sanitize.test.ts`.

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement the closed event type**

```ts
export type TelemetryEvent = {
  capabilityId: string;
  stage: "validating" | "loading-engine" | "processing" | "success" | "warning" | "failure" | "cancelled";
  durationBucket: "<1s" | "1-5s" | "5-30s" | "30-120s" | ">120s";
  deviceClass: "mobile" | "tablet" | "desktop";
  errorCode?: JobErrorCode;
  appVersion: string;
  engineVersion: string;
};
```

Construct a new object by reading only these keys. Never spread caller input. Validate capability IDs against the registry and values against closed sets.

- [ ] **Step 4: Establish the compile-time server/client boundary**

Run `npm install client-only@latest server-only@latest`. Add `import "client-only";` to `src/features/workers/protocol.ts`, `adapter.ts`, `router.ts`, `src/features/jobs/controller.ts`, `src/features/results/result-manager.ts`, and future `src/engines` entry points. Keep server code only in `src/app/**/route.ts`, files containing a top-level `"use server"` directive, and `src/server/**`; every `src/server/**` entry imports `server-only`.

Server-rendered pages may import the serializable capability registry, search, visibility, and metadata helpers. They may not import worker/job-controller/result/engine modules or pass `File`, `Blob`, binary buffers, extracted content, or preview data to a server component or action.

- [ ] **Step 5: Add the privacy-boundary import-graph and binary-flow scan**

The Node script uses the installed TypeScript compiler API rather than regular expressions to parse imports, directives, identifiers, property calls, and constructor calls. It discovers every `src/app/**/route.{ts,tsx,js,jsx}`, every source file with top-level `"use server"`, and every `src/server/**/*.{ts,tsx,js,jsx}`. Starting from those roots, it resolves relative and `@/` static imports plus literal dynamic imports and traverses their local import graph.

Fail the scan when any reachable server file:

- imports from `src/features/workers`, `src/features/jobs/controller`, `src/features/jobs/workspace-runner`, `src/features/results`, `src/components/workspace`, or `src/engines`;
- uses browser/binary request primitives `File`, `Blob`, `FileReader`, `FormData`, `ReadableStream`, `ArrayBuffer`, typed-array constructors, Node `Buffer`, `request.arrayBuffer()`, `request.blob()`, or `request.formData()`;
- contains forbidden persisted/telemetry identifiers `filename`, `fileName`, `filePath`, `fileHash`, `ocrText`, `previewData`, `outputBytes`, `archiveEntryName`, or `conversionHistory`;
- imports a module marked `client-only`.

The scanner also checks production telemetry source files against the forbidden identifiers and rejects object spread in `buildTelemetryEvent`; test files and the scanner's fixture directory are excluded from the production identifier scan but are still used as explicit scanner inputs in its Node tests.

`allowed-metadata-route.ts` accepts JSON containing only `favoriteCapabilityId` and a preset option record and must pass. `forbidden-file-route.ts` reads `request.formData()` and a `Blob` and must fail. `forbidden-import-route.ts` imports the result manager through a two-hop local helper and must fail. This proves the rule follows imports instead of checking one directory name.

Add scripts:

```json
{
  "check:privacy": "node scripts/check-privacy-boundary.mjs",
  "verify": "npm run lint && npm run typecheck && npm run test && npm run check:privacy && npm run build"
}
```

- [ ] **Step 6: Verify and commit**

```powershell
npm test -- src/features/telemetry/sanitize.test.ts
node --test scripts/check-privacy-boundary.test.mjs
npm run check:privacy
npm run typecheck
git add src/features/telemetry src/features/workers src/features/jobs/controller.ts src/features/results scripts package.json package-lock.json
git commit -m "feat: enforce privacy-safe telemetry"
```

---

### Task 10: Build the injected, accessible tool-workspace UI

**Files:**
- Create: `src/components/workspace/drop-zone.tsx`
- Create: `src/components/workspace/job-progress.tsx`
- Create: `src/components/workspace/job-error.tsx`
- Create: `src/components/workspace/result-panel.tsx`
- Create: `src/components/workspace/tool-workspace.tsx`
- Create: `src/components/workspace/tool-workspace.test.tsx`

**Interfaces:**
- Consumes: one `CapabilityManifest`, `JobState`, `ManagedResult`, and `WorkspaceJobRunner` from Task 8.
- Produces: `<ToolWorkspace capability={capability} runner={runner} />`, shared by every future active tool route.

- [ ] **Step 1: Import and enforce the injected runner boundary**

Import `WorkspaceJobRunner` from `@/features/jobs/workspace-runner`. The component never imports an engine adapter, controller, worker, raw Blob result, or ResultManager directly. It stores only `JobState` plus the returned `ManagedResult` URLs/metadata.

- [ ] **Step 2: Write failing component lifecycle tests**

Use a fake runner and assert:

- file picker works without drag-and-drop;
- input `accept` reflects manifest kinds;
- file selection calls `runner.validateInputs(files, currentOptions)` before enabling Run;
- validation issues are listed and focus moves to the summary;
- progress uses `role="progressbar"` only when determinate;
- indeterminate progress uses a polite status label;
- cancel is present only while loading/processing;
- warnings remain visible with success;
- download links use managed object URLs;
- number, text, time, color, palette, and password value results render without invented downloads;
- password value clears from component state on replacement and unmount;
- selected-entry results render safe individual download names;
- starting another job calls result disposal;
- unmount calls runner disposal;
- a fake worker Blob marker never appears in rendered DOM or component state assertions;
- status is not communicated through color alone.

- [ ] **Step 3: Run the component test and observe failure**

Run `npm test -- src/components/workspace/tool-workspace.test.tsx`.

Expected: FAIL because workspace components do not exist.

- [ ] **Step 4: Implement small state-specific components**

Keep file selection in `DropZone`, determinate/indeterminate display in `JobProgress`, actionable fixed messages in `JobError`, and discriminated file/value/selected-entry rendering in `ResultPanel`. `ToolWorkspace` coordinates them and owns no engine-specific options. Reserve an `options` render prop for Wave adapters:

```ts
export type ToolWorkspaceProps = {
  capability: CapabilityManifest;
  runner: WorkspaceJobRunner;
  renderOptions?: (context: { disabled: boolean }) => React.ReactNode;
};
```

Starting another job and component unmount call `runner.disposeResult(currentResult.id)` before clearing the managed result from React state. Final unmount then calls `runner.dispose()`.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- src/components/workspace/tool-workspace.test.tsx
npm run lint
npm run typecheck
git add src/components/workspace
git commit -m "feat: add accessible conversion workspace"
```

---

### Task 11: Add active-only routes, metadata, sitemap, and security headers

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/app/tools/[slug]/page.tsx`
- Create: `src/app/tools/[slug]/page.test.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/sitemap.test.ts`
- Create: `src/app/robots.ts`
- Modify: `next.config.ts`
- Create: `src/lib/security-headers.test.ts`

**Interfaces:**
- Consumes: capability lookup and release visibility.
- Produces: active-only static params, canonical metadata, sitemap entries, robots policy, and fixed security headers.

- [ ] **Step 1: Write failing active-only route tests**

Assert `generateStaticParams()` returns no rows while all manifests are planned. Pass a locally constructed active manifest to metadata helpers and assert canonical `/tools/{slug}`, title, description, and no conversion claim beyond the manifest. Assert sitemap includes homepage plus active capabilities only.

- [ ] **Step 2: Write failing security-header tests**

Import `nextConfig` and assert these response policies exist for `/(.*)`:

- `Content-Security-Policy` with `default-src 'self'`, enumerated worker/blob/image/font/connect rules, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` disabling geolocation, microphone, payment, USB, and unrelated sensors; camera is allowed for self because Scan to PDF needs explicit user permission;
- `Cross-Origin-Resource-Policy: same-origin` for worker/WASM assets.

- [ ] **Step 3: Run tests and observe failure**

Run `npm test -- src/app/tools src/app/sitemap.test.ts src/lib/security-headers.test.ts`.

Expected: FAIL because route helpers and policies do not exist.

- [ ] **Step 4: Implement active-only route behavior**

`generateStaticParams()` filters `releaseStatus === "active"`. The page calls `notFound()` for a missing, planned, or disabled manifest. It must not render a generic fake converter. The workspace is introduced on a route only in the same commit that activates a capability and provides its real adapter in a later wave.

- [ ] **Step 5: Implement metadata, sitemap, robots, and headers**

Use `SITE_URL` in production and `http://localhost:3000` locally. Fail the production build if `SITE_URL` is missing or not HTTPS. Include only `/` and active tool routes in sitemap. Permit crawling in production and disallow all crawling on Vercel Preview through the robots result and `X-Robots-Tag: noindex, nofollow` preview header.

- [ ] **Step 6: Verify and commit**

```powershell
npm test -- src/app/tools src/app/sitemap.test.ts src/lib/security-headers.test.ts
npm run lint
npm run typecheck
npm run build
git add src/app/tools src/app/sitemap.ts src/app/sitemap.test.ts src/app/robots.ts src/lib next.config.ts
git commit -m "feat: secure active-only tool routes"
```

---

### Task 12: Add CI, privacy gates, architecture documentation, and Wave 0 acceptance

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `e2e/home.spec.ts`
- Create: `e2e/catalog-preview.spec.ts`
- Create: `README.md`
- Create: `docs/architecture/wave-0.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: every Wave 0 npm script and public interface.
- Produces: reproducible pull-request checks, preview smoke tests, setup documentation, and the Wave 0 completion record.

- [ ] **Step 1: Extend E2E tests for preview safety**

Set `CATALOG_PREVIEW=1` in Playwright's local `webServer.env`. Assert the catalog displays 90 planned cards, searching `PDF to JPG` yields one intended card, the card says `In development`, the card is not a link, `/tools/pdf-to-jpg` returns the not-found UI, keyboard focus reaches search and category controls, and the page has no horizontal overflow at 390×844.

- [ ] **Step 2: Run Chromium E2E and observe any integration failures**

```powershell
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

Expected before integration fixes: at least one new preview assertion fails. Correct only wiring defects in existing Wave 0 components; do not activate a manifest.

- [ ] **Step 3: Create the CI workflow**

Use Node 24 with `npm ci`. Define jobs:

1. `quality`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:privacy`, `npm run build`.
2. `browser-smoke`: depends on `quality`, installs Playwright Chromium, runs Chromium E2E, and uploads the Playwright report on failure.
3. `browser-matrix`: runs Firefox and WebKit on pushes to `main` and manual dispatch, not every pull request.

Grant workflow contents read-only permission and no deployment secret access.

- [ ] **Step 4: Write setup and architecture documentation**

`README.md` must include Node 24, `npm ci`, local development, unit tests, browser installation, verification, `SITE_URL`, `CATALOG_PREVIEW`, and the rule that Wave 0 must not deploy planned tools as active. `docs/architecture/wave-0.md` must document the file map, adapter protocol, job lifecycle, result ownership, telemetry allowlist, catalog visibility rule, and how a later wave changes one manifest from `planned` to `active` only after its release gate passes.

- [ ] **Step 5: Run the complete local acceptance sequence**

```powershell
npm ci
npm run verify
npx playwright install chromium firefox webkit
npm run test:e2e
git status --short
```

Expected:

- lint, typecheck, unit/component tests, privacy scan, and production build pass;
- Chromium, Firefox, and WebKit E2E pass;
- production visibility tests expose zero planned tools;
- preview E2E shows all 90 as noninteractive planned cards;
- planned tool URLs return not found;
- `git status --short` shows only the intended Wave 0 files before commit.

- [ ] **Step 6: Commit Wave 0 acceptance**

```powershell
git add .github/workflows/ci.yml e2e README.md docs/architecture/wave-0.md package.json package-lock.json
git commit -m "ci: enforce Wave 0 quality gates"
```

- [ ] **Step 7: Record the exact verification evidence**

Run:

```powershell
git log --oneline --decorate -12
git status --short --branch
npm run verify
npm run test:e2e
```

Expected: clean tracked worktree, twelve task commits represented in recent history, and both verification commands exit 0. Keep `.superpowers/` outside commits unless it has been removed through the approved visual-companion cleanup flow.

---

## Spec Coverage Self-Review

| Approved spec requirement | Wave 0 implementation task | Completion or deferral rule |
|---|---|---|
| Search-first Bright Utility, English-first, anonymous public shell | Tasks 1, 3, and 4 | Complete in Wave 0. |
| Exact catalog count, routes, contracts, options, warnings, fixtures, and browser requirements | Task 2 | All 90 remain `planned`; schema and invariants are complete. |
| Universal desktop/mobile limits and magic-byte-first validation | Task 5 | Generic primitives complete; deep page/frame/codec probes arrive with family adapters. |
| Capability registry, lazy engine router, worker families, and adapter boundary | Tasks 2 and 7 | Interfaces and lazy router complete; concrete loaders arrive in Waves 1–3. |
| Shared lifecycle, progress, cancellation, retry, failure normalization, and cleanup | Tasks 6–10 | Complete and exercised through fakes without exposing a fake tool. |
| Hard privacy boundary and closed telemetry | Tasks 7–9 and 11 | Complete for foundation; CI scan prevents server imports of conversion modules. |
| Active-only tool pages, metadata, sitemap, robots, and browser security policy | Task 11 | Complete; planned routes remain not found. |
| Unit, component, contract-harness, browser, and CI foundations | Tasks 1, 2, 5–12 | Complete; real engine fixtures are supplied by their owning wave. |
| Accessibility foundations and responsive catalog/workspace behavior | Tasks 4, 10, and 12 | Component and browser smoke complete; full manual audit remains Wave 4. |
| Better Auth, Google OAuth, Neon retention/deletion/export | Wave 3 plan | Deliberately absent from Wave 0; anonymous conversion has no dependency on it. |
| PDF/image/OCR/archive/utility engines | Wave 1 plan | Deliberately absent; activation requires Task 2 and Task 11 gates. |
| Video/audio/GIF engines | Wave 2 plan | Deliberately absent; activation requires Task 2 and Task 11 gates. |
| Real-device acceptance, final SEO content, performance budgets, security review, and production launch | Wave 4 plan | Deliberately deferred until every engine family passes its own plan. |

Type consistency audit: later tasks use the exact exported names `CapabilityManifest`, `ValidationIssue`, `FileProbe`, `JobAction`, `JobState`, `JobResultMetadata`, `NormalizedJobError`, `WorkerRequest`, `WorkerResponse`, `WorkerLike`, `EngineAdapter`, `EngineRouter`, `ManagedResult`, `ResultManager`, `TelemetryEvent`, and `WorkspaceJobRunner` defined by earlier tasks. No later task introduces an alternate name for the same boundary.

## Wave 0 Acceptance Boundary

Wave 0 is complete when the repository has a secure, accessible, production-building application shell; a runtime-validated registry of all 90 planned launch capabilities; deterministic search and visibility; exact universal limit primitives; a tested job/worker/result lifecycle; privacy-safe telemetry; a reusable injected workspace UI; active-only SEO routes; and passing CI/browser smoke gates.

Wave 0 does **not** activate or claim a working converter. The following approved work receives separate plans after Wave 0 verification:

- **Wave 1:** 27 PDF, 31 image, OCR, ZIP, unit/time, barcode, and password engines plus fixtures.
- **Wave 2:** 13 video/audio and 11 GIF capabilities using bounded FFmpeg/WASM adapters.
- **Wave 3:** Better Auth, Google OAuth, Neon metadata, saved preferences/presets, Visual Sign PDF, and local face blur.
- **Wave 4:** full real-device matrix, accessibility audit, SEO content verification, performance budgets, privacy/security review, production migration, rollback drill, and all-90 public activation.

No later wave may bypass the Task 2 manifest schema, Task 5 validation primitives, Task 6 state machine, Task 7 worker protocol, Task 8 result ownership, Task 9 telemetry allowlist, or Task 11 active-only routing gate.

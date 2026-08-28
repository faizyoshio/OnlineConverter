# Online Converter — Product and Technical Design

**Status:** Approved design baseline

**Date:** 2026-08-28

**Working title:** Online Converter

**Target hosting:** Vercel Hobby, while the project remains personal and non-commercial

**Launch scope:** 90 browser-first capabilities

## 1. Purpose

Online Converter is a public, English-first web application for lightweight PDF, image, video, audio, GIF, archive, OCR, signature, and utility work. The defining product promise is that user files are processed locally in the browser and do not pass through the application server.

The first public release must provide all 90 capabilities in this specification as working tools. A visible tool card without a complete processing path, clear compatibility behavior, and required tests does not count as implemented.

The design optimizes for:

1. Privacy: file contents remain on the user's device.
2. Predictability: all tools share one job lifecycle, limit policy, and error vocabulary.
3. Free-tier viability: conversion CPU, memory, and bandwidth are supplied by the browser rather than Vercel Functions.
4. Maintainability: engines sit behind small adapters and tools are declared through a capability registry.
5. Honest quality: exact, lossy, and best-effort operations are labeled differently.

## 2. Product Decisions

### 2.1 Experience

- The homepage uses a **Search-first Command Center** layout.
- The visual system is **Bright Utility**: high-contrast cards, crisp borders, restrained color coding, clear status states, and dense but readable information.
- The initial interface and SEO copy are in English.
- The site is anonymous-first. An account is optional and never required for conversion.
- Desktop and mobile use the same published input limits. The application may reject work earlier when a browser cannot allocate enough local resources, but it must explain that device constraint.
- Search, categories, favorites, and recently used tools make the 90-capability catalog navigable.
- Recent tools are stored locally. Conversion history is not stored.

### 2.2 Account system

- Authentication uses Better Auth with Google OAuth redirect flow.
- Password authentication is excluded from the first release.
- Neon Postgres stores application-facing account metadata only:
  - user identifier;
  - email;
  - display name;
  - favorites;
  - UI preferences;
  - saved converter presets;
  - creation and update timestamps.
- Better Auth additionally stores the minimum operational identity records required for linked Google accounts, sessions, verification, and abuse throttling. Section 6.5 defines the allowed fields and retention. No Google access, refresh, or ID token is persisted.
- Profile data, favorites, preferences, and presets are retained until the user changes or deletes them or deletes the account; there is no conversion-activity-based retention.
- Conversion continues to work if authentication or Neon is unavailable.
- Signing out or losing a session must not interrupt an anonymous local conversion already in progress.

### 2.3 Quality language

Each capability declares exactly one result contract:

- **Exact structural:** deterministic structure such as page order, rotation, extraction, packaging, or dimensions must match the selected options exactly.
- **Lossy visual:** compression, rasterization, and media transcodes disclose their quality trade-offs and never claim pixel-perfect equivalence.
- **Best-effort semantic:** OCR, tracing, detection, and similar interpretation show accuracy limitations and expose inspectable results where practical.

## 3. Launch Capability Catalog

The registry contains 90 active capabilities. A capability may offer multiple format targets inside one workflow when explicitly noted.

### 3.1 PDF and lightweight documents — 27

1. Merge PDFs.
2. Merge PDF and image files.
3. Split PDF.
4. Compress PDF using an explicitly lossy raster/rebuild path when structural compression is insufficient.
5. Add text, images, and shapes to PDF.
6. Annotate PDF.
7. Organize PDF pages.
8. Rotate PDF pages.
9. Crop PDF pages.
10. Resize PDF pages.
11. Delete PDF pages.
12. Extract PDF pages.
13. Add page numbers.
14. Add a PDF watermark.
15. Flatten PDF annotations and forms.
16. Compare two PDFs using rendered-page comparison and structural metadata where available.
17. Scan images or camera captures to PDF.
18. OCR PDF in English.
19. Create and fill basic PDF forms.
20. Unified PDF Converter: one processing workflow that accepts the supported PDF, image, HEIC, text, or sanitized-HTML inputs and produces a user-selected supported PDF, JPG, PNG, or plain-text output through the same validation and job lifecycle. It is not a navigation-only hub.
21. PDF to image.
22. PDF to JPG.
23. PDF to text.
24. Sanitized HTML snippet to PDF.
25. Image or JPG to PDF.
26. HEIC to PDF.
27. Plain text to PDF.

### 3.2 Image — 31

1. Unified Image Converter: one processing workflow that accepts the supported JPEG, PNG, WebP, BMP, JFIF, HEIC, or safe SVG inputs and produces a user-selected JPEG, PNG, or WebP output. It is not a navigation-only hub.
2. Image to JPG.
3. JPG to PNG or WebP.
4. Image to PNG.
5. Image to WebP.
6. WebP to JPG.
7. WebP to PNG.
8. JFIF to PNG.
9. HEIC to JPG.
10. HEIC to PNG.
11. PNG to SVG using best-effort tracing.
12. SVG Converter for sanitized SVG to PNG, JPEG, or WebP. Raster-to-SVG tracing remains the separate PNG-to-SVG capability.
13. Sanitized HTML snippet to image.
14. Image Compressor.
15. JPG and JPEG Compressor.
16. PNG Compressor.
17. WebP Compressor.
18. BMP Compressor.
19. Resize Image.
20. Crop Image.
21. Circle Crop Image.
22. Rotate Image.
23. Flip Image.
24. Merge Images.
25. Image Enlarger using deterministic resampling, without an AI-upscale claim.
26. Basic Photo Editor with crop, rotate, flip, brightness, contrast, saturation, and grayscale controls; export to JPEG, PNG, or WebP.
27. Meme Generator using a local image or blank canvas, top and bottom text, font size, alignment, outline, and color controls; export to PNG or JPEG. No remote template library is loaded.
28. Color Picker.
29. Watermark Image.
30. Color Extractor.
31. Photo Signature Resize.

### 3.3 Video and audio — 13

1. Video Compressor.
2. MP3 Compressor.
3. WAV Compressor.
4. Video Converter.
5. Audio Converter.
6. MP3 Converter.
7. MP4 Converter.
8. MP4 to MP3.
9. Video to MP3.
10. MOV to MP4.
11. MP3 to OGG.
12. Crop Video.
13. Trim Video.

### 3.4 GIF — 11

1. GIF Compressor.
2. GIF Maker and Images to GIF.
3. Video to GIF.
4. MP4 to GIF.
5. WebM to GIF.
6. APNG to GIF.
7. GIF to MP4.
8. GIF to APNG.
9. MOV to GIF.
10. AVI to GIF.
11. GIF to Images.

### 3.5 Archive and utilities — 6

1. ZIP Maker.
2. ZIP Extractor.
3. Unit Converter.
4. Time Converter.
5. Barcode Generator.
6. Password Generator using Web Crypto randomness.

### 3.6 Signature and privacy — 2

1. Visual Sign PDF: draw, type, or import a signature image and place it locally into a PDF. This is not a remote signature-request or identity-verification product.
2. Blur faces locally using an on-device detection model, with manual review before export.

## 4. Explicitly Excluded Capabilities

The 39 normalized capabilities below are not part of the Vercel Hobby launch. Their cards must not be presented as active tools.

### 4.1 Advanced PDF editing — 4

- Edit existing PDF text in place.
- Extract embedded PDF images as their original objects.
- Convert PDF to archival PDF/A.
- Repair corrupt PDF.

### 4.2 Office and generic document conversion — 9

- Word to PDF.
- PDF to Word.
- PowerPoint to PDF.
- PDF to PowerPoint.
- Excel to PDF.
- PDF to Excel.
- Generic Document Converter.
- Excel Converter.
- PowerPoint Converter.

### 4.3 AI image operations — 3

- In-place HEIC compression as a separate HEIC output capability.
- AI Upscale.
- Remove Background.

### 4.4 Ebook conversion — 13

- eBook to PDF.
- EPUB to PDF.
- MOBI to PDF.
- AZW to PDF.
- AZW3 to PDF.
- DJVU to PDF.
- PDF to eBook.
- PDF to EPUB.
- PDF to MOBI.
- PDF to AZW3.
- PDF to FB2.
- PDF to RTF.
- Generic eBook Converter.

### 4.5 Specialist conversion — 3

- Generic Archive Converter.
- Vector Converter beyond the safe SVG workflows listed above.
- CAD Converter.

### 4.6 AI document features — 3

- AI Summarizer.
- Chat with PDF or AI PDF Assistant.
- Translate PDF.

### 4.7 High-trust security workflows — 4

- Request Signatures.
- Password Protect PDF.
- Unlock PDF.
- Permanent secure redaction.

The excluded items require server compute, commercial conversion APIs, complex proprietary formats, stronger cryptographic assurance, or higher-trust semantic guarantees that do not fit the first browser-only free-tier release.

## 5. Universal Input Limits

Limits are identical on desktop and mobile and are enforced before expensive engine initialization whenever metadata can be read cheaply.

| Family | Universal limit |
|---|---|
| PDF | 25 MB and 100 pages per document |
| Image | 20 MB and 40 megapixels per image |
| Batch | 20 files and 100 MB aggregate input |
| Video | 50 MB, 3 minutes, and 1080p maximum |
| Audio | 50 MB and 15 minutes maximum |
| GIF and video-to-GIF | 25 MB, 30 seconds, and 720p maximum |
| ZIP input | 75 MB compressed |
| ZIP extraction | 200 MB expanded, 1,000 entries, and nesting depth 10 |
| OCR | 20 pages or images per job |

Validation also checks decoded pixel budgets, frame counts, duration, page count, archive expansion, archive entry paths, magic bytes, declared MIME type, codec support, and estimated local memory. A malformed header may not bypass a limit.

The universal limit is a maximum eligibility threshold, not a promise that every eligible file will complete on every device. If a browser lacks a codec, API, memory, or WASM feature, the UI must report the device-specific reason and preserve the selected options for a new attempt.

## 6. System Architecture

### 6.1 Delivery layer

Next.js App Router runs on Vercel and provides:

- statically rendered homepage, category pages, and tool pages;
- metadata, canonical URLs, sitemap, and structured data;
- the Bright Utility design system;
- same-origin delivery of versioned worker and WASM assets;
- lightweight Better Auth route handlers;
- authenticated preference and preset endpoints.

No conversion endpoint accepts file bytes. Request-body limits on serverless functions are therefore irrelevant to normal conversions.

### 6.2 Browser conversion plane

The browser owns:

- selected `File` and `Blob` objects;
- validation and capability detection;
- option state;
- lazy engine loading;
- worker execution;
- previews;
- result object URLs;
- downloads;
- cleanup.

The conversion plane is composed of:

1. **Capability registry** — declarative tool metadata, routes, accepted inputs, universal limits, options, engine adapter, result contract, warnings, fixtures, and browser requirements.
2. **Validator** — cheap header and metadata inspection followed by family-specific validation.
3. **Engine router** — lazy imports exactly the adapter required by the selected capability.
4. **Job controller** — implements the shared job state machine, cancellation, progress, warnings, and cleanup.
5. **Worker protocol** — serializable messages for initialization, processing, progress, result metadata, warning, failure, cancel, and disposal.
6. **Result manager** — owns preview URLs, download URLs, partial results, and deterministic revocation.

### 6.3 Worker families

- **PDF worker:** PDF inspection, rendering, structural page operations, form and annotation work, and export.
- **Image worker:** browser codecs, canvas/offscreen canvas operations, HEIC decoding, tracing, editing, and compression.
- **Media worker:** bounded FFmpeg/WASM audio, video, and GIF operations.
- **Archive worker:** safe ZIP creation and extraction.
- **OCR worker:** English OCR and page-image preprocessing.
- **Utility engine:** unit/time calculations, barcode generation, cryptographic password generation, and color operations.

Each adapter exposes the same conceptual interface:

```text
probe(input) -> support and metadata
validate(input, options, limits) -> ready or actionable errors
process(input, options, signal, onProgress) -> result and warnings
dispose() -> release engine resources
```

Adapters may use different libraries internally. The registry and UI depend on the interface, not a library-specific API.

### 6.4 Engine selection baseline

Implementation planning should evaluate and pin current compatible versions, but the intended roles are:

- PDF.js-compatible rendering/inspection plus a browser-capable PDF manipulation library for structural operations.
- Canvas, OffscreenCanvas, ImageBitmap, browser image codecs, a local HEIC decoder, and a local tracing engine for image work.
- FFmpeg/WASM for bounded media and GIF workflows.
- Tesseract-compatible local OCR for English recognition.
- A small ZIP library with streaming support and explicit path handling.
- An on-device face detector with locally hosted model assets.
- Web Crypto for password generation and security-sensitive randomness.

Single-thread media processing is the compatibility baseline. A multi-threaded FFmpeg core may be enabled only on routes that pass cross-origin-isolation tests and must have a tested single-thread fallback. Google OAuth uses redirect rather than popup, so tool-route isolation must not be a prerequisite for signing in.

### 6.5 Optional account plane

The browser never connects directly to Neon. Authenticated Next.js route handlers perform small validated metadata operations. The database schema is limited to Better Auth tables plus favorites, preferences, and presets.

Presets contain option values only. They must not contain filenames, file metadata, hashes, content-derived text, previews, results, or conversion history.

The allowed identity footprint is explicit:

- Google OAuth requests only `openid`, `email`, and `profile` scopes.
- The user table stores the Better Auth user ID, email, display name, optional avatar URL from Google, email-verification state, and timestamps.
- The account table stores only the provider name, provider account identifier, user relationship, and timestamps. Google access tokens, refresh tokens, and ID tokens are callback-ephemeral and must be absent from persisted rows. A database assertion test enforces this after sign-in and account linking.
- The session table stores hashed or otherwise non-plaintext session identifiers as supported by the pinned Better Auth version, user relationship, expiry, IP-derived security data only when strictly necessary for abuse prevention, a coarse user-agent class, and timestamps. It must not store full user-agent strings when the coarse class is sufficient.
- Verification artifacts expire after one hour and are deleted after use. Expired artifacts are purged within 24 hours.
- Auth rate-limit records contain only a one-way keyed identifier, normalized action, counter, window, and timestamps. They expire within 24 hours.
- Sessions have a seven-day absolute lifetime, rotate after sign-in and sensitive account actions, are revoked on account deletion, and are purged no later than 30 days after expiry.

Account deletion requires a fresh Google re-authentication or an equivalently fresh authenticated session. It hard-deletes application metadata, sessions, linked accounts, verification records, rate-limit records that can be attributed to the user, and the active user row in one transaction or a failure-safe ordered workflow. Managed Neon backups may retain deleted database pages for the provider's documented recovery window; the privacy notice must distinguish active-database deletion from provider backup expiry.

An account-data export contains profile fields, favorites, preferences, and saved presets. It excludes session identifiers, rate-limit keys, OAuth artifacts, security logs, and all conversion data. Export and deletion never include or imply a file history because none exists.

## 7. Hard Privacy Boundary

The following values must never enter Vercel route handlers, Vercel logs, Neon, analytics, error-reporting payloads, or third-party services:

- file bytes;
- filenames and local paths;
- file hashes or content fingerprints;
- extracted or OCR text;
- document or image previews;
- conversion outputs;
- archive entry names when derived from the user's file;
- conversion history.

Permitted privacy-safe observability fields are:

- anonymous capability identifier;
- lifecycle stage;
- coarse device class;
- coarse duration bucket;
- success, warning, cancellation, or normalized error code;
- application and engine version.

Free-form exception messages are not sent to telemetry because library errors can contain filenames or content-derived strings. Client logs must be sanitized and ephemeral.

## 8. Tool Lifecycle and Data Flow

Every capability uses this state machine:

```text
idle
  -> validating
  -> ready
  -> loading-engine
  -> processing
  -> success | success-with-warnings | failure | cancelled
  -> cleanup
  -> idle
```

### 8.1 Discover

The user reaches a tool through search, category navigation, favorites, a recent-tool shortcut stored locally, or a direct SEO route.

### 8.2 Add files

Supported sources include browse, drag-and-drop, paste, and camera capture when the capability requires it. The browser owns the resulting objects. No background upload begins.

### 8.3 Validate

Validation first confirms the actual format, then reads the minimum metadata needed to enforce limits and compatibility. The UI reports all cheap validation failures together when doing so is safe and understandable.

### 8.4 Configure

Each tool provides safe defaults and progressively reveals advanced options. Signed-in users can save option-only presets. Changing options must not mutate the source file.

### 8.5 Process

The application lazy-loads the chosen engine, starts an isolated worker, and reports meaningful progress when the engine supplies measurable stages. Indeterminate work uses stage labels rather than fabricated percentages.

Cancellation uses an abort signal. If an adapter cannot cooperatively stop, hard cancellation terminates the worker, discards partial output, and creates a fresh worker for the next job.

### 8.6 Review and download

The result view shows, when available:

- safe preview;
- output type and size;
- page, frame, dimension, or duration metadata;
- quality or compatibility warnings;
- primary download action;
- start-another-job action.

Downloads are explicit and are never retried automatically.

### 8.7 Cleanup

Cleanup revokes object URLs, releases decoded frames and canvases, clears input/output buffers, and terminates idle workers. It runs after download completion, starting another job, leaving the tool, tab shutdown when supported, cancellation, and failure.

Because browsers cannot guarantee a tab-close callback, correctness must not depend on it. All long-lived resources must also have deterministic cleanup during normal navigation and new-job transitions.

## 9. Error Handling and Recovery

Errors are normalized into these user-facing classes:

1. Unsupported format or codec.
2. Universal limit exceeded.
3. Encrypted, malformed, or corrupt input.
4. Insufficient browser memory or device capability.
5. Engine asset load or offline failure.
6. Conversion failure.
7. User cancellation.

Every error communicates:

- what failed in plain language;
- whether the source remains unchanged;
- whether any partial output was discarded;
- a safe next action;
- the relevant accepted format or limit when applicable.

Safe, idempotent engine initialization or conversion steps may be retried after explicit user action. Downloads, signature placement, archive extraction, and any action with an external side effect are never silently repeated.

After failure, option state may remain in memory, but file bytes and content-derived metadata are disposed. The user selects the input again for a new attempt.

## 10. Security Design

### 10.1 Hostile input containment

- Confirm magic bytes rather than trusting extensions or `Content-Type`.
- Normalize ZIP paths and reject absolute paths, drive prefixes, null bytes, and parent traversal.
- Enforce compressed size, expanded size, entry count, and depth budgets.
- Do not execute embedded document scripts, macros, media attachments, or SVG scripts.
- Sanitize SVG and user-supplied HTML before rendering.
- Render previews in constrained contexts; use sandboxed iframes only where necessary.
- Isolate parsers and heavy engines in workers so crashes do not take down the main UI.
- Require manual review of detected faces before blur export.

### 10.2 HTML conversion boundary

HTML-to-PDF and HTML-to-image accept sanitized snippets supplied directly by the user. They do not fetch arbitrary URLs, crawl pages, submit forms, run third-party scripts, or proxy remote resources. Remote images and fonts are not fetched by the server.

The sanitizer contract is normative:

- Allowed body-content elements are `div`, `span`, `p`, `br`, `hr`, `h1`–`h6`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `strong`, `em`, `b`, `i`, `u`, `s`, `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, and `img`. A `<style>` block is the single special non-body exception and is accepted only under the CSS-AST rules below.
- Allowed common attributes are `class`, `title`, and sanitized inline `style`; table cells may also use bounded `colspan` and `rowspan`; images may use `alt`, `width`, and `height`.
- Image sources may only be `data:` URLs for PNG, JPEG, WebP, or GIF, with at most 20 embedded images and 10 MB aggregate encoded image data. HTTP, HTTPS, protocol-relative, file, blob supplied by markup, and other URL schemes are rejected.
- Active and embedding elements—including `script`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `link`, `meta`, `base`, `video`, `audio`, `canvas`, and inline SVG—are rejected. Event-handler attributes are rejected.
- Inline style values are parsed, not filtered with regular expressions. The allowlist covers typography, text alignment and decoration, color, background color, borders, spacing, width/height constraints, display, table layout, and static flex/grid layout. It rejects `url()`, `@import`, `@font-face`, custom external fonts, behavior, filters, animations, transitions, fixed/sticky positioning, and any network-bearing or executable construct.
- A `<style>` block is accepted only after CSS-AST parsing with the same property restrictions, simple descendant/class/element selectors, and no at-rules. Otherwise it is rejected.
- A snippet is limited to 1 MB of UTF-8 markup, 5,000 DOM nodes, nesting depth 50, 10,000 CSS declarations, and the image limits above.
- Dangerous or network-bearing content causes validation failure. Harmless unsupported tags or properties are removed only when the UI lists them in a pre-conversion warning and the sanitized preview is shown before processing.
- Rendering occurs in a sandboxed, script-disabled local document. The sanitized DOM is rasterized for image output or placed into paginated print layout for PDF output. No server rendering is used.

Sanitizer tests include malicious URL schemes, encoded event handlers, malformed markup, CSS escape tricks, oversized DOM/CSS inputs, nested tables, data-image limits, and representative valid snippets.

### 10.3 Browser and response policy

Production responses use a strict Content Security Policy, `X-Content-Type-Options: nosniff`, restrictive referrer and permissions policies, and frame-ancestor denial. Worker, WASM, image, font, and connection sources are enumerated rather than left open.

Cross-origin isolation is applied only where required by a tested multi-thread engine path. All required assets for such a path are served with compatible resource policy headers from the same origin.

### 10.4 Authentication and database

- OAuth state, nonce, PKCE where supported by the provider flow, secure HttpOnly cookies, and CSRF protections remain enabled.
- Secrets exist only in server-side environment variables.
- Auth and metadata inputs are schema validated.
- Authentication endpoints use database-backed throttling suitable for serverless execution.
- Neon credentials use the minimum privileges required by the application.
- Database migrations are additive or backward-compatible before production traffic switches.

### 10.5 Supply chain

- Commit the lockfile and pin production engine versions.
- Serve worker, model, and WASM assets from the application origin.
- Review licenses before adopting each engine.
- Run dependency vulnerability scanning and production-build verification in CI.
- Keep engines behind adapters so a vulnerable dependency can be replaced without rewriting tool pages.

## 11. Testing Strategy

### 11.1 Unit tests

Run on every relevant commit and cover:

- capability registry schema and uniqueness;
- route-to-capability consistency;
- validators and exact universal-limit boundaries;
- archive path and expansion calculations;
- option schemas and serialization;
- job state transitions;
- progress normalization;
- error sanitization;
- result URL ownership and cleanup;
- preference and preset validation.

### 11.2 Engine contract tests

Every capability manifest references small legal test fixtures that include:

- valid minimum input;
- representative valid input;
- malformed or unsupported input;
- input exactly at a relevant boundary;
- input immediately above that boundary;
- cancellation scenario;
- cleanup assertion.

Assertions depend on the result contract. They may include MIME and magic bytes, page count and order, dimensions, frame count, duration tolerance, archive contents, form values, OCR scoring, and expected warnings.

### 11.3 Visual and semantic tests

- Exact structural operations compare deterministic metadata and structure.
- Rendered PDF and image results use perceptual or pixel tolerances appropriate to the engine.
- Lossy media uses duration, stream, resolution, and quality-floor assertions rather than binary equality.
- OCR fixtures use known English ground truth and publish the accepted score threshold in the adapter test.
- Face blur fixtures verify coverage and require a manual visual acceptance set before launch.

### 11.4 Browser end-to-end tests

Playwright covers Chromium, Firefox, and WebKit for:

- discovery and search;
- file selection and validation;
- option changes;
- engine loading;
- processing and progress states;
- cooperative and hard cancellation;
- warning and failure recovery;
- preview and download;
- object URL cleanup;
- keyboard access and visible focus;
- responsive layouts;
- Google OAuth redirect using a test configuration where automation is permitted.

Changed-tool smoke tests run on pull requests. The broader matrix runs on the default branch or a scheduled CI job to control build time.

### 11.5 Manual acceptance

Before public launch, test real low-memory Android hardware, current iPhone Safari, and the supported desktop browsers with representative and large-but-valid fixtures. Manual checks cover accessibility, memory pressure, codec support, install/loading behavior, offline recovery, auth redirect, previews, downloads, and long-job cancellation.

### 11.6 Capability release gate

A capability is complete only when it has:

- a registered route and searchable catalog entry;
- real input validation;
- a working adapter;
- declared quality contract and limitations;
- progress or truthful stage reporting;
- cancellation and cleanup behavior;
- required fixtures and passing tests;
- accessible controls and status announcements;
- privacy-safe error behavior;
- no placeholder output or server upload.

The public all-90 launch requires every active manifest to meet this gate. Browser incompatibility may produce an explicit unsupported state, but never a nonfunctional active button.

## 12. Accessibility, Performance, and SEO

### 12.1 Accessibility

- Target WCAG 2.2 AA for application UI.
- All controls are keyboard reachable with visible focus.
- Drag-and-drop always has an equivalent file-picker path.
- Progress, validation, success, warning, error, and cancellation changes are announced to assistive technology without excessive repetition.
- Color is not the only status indicator.
- Previews have text alternatives or metadata summaries where meaningful.
- Reduced-motion preferences are respected.

### 12.2 Performance

- Tool engines are never included in the homepage's initial JavaScript bundle.
- Each tool lazy-loads only the selected adapter and assets.
- Workers keep heavy processing off the main UI thread.
- Engine downloads are versioned and cacheable.
- The application reports engine-loading separately from processing.
- Pull requests enforce route and shared-bundle budgets defined during implementation planning.
- Search and category navigation work before any conversion engine loads.

### 12.3 SEO

- Each capability has a unique canonical route, title, description, limitations, accepted formats, and concise usage guide.
- Category pages provide navigable content rather than duplicate keyword pages.
- Only implemented active capabilities appear in the sitemap.
- Unsupported or excluded tools do not get misleading conversion claims.
- Structured data must reflect actual application behavior.

## 13. Deployment and Operations

### 13.1 Vercel usage model

Vercel serves static pages, versioned browser assets, authentication routes, and small metadata APIs. It does not perform conversion, OCR, preview generation, media transcoding, or archive extraction.

This architecture is designed to remain within Vercel Hobby constraints for a personal, non-commercial project. If the product becomes monetized, client-funded, business-critical, or otherwise commercial, it must move to an eligible paid plan before that use begins.

### 13.2 Environments

- **Local:** local application, local or isolated development database, test OAuth credentials.
- **Preview:** immutable Vercel preview deployment, isolated preview-safe auth configuration, non-production metadata database or schema.
- **Production:** production domain, production Google OAuth client, production Neon database, and production-only secrets.

Preview deployments must not share a callback configuration that can accidentally create production sessions.

### 13.3 Continuous integration

Pull requests run:

- formatting checks;
- lint;
- typecheck;
- unit tests;
- changed-engine contract tests;
- production build;
- bundle budgets;
- privacy-policy static checks where practical;
- Playwright smoke tests against a preview artifact.

Broader engine fixtures and the cross-browser matrix run on the default branch or scheduled CI according to runtime cost.

### 13.4 Release and recovery

Production release sequence:

1. Complete backward-compatible database migration.
2. Deploy an immutable Vercel artifact.
3. Run production health and representative browser smoke checks.
4. Promote the deployment to the production domain.
5. Monitor privacy-safe lifecycle and normalized error signals.

Recovery uses Vercel deployment rollback. A broken capability can be disabled through the registry only via a reviewed redeploy; there is no mutable remote switch that could silently change converter behavior. Database changes remain backward-compatible with the previous application deployment.

## 14. Internal Delivery Decomposition

The product is too large for a single undifferentiated implementation pass. Work is divided into five internal subprojects. This does not reduce the approved public scope.

### Wave 0 — Platform foundation

- Next.js application shell and design system.
- Capability registry and search/category model.
- Shared input, option, job, warning, result, and error contracts.
- Worker protocol and job controller.
- Universal limit validators.
- Object URL and memory cleanup.
- Privacy-safe observability boundary.
- Test harness, fixture conventions, CI, and preview deployment.

### Wave 1 — PDF, image, OCR, archive, and utilities

- PDF worker and its 27 capabilities.
- Image worker and its 31 capabilities.
- OCR worker.
- ZIP and utility engines.
- Fixture matrix for exact, lossy, and best-effort outputs.

### Wave 2 — Video, audio, and GIF

- Media worker and FFmpeg/WASM adapter.
- Thirteen video/audio capabilities.
- Eleven GIF capabilities.
- Codec probing, progress mapping, memory warnings, and quality presets.

### Wave 3 — Account and trust features

- Better Auth and Google OAuth.
- Neon schema and migrations.
- Favorites, UI preferences, and option-only presets.
- Visual Sign PDF.
- Local face detection and blur review workflow.
- Security header and auth hardening.

### Wave 4 — Launch hardening

- Full cross-browser and real-device matrix.
- Accessibility audit and fixes.
- SEO content and structured data verification.
- Performance and bundle-budget enforcement.
- Privacy and security review.
- Production migration, smoke test, and rollback drill.

Each wave receives its own detailed implementation plan and verification checkpoint. Wave 0 is first because every later capability depends on its contracts and harnesses.

## 15. Success Criteria

The first public release succeeds when:

1. All 90 active capabilities satisfy the capability release gate.
2. No conversion path uploads user files or derived content.
3. Anonymous conversion works without Neon or Google OAuth.
4. Universal limits are published and enforced consistently.
5. Valid supported inputs produce downloadable outputs or a truthful best-effort warning.
6. Unsupported, oversized, corrupt, encrypted, or device-incompatible inputs produce actionable errors without leaking content.
7. Cancellation and cleanup release workers, buffers, and object URLs.
8. The supported browser matrix and manual device acceptance pass.
9. The application meets the defined accessibility, SEO, and performance requirements.
10. Vercel serves delivery/auth/metadata only, preserving the Hobby-compatible browser-first operating model.

## 16. Non-goals for the First Release

- Server-side conversion fallback.
- Cloud file storage or file synchronization.
- Conversion history.
- Team workspaces.
- Paid plans or billing.
- Public conversion API.
- Password authentication.
- Remote signature requests or identity verification.
- Claims of legally binding digital signatures.
- Arbitrary website capture by URL.
- Tools listed in the 39-capability exclusion set.

## 17. Normative Capability Contract Matrix

The tables below make the 90-capability count auditable and lock each capability's minimum processing promise. `Exact`, `Lossy`, and `Best effort` refer to the contracts in Section 2.3. Routes are canonical and must be unique.

Every registry manifest must additionally contain:

- canonical ID, route, title, category, and search aliases;
- accepted MIME types, extensions, and magic-byte rules;
- output MIME type, extension, and fallback behavior;
- a schema for the listed options with explicit defaults and bounds;
- the contract shown below;
- worker family and lazy adapter import;
- universal and capability-specific limits;
- normalized warning and unsupported-state codes;
- fixture IDs and assertions for minimum-valid, representative, malformed, at-limit, over-limit, cancellation, and cleanup cases;
- browser requirements and a tested unsupported-state message.

Common warnings are `lossy-output`, `metadata-removed`, `color-profile-normalized`, `font-substituted`, `codec-unavailable`, `device-memory-risk`, `partial-semantic-result`, and `unsupported-feature-removed`. A manifest includes only applicable warnings and may add a narrowly named warning. It may not expose a raw engine exception.

### 17.1 PDF and lightweight documents — 27 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `pdf.merge` / `/merge-pdf` | 2–20 PDFs → PDF | drag order; all pages | Exact |
| `pdf.merge-image` / `/merge-pdf-image` | PDFs, JPEG, PNG, WebP, HEIC → PDF | drag order; A4 fit; 12 mm margin | Exact |
| `pdf.split` / `/split-pdf` | PDF → PDF or ZIP of PDFs | range expression; one output per range | Exact |
| `pdf.compress` / `/compress-pdf` | PDF → PDF | balanced preset; optional low/high; preserve page size | Lossy |
| `pdf.add-content` / `/add-to-pdf` | PDF + local text/images/shapes → PDF | page, position, size, opacity; preserve source pages | Exact |
| `pdf.annotate` / `/annotate-pdf` | PDF → PDF | freehand, highlight, note, shape; preserve source pages | Exact |
| `pdf.organize` / `/organize-pdf` | PDF → PDF | reorder, duplicate, delete; original order initially | Exact |
| `pdf.rotate` / `/rotate-pdf` | PDF → PDF | selected pages; 90° clockwise default | Exact |
| `pdf.crop` / `/crop-pdf` | PDF → PDF | visible crop box; current page default; apply-to-all optional | Exact |
| `pdf.resize` / `/resize-pdf` | PDF → PDF | A4 default; fit content; centered | Exact |
| `pdf.delete-pages` / `/delete-pdf-pages` | PDF → PDF | selected pages; require at least one remaining page | Exact |
| `pdf.extract-pages` / `/extract-pdf-pages` | PDF → PDF or ZIP | selected pages; one combined PDF default | Exact |
| `pdf.page-numbers` / `/page-numbers` | PDF → PDF | bottom center; start at 1; Arabic numerals | Exact |
| `pdf.watermark` / `/watermark-pdf` | PDF + text or local image → PDF | centered; 30% opacity; all pages | Exact |
| `pdf.flatten` / `/flatten-pdf` | PDF → PDF | annotations and AcroForm appearances; all pages | Exact |
| `pdf.compare` / `/compare-pdf` | 2 PDFs → local HTML report + optional diff images | side by side; changed-pixel overlay; page alignment by index | Best effort |
| `pdf.scan` / `/scan-to-pdf` | camera capture or images → PDF | A4 fit; auto orientation; JPEG quality 85 | Lossy |
| `pdf.ocr` / `/ocr-pdf` | scanned PDF → searchable PDF + TXT | English; auto rotate; preserve page images | Best effort |
| `pdf.forms` / `/pdf-forms` | PDF or blank pages → PDF | text, checkbox, radio, dropdown, list; optional flatten off | Exact |
| `pdf.converter` / `/pdf-converter` | PDF, JPEG, PNG, WebP, HEIC, TXT, sanitized HTML → PDF, JPG, PNG, or TXT where the matrix below permits | explicit target required; balanced quality | Best effort |
| `pdf.to-image` / `/pdf-to-image` | PDF → PNG or JPEG files in ZIP for multi-page output | PNG default; 144 DPI | Lossy |
| `pdf.to-jpg` / `/pdf-to-jpg` | PDF → JPEG files in ZIP for multi-page output | 144 DPI; quality 85 | Lossy |
| `pdf.to-text` / `/pdf-to-text` | text-bearing PDF → TXT | page separators on; preserve line breaks where detected | Best effort |
| `pdf.html-to-pdf` / `/html-to-pdf` | sanitized HTML snippet → PDF | A4 portrait; 12 mm margin; system font stack | Lossy |
| `pdf.image-to-pdf` / `/image-to-pdf` | JPEG, PNG, WebP → PDF | A4 fit; 12 mm margin; input order | Exact |
| `pdf.heic-to-pdf` / `/heic-to-pdf` | HEIC → PDF | A4 fit; 12 mm margin; JPEG quality 90 | Lossy |
| `pdf.text-to-pdf` / `/text-to-pdf` | UTF-8 plain text → PDF | A4 portrait; 12 pt system font; wrap on | Exact |

The unified PDF Converter permits only these directions: supported image/HEIC/TXT/sanitized HTML to PDF; PDF to JPG/PNG/TXT; PDF to PDF only through the explicit PDF operation tools. Unsupported pairs are disabled before file selection. PDF forms support AcroForm text, checkbox, radio, dropdown, and list fields. XFA, embedded JavaScript, cryptographic signature fields, and remote submission actions are rejected with an explicit warning.

### 17.2 Image — 31 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `image.converter` / `/image-converter` | JPEG, PNG, WebP, BMP, JFIF, HEIC, safe SVG → JPEG, PNG, or WebP | explicit target; quality 85 when lossy; preserve dimensions | Lossy |
| `image.to-jpg` / `/image-to-jpg` | PNG, WebP, BMP, JFIF, HEIC, safe SVG → JPEG | white alpha background; quality 85 | Lossy |
| `image.jpg-to-modern` / `/jpg-to-png-webp` | JPEG → PNG or WebP | explicit target; WebP quality 85 | Lossy |
| `image.to-png` / `/image-to-png` | JPEG, WebP, BMP, JFIF, HEIC, safe SVG → PNG | preserve alpha; preserve dimensions | Lossy |
| `image.to-webp` / `/image-to-webp` | JPEG, PNG, BMP, JFIF, HEIC, safe SVG → WebP | quality 85; preserve alpha | Lossy |
| `image.webp-to-jpg` / `/webp-to-jpg` | WebP → JPEG | white alpha background; quality 85 | Lossy |
| `image.webp-to-png` / `/webp-to-png` | WebP → PNG | preserve alpha | Lossy |
| `image.jfif-to-png` / `/jfif-to-png` | JFIF/JPEG → PNG | preserve dimensions | Lossy |
| `image.heic-to-jpg` / `/heic-to-jpg` | HEIC → JPEG | orientation applied; quality 90 | Lossy |
| `image.heic-to-png` / `/heic-to-png` | HEIC → PNG | orientation applied | Lossy |
| `image.png-to-svg` / `/png-to-svg` | PNG → SVG paths | color trace; 16 colors; simplify medium | Best effort |
| `image.svg-converter` / `/svg-converter` | sanitized SVG → PNG, JPEG, or WebP | PNG default; explicit raster dimensions | Lossy |
| `image.html-to-image` / `/html-to-image` | sanitized HTML snippet → PNG, JPEG, or WebP | PNG default; viewport 1200×630; scale 1 | Lossy |
| `image.compress` / `/compress-image` | JPEG, PNG, WebP, BMP → same family where supported or WebP fallback | balanced preset; preserve dimensions | Lossy |
| `image.compress-jpeg` / `/compress-jpeg` | JPEG/JFIF → JPEG | quality 75; strip nonessential metadata | Lossy |
| `image.compress-png` / `/compress-png` | PNG → PNG | palette optimization on; preserve alpha | Lossy |
| `image.compress-webp` / `/compress-webp` | WebP → WebP | quality 75; preserve alpha | Lossy |
| `image.compress-bmp` / `/compress-bmp` | BMP → PNG or WebP | PNG default; preserve dimensions | Lossy |
| `image.resize` / `/resize-image` | JPEG, PNG, WebP, BMP → same selected supported raster format | width/height; aspect lock on; Lanczos-quality resample | Lossy |
| `image.crop` / `/crop-image` | JPEG, PNG, WebP, BMP → selected raster format | free crop; source bounds | Lossy |
| `image.circle-crop` / `/circle-crop-image` | JPEG, PNG, WebP → PNG or WebP | centered square crop; transparent outside | Lossy |
| `image.rotate` / `/rotate-image` | JPEG, PNG, WebP, BMP → selected raster format | 90° clockwise default | Lossy |
| `image.flip` / `/flip-image` | JPEG, PNG, WebP, BMP → selected raster format | horizontal default | Lossy |
| `image.merge` / `/merge-images` | 2–20 supported raster images → PNG, JPEG, or WebP | vertical stack; 0 gap; transparent or white background by output | Lossy |
| `image.enlarge` / `/image-enlarger` | JPEG, PNG, WebP → same selected raster format | 2×; aspect lock; high-quality resampling; no AI claim | Lossy |
| `image.photo-editor` / `/photo-editor` | JPEG, PNG, WebP → JPEG, PNG, or WebP | crop/rotate/flip neutral; brightness/contrast/saturation 0; grayscale off | Lossy |
| `image.meme` / `/meme-generator` | local image or blank canvas → PNG or JPEG | top/bottom text blank; centered white text; black outline | Lossy |
| `image.color-picker` / `/color-picker` | local supported raster image → HEX/RGB/HSL value copied or displayed | pointer sample; no interpolation | Exact |
| `image.watermark` / `/watermark-image` | local supported raster image + text/image watermark → selected raster format | bottom right; 60% opacity; 24 px inset | Lossy |
| `image.color-extractor` / `/color-extractor` | local supported raster image → palette JSON/text + swatches | 6 colors; dominant-color clustering | Best effort |
| `image.signature-resize` / `/signature-resize` | JPEG, PNG, WebP signature image → PNG or JPEG | contain; 300×100 px; transparent PNG default | Lossy |

`safe SVG` means the standalone SVG sanitizer removes scripts, event handlers, foreign objects, external references, remote fonts, animation, and network-bearing CSS. Invalid or active SVG is rejected rather than rendered.

### 17.3 Video and audio — 13 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `media.compress-video` / `/compress-video` | MP4, MOV, WebM → MP4 | balanced H.264/AAC; preserve aspect; source frame rate capped at 30 fps | Lossy |
| `media.compress-mp3` / `/compress-mp3` | MP3 → MP3 | 128 kbps CBR default | Lossy |
| `media.compress-wav` / `/compress-wav` | WAV → WAV or FLAC | FLAC default; preserve channels and sample rate when supported | Lossy |
| `media.video-converter` / `/video-converter` | MP4, MOV, WebM, AVI → MP4 or WebM | explicit target; H.264/AAC or VP9/Opus balanced preset | Lossy |
| `media.audio-converter` / `/audio-converter` | MP3, WAV, OGG, AAC, M4A, FLAC → MP3, WAV, OGG, or FLAC | explicit target; 192 kbps for lossy outputs | Lossy |
| `media.mp3-converter` / `/mp3-converter` | WAV, OGG, AAC, M4A, FLAC → MP3 | 192 kbps; preserve channels up to stereo | Lossy |
| `media.mp4-converter` / `/mp4-converter` | MOV, WebM, AVI → MP4 | H.264/AAC balanced preset; source dimensions capped by universal limits | Lossy |
| `media.mp4-to-mp3` / `/mp4-to-mp3` | MP4 → MP3 | 192 kbps; full duration | Lossy |
| `media.video-to-mp3` / `/video-to-mp3` | MP4, MOV, WebM, AVI → MP3 | 192 kbps; full duration | Lossy |
| `media.mov-to-mp4` / `/mov-to-mp4` | MOV → MP4 | H.264/AAC balanced preset | Lossy |
| `media.mp3-to-ogg` / `/mp3-to-ogg` | MP3 → OGG Vorbis | quality 5 | Lossy |
| `media.crop-video` / `/crop-video` | MP4, MOV, WebM → MP4 | visual crop box; H.264/AAC balanced preset | Lossy |
| `media.trim-video` / `/trim-video` | MP4, MOV, WebM, AVI → MP4 | explicit start/end; frame-accurate re-encode | Lossy |

Codec probing occurs before processing. A listed container with an unsupported embedded codec produces `codec-unavailable`; the application does not claim container support alone guarantees decodability. No media capability accepts DRM-protected input.

### 17.4 GIF — 11 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `gif.compress` / `/compress-gif` | GIF → GIF | balanced palette; preserve duration; max 20 fps default | Lossy |
| `gif.make` / `/gif-maker` | 2–20 JPEG/PNG/WebP images → GIF | 500 ms/frame; loop forever; contain fit | Lossy |
| `gif.video-to-gif` / `/video-to-gif` | MP4, MOV, WebM, AVI → GIF | first 5 seconds; 12 fps; 640 px max side | Lossy |
| `gif.mp4-to-gif` / `/mp4-to-gif` | MP4 → GIF | first 5 seconds; 12 fps; 640 px max side | Lossy |
| `gif.webm-to-gif` / `/webm-to-gif` | WebM → GIF | first 5 seconds; 12 fps; 640 px max side | Lossy |
| `gif.apng-to-gif` / `/apng-to-gif` | APNG → GIF | preserve timing; balanced palette | Lossy |
| `gif.to-mp4` / `/gif-to-mp4` | GIF → MP4 | H.264; 30 fps maximum; loop once | Lossy |
| `gif.to-apng` / `/gif-to-apng` | GIF → APNG | preserve timing and loop count | Lossy |
| `gif.mov-to-gif` / `/mov-to-gif` | MOV → GIF | first 5 seconds; 12 fps; 640 px max side | Lossy |
| `gif.avi-to-gif` / `/avi-to-gif` | AVI → GIF | first 5 seconds; 12 fps; 640 px max side | Lossy |
| `gif.to-images` / `/gif-to-images` | GIF → ZIP of PNG frames | all frames; original timing in JSON manifest | Lossy |

### 17.5 Archive and utilities — 6 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `archive.zip-create` / `/zip-maker` | 1–20 local files → ZIP | preserve selected relative names; deflate level 6 | Exact |
| `archive.zip-extract` / `/zip-extractor` | ZIP → individual downloads or ZIP of selected safe entries | select all safe entries; flatten off | Exact |
| `utility.unit` / `/unit-converter` | numeric value and supported unit pair → numeric/text result | auto precision up to 8 significant digits | Exact |
| `utility.time` / `/time-converter` | date/time and IANA time-zone pair → formatted result | user's local zone to UTC; ISO preview | Exact |
| `utility.barcode` / `/barcode-generator` | validated text → PNG or SVG barcode | Code 128; PNG; quiet zone 10 px | Exact |
| `utility.password` / `/password-generator` | option values → locally displayed/copied password | length 20; upper/lower/digit/symbol; ambiguous characters excluded | Exact |

The unit converter supports length, area, volume, mass, temperature, speed, pressure, energy, power, data size, and angle. The time converter uses the runtime's versioned IANA time-zone data and displays the zone identifier and UTC offset used. Barcode formats are Code 128, Code 39, EAN-13, EAN-8, UPC-A, ITF-14, Codabar, and QR; format-specific validation runs before rendering.

### 17.6 Signature and privacy — 2 contracts

| ID / route | Inputs → outputs | Required options and defaults | Contract |
|---|---|---|---|
| `trust.sign-pdf` / `/sign-pdf` | PDF + drawn, typed, or local image signature → PDF | page and placement required; black ink; transparent background | Exact |
| `trust.blur-faces` / `/blur-faces` | JPEG, PNG, WebP → same selected raster format | detect locally; manual box review required; blur radius 24 px | Best effort |

The Sign PDF tool adds a visible signature appearance only. It does not create a cryptographic digital signature, validate identity, request another person's signature, or make a legal-enforceability claim. Blur Faces cannot export until the user has reviewed, added, removed, or accepted all proposed face boxes.

## 18. Design Review Record

The user approved these design sections during the interactive design process:

- Search-first Command Center layout.
- Bright Utility visual direction.
- English-first launch.
- Browser-first architecture and hard privacy boundary.
- Better Auth, Google OAuth, and Neon metadata-only account layer.
- Universal desktop/mobile limits.
- Exact 90-capability launch scope and 39-capability exclusion set.
- Shared tool lifecycle, cancellation, cleanup, result contracts, and error taxonomy.
- Five-layer testing strategy, security controls, internal delivery waves, and all-90 public-launch gate.

This document is the approved product and architecture baseline. Implementation details may refine library versions or internal algorithms, but may not weaken the privacy boundary, silently expand server processing, reduce the active launch scope, or alter the published limits without a new design review.

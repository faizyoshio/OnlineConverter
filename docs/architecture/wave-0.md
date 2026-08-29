# Wave 0 architecture

## File map

- `src/features/capabilities`: approved 90-capability registry, option schema, discovery, search, and release visibility.
- `src/features/validation`: universal limits, magic-byte probes, and cheap/deep capability validation.
- `src/features/workers`: serializable worker protocol, adapter interface, lazy router, and browser controller.
- `src/features/jobs`: normalized error vocabulary, reducer, and workspace runner bridge.
- `src/features/results`: object URL ownership and deterministic cleanup.
- `src/features/telemetry`: closed metadata-only telemetry schema.
- `src/components/workspace`: injected runner UI; no adapter, worker, Blob, or ResultManager import.
- `src/app/tools/[slug]`: active-only route boundary. Planned and disabled routes return 404.

## Adapter protocol

Every converter runs in a browser worker. `EngineRouter` loads one adapter by manifest `adapterKey`; `EngineAdapter` probes format-specific facts, validates adapter-specific constraints, and starts work through serializable `WorkerRequest` and `WorkerResponse` messages. Adapter code never becomes a server route, server action, upload path, or telemetry input.

## Job lifecycle

`WorkspaceJobRunner` cheap-validates selected files and options before loading an engine. After lazy load it runs deep validation, creates a cancellable controller, receives metadata-only reducer actions, and normalizes failures. Loading, processing, success, warning, cancellation, retry, and cleanup use one reducer contract. Raw bytes never enter React job state.

## Result ownership

`ResultManager` validates each local result against the manifest, creates object URLs only for file-bearing results, and revokes every URL on replacement, explicit disposal, and runner disposal. Value results remain local UI values and do not receive download URLs. Archive entry names are checked before download exposure.

## Telemetry boundary

Telemetry accepts only capability ID, closed lifecycle stage, coarse duration/device buckets, normalized error code, app version, and engine version. It rejects filenames, file paths, bytes, hashes, dimensions, page counts, OCR text, previews, URLs, output metadata, raw exceptions, and conversion history. `npm run check:privacy` scans server import paths and forbidden data flows.

## Catalog and routes

Production shows active capabilities only. Preview and local catalog review may show planned cards with `In development`; planned cards are never links and their URLs return 404. Sitemap and static parameters include active capabilities only. Preview responses block indexing.

## Activation gate

A later wave may flip one manifest to `active` only in same reviewed change as its real adapter loader, capability-specific probe and processing path, fixture matrix, universal-limit coverage, cancellation/progress/cleanup checks, privacy scan, accessible `ToolWorkspace` integration, supported-browser E2E evidence, and route metadata verification. A stub, pass-through, relabeled source, or synthetic result never passes this gate.

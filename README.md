# OnlineConverter

Local-first browser conversion tools. Conversion bytes stay on device and run in browser workers.

## Requirements

- Node.js 24.x. Version is pinned by `.node-version` and enforced by `package.json`.
- npm supplied with Node.js.

## Install and run

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run check:privacy
npm run build
npm run verify
```

Browser tests need Playwright browser binaries:

```powershell
npx playwright install chromium firefox webkit
npm run test:e2e
```

## Environment

- `SITE_URL`: required for production builds. Must be an HTTPS public origin, for example `https://converter.example`.
- `CATALOG_PREVIEW=1`: enables visible planned cards outside production for catalog review. Cards remain noninteractive.
- `VERCEL_ENV=preview`: emits noindex robots output and an `X-Robots-Tag` response header.

## Release rule

Wave 0 must not deploy a planned tool as active. A capability changes to `active` only with a real browser-worker adapter, validation/probe coverage, cancellation/progress/cleanup behavior, privacy checks, accessible workspace wiring, fixtures, browser acceptance, and release review.

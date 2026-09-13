# OnlineConverter

A fast, private, **local-first web application** for converting, editing, and transforming documents, images, and files directly inside your browser.

> **Privacy Promise**: Your files **never** leave your device. All processing happens entirely client-side using Web Workers, `OffscreenCanvas`, and local WebAssembly/JavaScript engines. There are no conversion upload endpoints, no file storage servers, and no third-party telemetry tracking your content.

---

## Features & Active Capabilities (29 Tools)

OnlineConverter currently ships with **29 fully functional, client-side tools** across 4 categories:

### 📄 PDF Tools (13)
- **Merge PDF** (`/tools/merge-pdf`): Combine multiple PDF documents into a single document.
- **Split PDF** (`/tools/split-pdf`): Extract page ranges or split PDFs into individual pages.
- **Organize PDF** (`/tools/organize-pdf`): Reorder, duplicate, or delete specific pages.
- **Rotate PDF** (`/tools/rotate-pdf`): Rotate individual pages or entire documents (90°, 180°, 270°).
- **Crop PDF** (`/tools/crop-pdf`): Trim page margins with custom millimetre bounds.
- **Resize PDF** (`/tools/resize-pdf`): Scale and center PDF pages into standard A4 proportions.
- **Delete PDF Pages** (`/tools/delete-pdf-pages`): Remove unwanted pages by page numbers or ranges.
- **Extract PDF Pages** (`/tools/extract-pdf-pages`): Save selected pages as a new combined PDF or ZIP bundle.
- **Add Page Numbers** (`/tools/page-numbers`): Add sequential page numbers with custom position and styling.
- **Watermark PDF** (`/tools/watermark-pdf`): Apply text or image watermarks with opacity and position controls.
- **Flatten PDF** (`/tools/flatten-pdf`): Flatten interactive form fields and annotations permanently.
- **Image to PDF** (`/tools/image-to-pdf`): Assemble PNG, JPEG, or WebP images into a styled PDF.
- **Text to PDF** (`/tools/text-to-pdf`): Convert plain text documents into clean, paginated PDF files.

### 🖼️ Image Tools (11)
- **JPG to PNG / WebP** (`/tools/jpg-to-png-webp`): Convert JPEG images into modern formats.
- **WebP to JPG** (`/tools/webp-to-jpg`): Convert WebP images to JPEG with custom matte background.
- **WebP to PNG** (`/tools/webp-to-png`): Convert WebP images to lossless PNG preserving transparency.
- **JFIF to PNG** (`/tools/jfif-to-png`): Convert JFIF camera images to standard PNG format.
- **Compress JPEG** (`/tools/compress-jpeg`): Reduce JPEG file sizes with fine quality adjustments.
- **Compress WebP** (`/tools/compress-webp`): Optimize WebP files while preserving transparent alpha channels.
- **Resize Image** (`/tools/resize-image`): Adjust dimensions with aspect ratio lock.
- **Crop Image** (`/tools/crop-image`): Crop images with rectangular selection bounds.
- **Circle Crop Image** (`/tools/circle-crop-image`): Create circular avatar crops with transparent outer pixels.
- **Rotate Image** (`/tools/rotate-image`): Rotate photos by 90, 180, or 270 degrees.
- **Flip Image** (`/tools/flip-image`): Mirror images horizontally or vertically.

### 📦 Archive Utilities (2)
- **ZIP Maker** (`/tools/zip-maker`): Package multiple files into a compressed ZIP file locally.
- **ZIP Extractor** (`/tools/zip-extractor`): Inspect and extract archive files safely in memory.

### ⚙️ Everyday Utilities (3)
- **Unit Converter** (`/tools/unit-converter`): Convert length, area, mass, speed, volume, and data sizes.
- **Time Zone Converter** (`/tools/time-converter`): Convert timestamps between IANA global time zones.
- **Password Generator** (`/tools/password-generator`): Generate cryptographically strong random passwords.

---

## Privacy Architecture

1. **Zero Uploads**: File inputs are read exclusively via `FileReader` / `ArrayBuffer` in the client's browser.
2. **Worker Isolation**: Conversion and manipulation workloads run inside isolated Web Workers (`src/features/workers/`), preventing UI freezes and ensuring clean memory garbage collection.
3. **Automated Privacy Verification**: A strict AST verification script (`npm run check:privacy`) ensures that no server component, API route, or telemetry module ever imports binary buffers, files, or engine code.

---

## Getting Started

### Prerequisites
- **Node.js**: `24.x` (enforced via `.node-version` and `package.json`).
- **npm**: version 10+.

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/online-converter.git
cd online-converter

# Install dependencies
npm ci

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing

Every commit and pull request must pass the automated verification gate:

```bash
# Run all quality checks (lint, typecheck, test, check:privacy, build)
npm run verify
```

Individual checks:
```bash
npm run lint          # ESLint with zero warnings
npm run typecheck     # TypeScript strict check (exactOptionalPropertyTypes)
npm test              # Vitest test suite (>470 unit and integration tests)
npm run check:privacy # Zero-leak privacy boundary scanner
npm run build         # Next.js static production build
```

---

## Production Deployment

### 1. Vercel (Recommended)
1. Import the repository into Vercel.
2. Set Framework Preset to **Next.js**.
3. Set the Environment Variable:
   - `SITE_URL`: `https://your-domain.com`
4. Deploy. Next.js App Router will generate all static tool routes automatically.

### 2. Netlify / Cloudflare Pages
1. Build command: `npm run build`
2. Output directory: `.next` (or static export)
3. Environment variables: `SITE_URL=https://your-domain.com`

### 3. Docker (Self-Hosted)
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV SITE_URL=https://converter.your-domain.com
RUN npm run verify

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `SITE_URL` | Production | `http://localhost:3000` | Canonical HTTPS public origin for sitemap and metadata. |
| `VERCEL_ENV` | Optional | `local` | Set to `production` or `preview`. In `preview`, search engines are disallowed via robots.txt. |
| `CATALOG_PREVIEW` | Optional | `0` | Set to `1` in non-production environments to preview planned tools. |

---

## License

MIT License. Open source and built for privacy.

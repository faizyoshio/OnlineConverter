# OnlineConverter

**ScholarKit** — Local-first browser PDF & Document Toolkit

🔒 **100% Privacy** — All processing runs inside your browser. Your unpublished manuscripts, thesis drafts, and confidential lab data never leave your device.

## 📊 Project Overview

- **Tools Available:** 39 document processing tools
- **Architecture:** Static Next.js 15 export (SSG + serverless functions)
- **Processing Engine:** WebAssembly (WASM) + Canvas API
- **Output:** Preview before download (PDF, Word, PPTX, Excel, Image)
- **License:** MIT (open source)

## 🔧 Features

- ✅ **Live Preview** for PDF and images (Office files show local filename + hint)
- ✅ **OCR PDF** — `/tools/ocr-pdf` turns a scanned PDF into searchable PDF + plain text, in-browser
- ✅ **Zero Upload** — All processing runs in browser
- ✅ **Privacy First** — Files never leave your device
- ✅ **Fast & Responsive** — Modern Next.js 15 App Router
- ✅ **TypeScript** - Full type-safety with strict mode
- ✅ **WASM-powered** - Native-speed PDF processing

## 🛠️ Tool Categories

### PDF Tools
- Compress PDF / Decompress PDF
- Merge PDF / Split PDF / Extract pages
- [OCR PDF](https://tools.axelacademicstudio.my.id/tools/ocr-pdf) — scanned PDF → searchable PDF + TXT (local, English)
- PDF to Word / Word to PDF
- PDF to PowerPoint / PowerPoint to PDF
- PDF to Excel / Excel to PDF
- Add watermark / Page numbers / Annotations
- Unlock / Encrypt / Decrypt PDF
- PDF resize

### Image Tools
- Compress JPG / PNG / WebP / HEIC / BMP
- Convert between formats (JPG ↔ PNG ↔ WebP ↔ HEIC ↔ BMP)
- Resize / Crop / Rotate images
- Image to PDF
- PDF to Image (JPG/PNG)

### Text Tools
- Text to PDF
- Word to Text / PDF
- Excel to CSV / Text
- Remove PDF metadata

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.13+:** Required for development
- **npm / yarn / pnpm:** Package manager
- **Modern Browser:** Chrome 90+, Firefox 90+, Safari 14+, Edge 90+

### Installation

```bash
# Clone the repository
git clone https://github.com/faizyoshio/OnlineConverter.git
cd OnlineConverter

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

For static export (recommended for hosting):
```bash
npm run build
npm run export
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
OnlineConverter/
├── src/
│   ├── app/                    # Next.js 15 App Router pages
│   │   └── tools/               # Tool definition pages
│   ├── components/              # React components
│   │   ├── workspace/          # Tool workspace UI
│   │   └── ui/                  # Reusable UI components
│   ├── features/                # Feature modules
│   │   ├── capabilities/       # Tool registry & definitions
│   │   ├── engines/            # WASM processing engines
│   │   ├── jobs/               # Job runner & state management
│   │   ├── preview/            # Preview components
│   │   ├── validation/         # Input validation & type guards
│   │   └── results/            # Result handling & typing
│   ├── lib/                     # Shared utilities
│   ├── styles/                  # Global CSS
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── data/                        # Tool configuration
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── .github/                     # GitHub workflows & templates
├── AGENTS.md                    # Agent instructions
├── CONTRIBUTING.md              # Development guidelines
├── LICENSE                      # MIT License
└── README.md                    # This file
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix  
- `docs:` — Documentation only
- `style:` — Code style (formatting)
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance tasks

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/OnlineConverter.git
cd OnlineConverter

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run typecheck
```

## 🔒 Security

- All processing runs in browser — no data leaves your device
- `.env` files, secrets, and credentials are protected by `.gitignore`
- Security scanning via GitHub CodeQL (weekly)
- Report security issues to faizyoshio@gmail.com

## 📊 Testing

- **Unit Tests:** Vitest (600+ tests)
- **Integration Tests:** Feature coverage
- **E2E Tests:** Playwright browser tests
- **Coverage:** 90%+ target

Run tests:
```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:e2e            # E2E only
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Static Export (All-in-one HTML/JS/CSS)

```bash
npm run build && npm run export
# Output in /out/ directory
```

### GitHub Pages

```bash
npm run build && npm run export
# Push /out/ to gh-pages branch
```

## 📖 Documentation

- **README.md** — Project overview and getting started
- **CONTRIBUTING.md** — Development guide and PR process
- **AGENTS.md** — Agent instructions for Next.js 15
- [Tool Documentation](/docs/tools) — Individual tool guides

## 🧪 API Reference

All processing happens in browser using:
- **pdf-lib** — PDF generation/manipulation
- **pdf.js** — PDF rendering (Mozilla)
- **Tesseract.js** — OCR (WASM-powered)
- **Image libraries** — Compress, convert images

### Tool Definition Pattern

```typescript
definePdf({
  id: \"pdf.compress\",
  slug: \"compress\",
  title: \"Compress PDF\",
  description: \"Reduce PDF file size\",
  resultContract: \"exact-structural\",
  inputMode: \"files\",
  inputs: [pdfFile()],
  result: pdfResult(),
  limits: limits([\"pdf\"], 1, 1),
})
```

## 📈 Roadmap

- [ ] Advanced Settings for all tools (Pro Mode)
- [ ] Better error reporting
- [ ] Batch processing
- [ ] Mobile optimization
- [ ] Dark mode
- [ ] Custom output naming

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/faizyoshio/OnlineConverter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/faizyoshio/OnlineConverter/discussions)
- **Email:** faizyoshio@gmail.com

## 📜 License

MIT License — see [LICENSE](LICENSE) file for details.

---

🔐 **Privacy Notice:** This application processes files entirely in your browser. Nothing is uploaded to our servers or third-party services.

⭐ **Star this repo if you find it useful!**

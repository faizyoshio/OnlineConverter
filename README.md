# OnlineConverter

**ScholarKit** — Local-first browser PDF & Document Toolkit

🔒 **100% Privacy** — All processing runs inside your browser. Your unpublished manuscripts, thesis drafts, and confidential lab data never leave your device.

## Features

- ✅ **38 Tools** for PDF, Image, Word, PowerPoint, Excel, Text processing
- ✅ **Live Preview** for PDF, Word, Image, PPTX, XLSX, TXT files
- ✅ **Zero Upload** — All processing runs in browser (WASM + Canvas)
- ✅ **Privacy First** — Files never leave your device
- ✅ **Fast & Responsive** — Modern Next.js 15 App Router

## Tools Categories

### PDF Tools
- Compress PDF
- Merge & Split PDF
- OCR PDF (Searchable PDF + Text)
- PDF to Word / Word to PDF
- PDF to PowerPoint / PowerPoint to PDF
- PDF to Excel / Excel to PDF
- Add watermark, page numbers, annotations
- Unlock, encrypt, resize PDF

### Image Tools
- Compress JPG, PNG, WebP, HEIC, BMP
- Convert between formats (JPG ↔ PNG ↔ WebP)
- Resize, crop, optimize images

### Convert Tools
- PDF ↔ Word (DOCX)
- PDF ↔ PowerPoint (PPTX)
- PDF ↔ Excel (XLSX)
- Image → PDF
- Text → PDF

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Processing:** WebAssembly (WASM)
- **Preview:** Canvas API
- **Testing:** Vitest (608 tests, 114 test files)

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn or pnpm

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

### Run Tests

```bash
npm test
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture

```
OnlineConverter/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   └── workspace/       # Tool workspace components
│   ├── features/            # Feature modules
│   │   ├── capabilities/    # Tool definitions
│   │   ├── engines/         # Processing engines (WASM)
│   │   ├── jobs/            # Job runner & state
│   │   └── validation/      # Input validation
│   └── lib/                 # Utilities
├── public/                  # Static assets
└── tests/                   # Test files
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

Requires WASM and Canvas support.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**Faiz Yoshio**
- GitHub: [@faizyoshio](https://github.com/faizyoshio)
- Email: faizyoshio@gmail.com

## Acknowledgments

Built for students, researchers, and academics who need privacy-focused document processing tools.

## Live Demo

🚀 [https://tools.axelacademicstudio.my.id](https://tools.axelacademicstudio.my.id)

---

⭐ Star this repo if you find it useful!

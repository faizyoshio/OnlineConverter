# Contributing to OnlineConverter

Thank you for your interest in contributing to OnlineConverter! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/faizyoshio/OnlineConverter/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots (if applicable)

### Suggesting Features

1. Check [Issues](https://github.com/faizyoshio/OnlineConverter/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it's needed
   - Proposed implementation (optional)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write tests for new features
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in X"
   git commit -m "docs: update README"
   ```

   Use conventional commits:
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation only
   - `style:` — Code style (formatting, no logic change)
   - `refactor:` — Code refactoring
   - `test:` — Adding tests
   - `chore:` — Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Describe what your PR does
   - Reference related issues
   - Add screenshots for UI changes

## Development Setup

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/OnlineConverter.git
cd OnlineConverter

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── workspace/          # Tool workspace components
├── features/               # Feature modules
│   ├── capabilities/       # Tool definitions & registry
│   ├── engines/            # Processing engines (WASM)
│   ├── jobs/               # Job runner & state management
│   ├── validation/         # Input validation
│   └── results/            # Result handling
└── lib/                    # Shared utilities
```

## Code Style

- **TypeScript** — Use types, avoid `any`
- **React** — Functional components with hooks
- **Naming** — camelCase for variables, PascalCase for components
- **Formatting** — Prettier (automatic)
- **Linting** — ESLint (automatic)

## Testing

- Write tests for new features
- Maintain test coverage
- Run `npm test` before committing
- All tests must pass

## Adding a New Tool

1. **Define capability** in `src/features/capabilities/registry/`
2. **Create engine** in `src/features/engines/`
3. **Add tests** in `src/features/engines/*.test.ts`
4. **Update documentation**

Example:

```typescript
// src/features/capabilities/registry/pdf.ts
definePdf({
  id: "pdf.your-tool",
  slug: "your-tool",
  title: "Your Tool",
  description: "Description of your tool",
  resultContract: "exact-structural",
  inputMode: "files",
  inputs: [pdfFile()],
  result: pdfResult(),
  limits: limits(["pdf"], 1, 1),
})
```

## Security

- Never commit sensitive data (.env files, API keys, etc.)
- Review `.gitignore` before committing
- Report security issues privately to faizyoshio@gmail.com

## Questions?

- Open a [Discussion](https://github.com/faizyoshio/OnlineConverter/discussions)
- Create an [Issue](https://github.com/faizyoshio/OnlineConverter/issues)
- Email: faizyoshio@gmail.com

## Code of Conduct

Be respectful, inclusive, and constructive. We're building tools for everyone.

---

Thank you for contributing! 🙏

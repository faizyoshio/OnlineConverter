import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const forbiddenServerRoots = [
  "src/features/workers/",
  "src/features/jobs/controller.",
  "src/features/jobs/workspace-runner.",
  "src/features/results/",
  "src/features/engines/",
  "src/components/workspace/",
  "src/engines/",
];
const forbiddenIdentifiers = new Set([
  "filename",
  "fileName",
  "filePath",
  "fileHash",
  "ocrText",
  "previewData",
  "outputBytes",
  "archiveEntryName",
  "conversionHistory",
]);
const forbiddenBinaryIdentifiers = new Set([
  "File",
  "Blob",
  "FileReader",
  "FormData",
  "ReadableStream",
  "ArrayBuffer",
  "Buffer",
  "Uint8Array",
  "Uint16Array",
  "Uint32Array",
  "Uint8ClampedArray",
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
]);

function normalizePath(filePath) {
  return path.resolve(filePath);
}

function displayPath(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function isSourcePath(filePath) {
  return sourceExtensions.includes(path.extname(filePath));
}

function scriptKind(filePath) {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs") || filePath.endsWith(".cjs")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function readSource(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, scriptKind(filePath));
}

function listSourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(target));
    else if (entry.isFile() && isSourcePath(target)) files.push(target);
  }
  return files;
}

function hasTopLevelUseServer(sourceFile) {
  return sourceFile.statements.some((statement) => (
    ts.isExpressionStatement(statement)
    && ts.isStringLiteral(statement.expression)
    && statement.expression.text === "use server"
  ));
}

function discoverServerRoots(rootDir) {
  const sourceDir = path.join(rootDir, "src");
  const roots = [];
  for (const filePath of listSourceFiles(sourceDir)) {
    const relative = displayPath(rootDir, filePath);
    const baseName = path.basename(filePath).replace(path.extname(filePath), "");
    const sourceFile = readSource(filePath);
    if (
      relative.startsWith("src/server/")
      || (relative.startsWith("src/app/") && baseName === "route")
      || hasTopLevelUseServer(sourceFile)
    ) {
      roots.push(filePath);
    }
  }
  return roots;
}

function resolveImport(rootDir, fromFile, specifier) {
  let basePath;
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  } else if (specifier.startsWith("@/")) {
    basePath = path.join(rootDir, "src", specifier.slice(2));
  } else {
    return null;
  }

  const candidates = [basePath];
  for (const extension of sourceExtensions) candidates.push(`${basePath}${extension}`);
  for (const extension of sourceExtensions) candidates.push(path.join(basePath, `index${extension}`));
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function moduleSpecifiers(sourceFile) {
  const specifiers = [];
  function add(node) {
    if (node && ts.isStringLiteral(node)) specifiers.push(node.text);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    if (
      ts.isCallExpression(node)
      && node.arguments.length === 1
      && ts.isStringLiteral(node.arguments[0])
      && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function violation(rootDir, sourceFile, node, message) {
  return {
    file: displayPath(rootDir, sourceFile.fileName),
    line: lineOf(sourceFile, node),
    message,
  };
}

function inspectServerFile(rootDir, sourceFile, violations) {
  const imports = moduleSpecifiers(sourceFile);
  if (imports.includes("client-only")) {
    violations.push(violation(rootDir, sourceFile, sourceFile, "Server-reachable module imports client-only"));
  }

  function visit(node) {
    if (ts.isIdentifier(node) && forbiddenBinaryIdentifiers.has(node.text)) {
      violations.push(violation(rootDir, sourceFile, node, `Forbidden binary primitive: ${node.text}`));
    }
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && ["arrayBuffer", "blob", "formData"].includes(node.expression.name.text)
      && node.arguments.length === 0
    ) {
      const method = node.expression.name.text;
      violations.push(violation(rootDir, sourceFile, node, `Forbidden request body read: request.${method}()`));
    }
    if (ts.isIdentifier(node) && forbiddenIdentifiers.has(node.text)) {
      violations.push(violation(rootDir, sourceFile, node, `Forbidden persisted identifier: ${node.text}`));
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function inspectTelemetrySource(rootDir, filePath, violations) {
  const sourceFile = readSource(filePath);
  function visit(node, inBuilder = false) {
    const enteringBuilder = inBuilder || (
      ts.isFunctionDeclaration(node)
      && node.name?.text === "buildTelemetryEvent"
    );
    if (ts.isIdentifier(node) && forbiddenIdentifiers.has(node.text)) {
      violations.push(violation(rootDir, sourceFile, node, `Forbidden telemetry identifier: ${node.text}`));
    }
    if (enteringBuilder && ts.isSpreadAssignment(node)) {
      violations.push(violation(rootDir, sourceFile, node, "buildTelemetryEvent must not use object spread"));
    }
    ts.forEachChild(node, (child) => visit(child, enteringBuilder));
  }
  visit(sourceFile);
}

function isForbiddenServerModule(rootDir, filePath) {
  const relative = displayPath(rootDir, filePath);
  return forbiddenServerRoots.some((prefix) => relative.startsWith(prefix));
}

export function scanPrivacyBoundary({ rootDir = process.cwd(), roots, telemetryFiles } = {}) {
  const resolvedRoot = normalizePath(rootDir);
  const rootFiles = (roots ?? discoverServerRoots(resolvedRoot)).map(normalizePath);
  const queue = [...new Set(rootFiles)];
  const seen = new Set();
  const violations = [];

  while (queue.length > 0) {
    const filePath = queue.shift();
    if (!filePath || seen.has(filePath) || !fs.existsSync(filePath)) continue;
    seen.add(filePath);
    const sourceFile = readSource(filePath);
    inspectServerFile(resolvedRoot, sourceFile, violations);

    for (const specifier of moduleSpecifiers(sourceFile)) {
      const imported = resolveImport(resolvedRoot, filePath, specifier);
      if (!imported) continue;
      if (isForbiddenServerModule(resolvedRoot, imported)) {
        violations.push(violation(resolvedRoot, sourceFile, sourceFile, `Forbidden server import: ${displayPath(resolvedRoot, imported)}`));
      }
      queue.push(imported);
    }
  }

  const defaultTelemetryFiles = listSourceFiles(path.join(resolvedRoot, "src", "features", "telemetry"));
  for (const filePath of telemetryFiles ?? defaultTelemetryFiles) {
    if (!filePath.includes(".test.")) inspectTelemetrySource(resolvedRoot, filePath, violations);
  }

  return { roots: rootFiles.map((filePath) => displayPath(resolvedRoot, filePath)), violations };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = scanPrivacyBoundary();
  if (report.violations.length > 0) {
    for (const item of report.violations) console.error(`${item.file}:${item.line} ${item.message}`);
    process.exitCode = 1;
  } else {
    console.log("Privacy boundary check passed.");
  }
}

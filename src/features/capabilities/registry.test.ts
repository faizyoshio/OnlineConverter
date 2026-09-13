import { assertValidRegistry, capabilityRegistry, getCapabilityBySlug, validateOptionValues } from "./index";

const expectedCategoryCounts = {
  pdf: 34,
  image: 31,
  gif: 5,
  utility: 5,
  trust: 2,
} as const;

const expectedIds = [
  "pdf.merge", "pdf.split", "pdf.delete-pages", "pdf.extract-pages", "pdf.organize", "pdf.scan",
  "pdf.compress", "pdf.repair", "pdf.ocr", "pdf.image-to-pdf", "pdf.word-to-pdf", "pdf.powerpoint-to-pdf",
  "pdf.excel-to-pdf", "pdf.to-jpg", "pdf.pdf-to-word", "pdf.pdf-to-powerpoint", "pdf.pdf-to-excel",
  "pdf.merge-image", "pdf.add-content", "pdf.annotate", "pdf.rotate", "pdf.crop", "pdf.resize",
  "pdf.page-numbers", "pdf.watermark", "pdf.flatten", "pdf.compare", "pdf.forms", "pdf.converter",
  "pdf.to-image", "pdf.to-text", "pdf.html-to-pdf", "pdf.heic-to-pdf", "pdf.text-to-pdf",
  "image.converter", "image.to-jpg", "image.jpg-to-modern", "image.to-png", "image.to-webp",
  "image.webp-to-jpg", "image.webp-to-png", "image.jfif-to-png", "image.heic-to-jpg",
  "image.heic-to-png", "image.png-to-svg", "image.svg-converter", "image.html-to-image",
  "image.compress", "image.compress-jpeg", "image.compress-png", "image.compress-webp",
  "image.compress-bmp", "image.resize", "image.crop", "image.circle-crop", "image.rotate",
  "image.flip", "image.merge", "image.enlarge", "image.photo-editor", "image.meme",
  "image.color-picker", "image.watermark", "image.color-extractor", "image.signature-resize",
  "gif.compress", "gif.make", "gif.apng-to-gif", "gif.to-apng", "gif.to-images",
  "archive.zip-create", "archive.zip-extract", "utility.unit", "utility.time",
  "utility.password",
  "trust.sign-pdf", "trust.blur-faces",
] as const;

function capability(id: string) {
  const manifest = capabilityRegistry.find((item) => item.id === id);
  expect(manifest, "Missing capability " + id).toBeDefined();
  return manifest!;
}

test("declares 77 unique launch capabilities with only reviewed tools active", () => {
  expect(capabilityRegistry).toHaveLength(77);
  expect(new Set(capabilityRegistry.map((item) => item.id)).size).toBe(77);
  expect(new Set(capabilityRegistry.map((item) => item.slug)).size).toBe(77);
  expect(capabilityRegistry.filter((item) => item.releaseStatus === "active").map((item) => item.id)).toEqual([
    "pdf.merge",
    "pdf.split",
    "pdf.delete-pages",
    "pdf.extract-pages",
    "pdf.organize",
    "pdf.scan",
    "pdf.compress",
    "pdf.repair",
    "pdf.ocr",
    "pdf.image-to-pdf",
    "pdf.word-to-pdf",
    "pdf.powerpoint-to-pdf",
    "pdf.excel-to-pdf",
    "pdf.to-jpg",
    "pdf.pdf-to-word",
    "pdf.pdf-to-powerpoint",
    "pdf.pdf-to-excel",
  ]);
  expect(capabilityRegistry.filter((item) => item.releaseStatus === "planned")).toHaveLength(60);
});

test("keeps the approved manifest order", () => {
  expect(capabilityRegistry.map((item) => item.id)).toEqual(expectedIds);
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
  const manifest = capability("pdf.to-image");
  expect(validateOptionValues(manifest, { format: "png", dpi: 144 })).toEqual({ format: "png", dpi: 144 });
  expect(() => validateOptionValues(manifest, { format: "exe", dpi: 10_000 })).toThrow(/invalid option/i);
  expect(() => validateOptionValues(manifest, { format: "png", dpi: "144" })).toThrow(/invalid option/i);
  expect(() => validateOptionValues(manifest, { format: "png", dpi: 144, upload: true })).toThrow(/invalid option/i);
});

test("rejects duplicate ids and slugs", () => {
  const first = capabilityRegistry[0]!;
  const second = capabilityRegistry[1]!;
  expect(() => assertValidRegistry([first, first])).toThrow(/duplicate capability id/i);
  const duplicateSlug = { ...second, slug: first.slug };
  expect(() => assertValidRegistry([first, duplicateSlug])).toThrow(/duplicate capability slug/i);
});

test("looks up canonical routes", () => {
  expect(getCapabilityBySlug("pdf-to-image")?.id).toBe("pdf.to-image");
  expect(getCapabilityBySlug("missing-tool")).toBeUndefined();
});

test("declares required compatibility inputs and value results", () => {
  const kinds = (id: string) => capability(id).inputs.map((descriptor) => descriptor.kind);
  expect(kinds("image.converter")).toEqual(expect.arrayContaining(["bmp", "heic", "svg"]));
  expect(capability("image.converter").inputs.find((descriptor) => descriptor.kind === "svg")?.probeRule).toBe("sanitized-svg");
  expect(capability("image.html-to-image").inputs).toContainEqual(expect.objectContaining({ kind: "html", probeRule: "sanitized-html" }));
  expect(capability("gif.apng-to-gif").inputs).toContainEqual(expect.objectContaining({ kind: "apng", probeRule: "apng-chunks" }));
  expect(capability("pdf.text-to-pdf").inputs).toContainEqual(expect.objectContaining({ kind: "text", probeRule: "utf8-text" }));

  for (const id of ["utility.unit", "utility.time", "utility.password", "image.color-picker", "image.color-extractor"]) {
    expect(capability(id).result.mode).toBe("value");
  }
  expect(capability("utility.password").result).toEqual(expect.objectContaining({
    mode: "value",
    value: expect.objectContaining({ kind: "password", sensitive: true }),
  }));
});

test("declares safe ZIP extraction result ownership", () => {
  const result = capability("archive.zip-extract").result;
  expect(result.mode).toBe("selected-entries");
  if (result.mode !== "selected-entries") throw new Error("Unexpected ZIP result mode");
  expect(result.files).toContainEqual(expect.objectContaining({
    kind: "binary", mimeType: "application/octet-stream", extension: "preserve",
  }));
  expect(result.files).toContainEqual(expect.objectContaining({
    kind: "zip", mimeType: "application/zip", extension: ".zip",
  }));
});

test("matches the approved compatibility projection", () => {
  const projection = capabilityRegistry.map(({ id, inputMode, inputs, result, limits }) => ({
    id,
    inputMode,
    inputs,
    result,
    limits,
  }));
  expect(projection).toMatchInlineSnapshot(`
    [
      {
        "id": "pdf.merge",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 2,
          "profiles": [
            "pdf",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.split",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "explicit-user-choice",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
            {
              "extension": ".zip",
              "fallback": "explicit-user-choice",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.delete-pages",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.extract-pages",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "explicit-user-choice",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
            {
              "extension": ".zip",
              "fallback": "explicit-user-choice",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.organize",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.scan",
        "inputMode": "camera-or-files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 1,
          "profiles": [
            "image",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.compress",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.repair",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.ocr",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
            "ocr",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
            {
              "extension": ".txt",
              "fallback": "reject",
              "kind": "text",
              "mimeType": "text/plain",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.image-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 1,
          "profiles": [
            "image",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.word-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".docx",
              ".doc",
            ],
            "kind": "docx",
            "mimeTypes": [
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/msword",
            ],
            "probeRule": "zip-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.powerpoint-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pptx",
              ".ppt",
            ],
            "kind": "pptx",
            "mimeTypes": [
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "application/vnd.ms-powerpoint",
            ],
            "probeRule": "zip-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.excel-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".xlsx",
              ".xls",
            ],
            "kind": "xlsx",
            "mimeTypes": [
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-excel",
            ],
            "probeRule": "zip-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.to-jpg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "reject",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".zip",
              "fallback": "listed-fallback",
              "fallbackKind": "jpeg",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.pdf-to-word",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".docx",
              "fallback": "reject",
              "kind": "docx",
              "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.pdf-to-powerpoint",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pptx",
              "fallback": "reject",
              "kind": "pptx",
              "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.pdf-to-excel",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".xlsx",
              "fallback": "reject",
              "kind": "xlsx",
              "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.merge-image",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 20,
          "minimumFiles": 2,
          "profiles": [
            "pdf",
            "image",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.add-content",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 2,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.annotate",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.rotate",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.crop",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.resize",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.page-numbers",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.watermark",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 2,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.flatten",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.compare",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 2,
          "minimumFiles": 2,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".html",
              "fallback": "reject",
              "kind": "html",
              "mimeType": "text/html",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.forms",
        "inputMode": "files-or-blank",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 0,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.converter",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
          {
            "extensions": [
              ".txt",
            ],
            "kind": "text",
            "mimeTypes": [
              "text/plain",
            ],
            "probeRule": "utf8-text",
          },
          {
            "extensions": [
              ".html",
              ".htm",
            ],
            "kind": "html",
            "mimeTypes": [
              "text/html",
            ],
            "probeRule": "sanitized-html",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "explicit-user-choice",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".txt",
              "fallback": "explicit-user-choice",
              "kind": "text",
              "mimeType": "text/plain",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.to-image",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".zip",
              "fallback": "listed-fallback",
              "fallbackKind": "png",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.to-text",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".txt",
              "fallback": "reject",
              "kind": "text",
              "mimeType": "text/plain",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.html-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".html",
              ".htm",
            ],
            "kind": "html",
            "mimeTypes": [
              "text/html",
            ],
            "probeRule": "sanitized-html",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.heic-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 1,
          "profiles": [
            "image",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "pdf.text-to-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".txt",
            ],
            "kind": "text",
            "mimeTypes": [
              "text/plain",
            ],
            "probeRule": "utf8-text",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.converter",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
          {
            "extensions": [
              ".svg",
            ],
            "kind": "svg",
            "mimeTypes": [
              "image/svg+xml",
            ],
            "probeRule": "sanitized-svg",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.to-jpg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
          {
            "extensions": [
              ".svg",
            ],
            "kind": "svg",
            "mimeTypes": [
              "image/svg+xml",
            ],
            "probeRule": "sanitized-svg",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "reject",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.jpg-to-modern",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.to-png",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
          {
            "extensions": [
              ".svg",
            ],
            "kind": "svg",
            "mimeTypes": [
              "image/svg+xml",
            ],
            "probeRule": "sanitized-svg",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "reject",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.to-webp",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
          {
            "extensions": [
              ".svg",
            ],
            "kind": "svg",
            "mimeTypes": [
              "image/svg+xml",
            ],
            "probeRule": "sanitized-svg",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".webp",
              "fallback": "reject",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.webp-to-jpg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "reject",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.webp-to-png",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "reject",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.jfif-to-png",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "reject",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.heic-to-jpg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "reject",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.heic-to-png",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".heic",
              ".heif",
            ],
            "kind": "heic",
            "mimeTypes": [
              "image/heic",
              "image/heif",
            ],
            "probeRule": "heic-brand",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "reject",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.png-to-svg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".svg",
              "fallback": "reject",
              "kind": "svg",
              "mimeType": "image/svg+xml",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.svg-converter",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".svg",
            ],
            "kind": "svg",
            "mimeTypes": [
              "image/svg+xml",
            ],
            "probeRule": "sanitized-svg",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.html-to-image",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".html",
              ".htm",
            ],
            "kind": "html",
            "mimeTypes": [
              "text/html",
            ],
            "probeRule": "sanitized-html",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.compress",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "listed-fallback",
              "fallbackKind": "webp",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "listed-fallback",
              "fallbackKind": "webp",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "reject",
              "kind": "webp",
              "mimeType": "image/webp",
            },
            {
              "extension": ".bmp",
              "fallback": "listed-fallback",
              "fallbackKind": "webp",
              "kind": "bmp",
              "mimeType": "image/bmp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.compress-jpeg",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".jfif",
              ".jfi",
              ".jif",
            ],
            "kind": "jfif",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "reject",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.compress-png",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "reject",
              "kind": "png",
              "mimeType": "image/png",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.compress-webp",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".webp",
              "fallback": "reject",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.compress-bmp",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.resize",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
            {
              "extension": ".bmp",
              "fallback": "explicit-user-choice",
              "kind": "bmp",
              "mimeType": "image/bmp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.crop",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
            {
              "extension": ".bmp",
              "fallback": "explicit-user-choice",
              "kind": "bmp",
              "mimeType": "image/bmp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.circle-crop",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.rotate",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
            {
              "extension": ".bmp",
              "fallback": "explicit-user-choice",
              "kind": "bmp",
              "mimeType": "image/bmp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.flip",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
            {
              "extension": ".bmp",
              "fallback": "explicit-user-choice",
              "kind": "bmp",
              "mimeType": "image/bmp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.merge",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 2,
          "profiles": [
            "image",
            "batch",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.enlarge",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.photo-editor",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.meme",
        "inputMode": "files-or-blank",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 0,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.color-picker",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "mode": "value",
          "value": {
            "copyable": true,
            "kind": "color",
            "sensitive": false,
          },
        },
      },
      {
        "id": "image.watermark",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 2,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "image.color-extractor",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
          {
            "extensions": [
              ".bmp",
            ],
            "kind": "bmp",
            "mimeTypes": [
              "image/bmp",
            ],
            "probeRule": "bmp-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "mode": "value",
          "value": {
            "copyable": true,
            "kind": "palette",
            "sensitive": false,
          },
        },
      },
      {
        "id": "image.signature-resize",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "gif.compress",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".gif",
            ],
            "kind": "gif",
            "mimeTypes": [
              "image/gif",
            ],
            "probeRule": "gif-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "gif",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".gif",
              "fallback": "reject",
              "kind": "gif",
              "mimeType": "image/gif",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "gif.make",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 20,
          "minimumFiles": 2,
          "profiles": [
            "image",
            "batch",
            "gif",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".gif",
              "fallback": "reject",
              "kind": "gif",
              "mimeType": "image/gif",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "gif.apng-to-gif",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".apng",
              ".png",
            ],
            "kind": "apng",
            "mimeTypes": [
              "image/apng",
              "image/png",
            ],
            "probeRule": "apng-chunks",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "gif",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".gif",
              "fallback": "reject",
              "kind": "gif",
              "mimeType": "image/gif",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "gif.to-apng",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".gif",
            ],
            "kind": "gif",
            "mimeTypes": [
              "image/gif",
            ],
            "probeRule": "gif-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "gif",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".apng",
              "fallback": "reject",
              "kind": "apng",
              "mimeType": "image/apng",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "gif.to-images",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".gif",
            ],
            "kind": "gif",
            "mimeTypes": [
              "image/gif",
            ],
            "probeRule": "gif-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "gif",
            "zip",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".zip",
              "fallback": "reject",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "archive.zip-create",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              "*",
            ],
            "kind": "binary",
            "mimeTypes": [
              "application/octet-stream",
            ],
            "probeRule": "opaque-local-file",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 20,
          "minimumFiles": 1,
          "profiles": [
            "batch",
            "zip",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".zip",
              "fallback": "reject",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "archive.zip-extract",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".zip",
            ],
            "kind": "zip",
            "mimeTypes": [
              "application/zip",
              "application/x-zip-compressed",
            ],
            "probeRule": "zip-header",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "zip",
          ],
        },
        "result": {
          "files": [
            {
              "extension": "preserve",
              "fallback": "reject",
              "kind": "binary",
              "mimeType": "application/octet-stream",
            },
            {
              "extension": ".zip",
              "fallback": "reject",
              "kind": "zip",
              "mimeType": "application/zip",
            },
          ],
          "mode": "selected-entries",
        },
      },
      {
        "id": "utility.unit",
        "inputMode": "values",
        "inputs": [],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 0,
          "minimumFiles": 0,
          "profiles": [
            "utility",
          ],
        },
        "result": {
          "mode": "value",
          "value": {
            "copyable": true,
            "kind": "number",
            "sensitive": false,
          },
        },
      },
      {
        "id": "utility.time",
        "inputMode": "values",
        "inputs": [],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 0,
          "minimumFiles": 0,
          "profiles": [
            "utility",
          ],
        },
        "result": {
          "mode": "value",
          "value": {
            "copyable": true,
            "kind": "time",
            "sensitive": false,
          },
        },
      },
      {
        "id": "utility.password",
        "inputMode": "values",
        "inputs": [],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 0,
          "minimumFiles": 0,
          "profiles": [
            "utility",
          ],
        },
        "result": {
          "mode": "value",
          "value": {
            "copyable": true,
            "kind": "password",
            "sensitive": true,
          },
        },
      },
      {
        "id": "trust.sign-pdf",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".pdf",
            ],
            "kind": "pdf",
            "mimeTypes": [
              "application/pdf",
            ],
            "probeRule": "pdf-header",
          },
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": true,
          "maximumFiles": 2,
          "minimumFiles": 1,
          "profiles": [
            "pdf",
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".pdf",
              "fallback": "reject",
              "kind": "pdf",
              "mimeType": "application/pdf",
            },
          ],
          "mode": "files",
        },
      },
      {
        "id": "trust.blur-faces",
        "inputMode": "files",
        "inputs": [
          {
            "extensions": [
              ".jpg",
              ".jpeg",
            ],
            "kind": "jpeg",
            "mimeTypes": [
              "image/jpeg",
            ],
            "probeRule": "jpeg-soi",
          },
          {
            "extensions": [
              ".png",
            ],
            "kind": "png",
            "mimeTypes": [
              "image/png",
            ],
            "probeRule": "png-signature",
          },
          {
            "extensions": [
              ".webp",
            ],
            "kind": "webp",
            "mimeTypes": [
              "image/webp",
            ],
            "probeRule": "webp-riff",
          },
        ],
        "limits": {
          "allowMixedKinds": false,
          "maximumFiles": 1,
          "minimumFiles": 1,
          "profiles": [
            "image",
          ],
        },
        "result": {
          "files": [
            {
              "extension": ".jpg",
              "fallback": "explicit-user-choice",
              "kind": "jpeg",
              "mimeType": "image/jpeg",
            },
            {
              "extension": ".png",
              "fallback": "explicit-user-choice",
              "kind": "png",
              "mimeType": "image/png",
            },
            {
              "extension": ".webp",
              "fallback": "explicit-user-choice",
              "kind": "webp",
              "mimeType": "image/webp",
            },
          ],
          "mode": "files",
        },
      },
    ]
  `);
});

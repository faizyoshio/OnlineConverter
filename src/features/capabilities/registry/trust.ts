import {
  capability,
  colorOption,
  cropBoxOption,
  filesResult,
  input,
  limits,
  numberOption,
  output,
  selectOption,
  toggleOption,
} from "../schema";

export const trustCapabilities = Object.freeze([
  capability({
    id: "trust.sign-pdf", slug: "sign-pdf", title: "Sign PDF",
    description: "Add a visible drawn, typed, or local image signature appearance to a PDF without identity claims.",
    category: "trust", workerFamily: "pdf", resultContract: "exact-structural", inputMode: "files",
    inputs: [input("pdf"), input("jpeg"), input("png"), input("webp")], result: filesResult(output("pdf")),
    optionFields: [
      selectOption("signatureType", "Signature type", "drawn", ["drawn", "typed", "image"]),
      { key: "page", label: "Page", control: "number", defaultValue: null, required: true, minimum: 1, maximum: 100, step: 1 },
      cropBoxOption("placement", "Signature placement", null), colorOption("ink", "Ink color", "#000000"),
      toggleOption("transparentBackground", "Transparent background", true),
    ],
    limits: limits(["pdf", "image"], 1, 2, true), browserRequirements: ["wasm", "canvas"],
    warningCodes: ["visible-signature-only"], unsupportedCodes: ["cryptographic-signature", "identity-validation", "remote-signing"],
    unsupportedMessage: "This tool is not supported for cryptographic signatures, identity validation, remote signing, or legal enforceability claims.",
  }),
  capability({
    id: "trust.blur-faces", slug: "blur-faces", title: "Blur Faces",
    description: "Detect faces locally, require manual box review, and blur approved regions before image export.",
    category: "trust", workerFamily: "image", resultContract: "best-effort-semantic", inputMode: "files",
    inputs: [input("jpeg"), input("png"), input("webp")],
    result: filesResult(output("jpeg", "explicit-user-choice"), output("png", "explicit-user-choice"), output("webp", "explicit-user-choice")),
    optionFields: [selectOption("detection", "Detection", "local", ["local"]), toggleOption("manualReview", "Require manual box review", true), numberOption("blurRadiusPx", "Blur radius", 24, 1, 100), selectOption("target", "Target format", null, ["jpeg", "png", "webp"])],
    limits: limits(["image"], 1, 1), browserRequirements: ["wasm", "canvas", "offscreen-canvas"],
    warningCodes: ["best-effort-result", "manual-review-required"], unsupportedCodes: ["manual-review-unavailable"],
  }),
]);

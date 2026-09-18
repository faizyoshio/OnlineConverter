import {
  capability,
  filesResult,
  input,
  limits,
  numberOption,
  output,
  selectOption,
  toggleOption,
  type CapabilityDefinition,
} from "../schema";

type GifDefinition = Omit<CapabilityDefinition, "category" | "workerFamily" | "resultContract">;

function defineGif(definition: GifDefinition) {
  return capability({
    ...definition,
    category: "gif",
    workerFamily: "image",
    resultContract: "lossy-visual",
    browserRequirements: ["wasm"],
    warningCodes: ["lossy-output", ...(definition.warningCodes ?? [])],
    unsupportedCodes: definition.unsupportedCodes ?? ["codec-unavailable", "drm-protected"],
    unsupportedMessage: "This tool is not supported when the browser cannot decode the local animation codec.",
  });
}

export const gifCapabilities = Object.freeze([
  defineGif({
    id: "gif.compress", slug: "compress-gif", title: "Compress GIF",
    description: "Compress a local GIF with a balanced palette while retaining its full animation duration.",
    inputMode: "files", inputs: [input("gif")], result: filesResult(output("gif")),
    optionFields: [
      selectOption("palette", "Palette", "balanced", ["balanced"]),
      toggleOption("preserveDuration", "Preserve duration", true),
      numberOption("maxFps", "Maximum frame rate", 20, 1, 20),
      numberOption("dither", "Dithering intensity", 50, 0, 100),
    ],
    limits: limits(["gif"], 1, 1),
  }),
  defineGif({
    id: "gif.make", slug: "gif-maker", title: "GIF Maker",
    description: "Build a looping GIF from two to twenty local JPEG, PNG, or WebP images.",
    inputMode: "files", inputs: [input("jpeg"), input("png"), input("webp")], result: filesResult(output("gif")),
    optionFields: [
      numberOption("frameDurationMs", "Frame duration", 500, 20, 10000, 10),
      selectOption("loop", "Loop", "forever", ["forever"]),
      selectOption("fit", "Image fit", "contain", ["contain"]),
      selectOption("palette", "Color palette", "balanced", ["balanced", "adaptive", "fixed"]),
    ],
    limits: limits(["image", "batch", "gif"], 2, 20),
  }),
  defineGif({
    id: "gif.apng-to-gif", slug: "apng-to-gif", title: "APNG to GIF",
    description: "Convert a local APNG animation to GIF while preserving timing with a balanced palette.",
    inputMode: "files", inputs: [input("apng")], result: filesResult(output("gif")),
    optionFields: [toggleOption("preserveTiming", "Preserve timing", true), selectOption("palette", "Palette", "balanced", ["balanced"])],
    limits: limits(["gif"], 1, 1),
  }),
  defineGif({
    id: "gif.to-apng", slug: "gif-to-apng", title: "GIF to APNG",
    description: "Convert a local GIF to APNG while preserving animation timing and loop count.",
    inputMode: "files", inputs: [input("gif")], result: filesResult(output("apng")),
    optionFields: [toggleOption("preserveTiming", "Preserve timing", true), toggleOption("preserveLoopCount", "Preserve loop count", true)],
    limits: limits(["gif"], 1, 1),
  }),
  defineGif({
    id: "gif.to-images", slug: "gif-to-images", title: "GIF to Images",
    description: "Extract every GIF frame as PNG files inside a ZIP with a local timing manifest.",
    inputMode: "files", inputs: [input("gif")], result: filesResult(output("zip")),
    optionFields: [selectOption("frames", "Frames", "all", ["all"]), toggleOption("timingManifest", "Include timing manifest", true)],
    limits: limits(["gif", "zip"], 1, 1),
  }),
]);

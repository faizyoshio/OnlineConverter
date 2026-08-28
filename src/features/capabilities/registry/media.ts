import {
  capability,
  cropBoxOption,
  filesResult,
  input,
  limits,
  numberOption,
  output,
  selectOption,
  toggleOption,
  type CapabilityDefinition,
} from "../schema";

type MediaDefinition = Omit<CapabilityDefinition, "category" | "workerFamily" | "resultContract">;

function defineMedia({ warningCodes = [], unsupportedCodes, ...definition }: MediaDefinition) {
  return capability({
    ...definition,
    category: "media",
    workerFamily: "media",
    resultContract: "lossy-visual",
    browserRequirements: ["wasm"],
    warningCodes: ["lossy-output", ...warningCodes],
    unsupportedCodes: unsupportedCodes ?? ["codec-unavailable", "drm-protected"],
    unsupportedMessage: "This tool is not supported when the browser cannot decode the local codec or the input is DRM protected.",
  });
}

const videoInputs = () => [input("mp4"), input("mov"), input("webm")];
const broadVideoInputs = () => [...videoInputs(), input("avi")];

export const mediaCapabilities = Object.freeze([
  defineMedia({
    id: "media.compress-video", slug: "compress-video", title: "Compress Video",
    description: "Compress local MP4, MOV, or WebM video to bounded H.264 and AAC MP4 output.",
    inputMode: "files", inputs: videoInputs(), result: filesResult(output("mp4")),
    optionFields: [selectOption("preset", "Compression preset", "balanced-h264-aac", ["balanced-h264-aac"]), toggleOption("preserveAspect", "Preserve aspect ratio", true), numberOption("maxFps", "Maximum frame rate", 30, 1, 30)],
    limits: limits(["video"], 1, 1),
  }),
  defineMedia({
    id: "media.compress-mp3", slug: "compress-mp3", title: "Compress MP3",
    description: "Compress a local MP3 file to a predictable one hundred twenty-eight kilobit stream.",
    inputMode: "files", inputs: [input("mp3")], result: filesResult(output("mp3")),
    optionFields: [numberOption("bitrateKbps", "Bitrate", 128, 32, 320), selectOption("mode", "Bitrate mode", "cbr", ["cbr"])],
    limits: limits(["audio"], 1, 1),
  }),
  defineMedia({
    id: "media.compress-wav", slug: "compress-wav", title: "Compress WAV",
    description: "Compress a local WAV to FLAC by default or WAV while preserving supported audio layout.",
    inputMode: "files", inputs: [input("wav")],
    result: filesResult(output("wav", "explicit-user-choice"), output("flac", "explicit-user-choice")),
    optionFields: [selectOption("target", "Target format", "flac", ["wav", "flac"]), toggleOption("preserveChannels", "Preserve channels", true), toggleOption("preserveSampleRate", "Preserve sample rate", true)],
    limits: limits(["audio"], 1, 1),
  }),
  defineMedia({
    id: "media.video-converter", slug: "video-converter", title: "Video Converter",
    description: "Convert approved local video containers to MP4 or WebM using balanced browser codecs.",
    inputMode: "files", inputs: broadVideoInputs(),
    result: filesResult(output("mp4", "explicit-user-choice"), output("webm", "explicit-user-choice")),
    optionFields: [selectOption("target", "Target format", null, ["mp4", "webm"]), selectOption("preset", "Codec preset", "balanced", ["balanced"])],
    limits: limits(["video"], 1, 1),
  }),
  defineMedia({
    id: "media.audio-converter", slug: "audio-converter", title: "Audio Converter",
    description: "Convert MP3, WAV, OGG, AAC, M4A, or FLAC locally to an approved audio output.",
    inputMode: "files", inputs: [input("mp3"), input("wav"), input("ogg"), input("aac"), input("m4a"), input("flac")],
    result: filesResult(output("mp3", "explicit-user-choice"), output("wav", "explicit-user-choice"), output("ogg", "explicit-user-choice"), output("flac", "explicit-user-choice")),
    optionFields: [selectOption("target", "Target format", null, ["mp3", "wav", "ogg", "flac"]), numberOption("lossyBitrateKbps", "Lossy bitrate", 192, 32, 320)],
    limits: limits(["audio"], 1, 1),
  }),
  defineMedia({
    id: "media.mp3-converter", slug: "mp3-converter", title: "MP3 Converter",
    description: "Convert WAV, OGG, AAC, M4A, or FLAC to MP3 at one hundred ninety-two kilobits.",
    inputMode: "files", inputs: [input("wav"), input("ogg"), input("aac"), input("m4a"), input("flac")], result: filesResult(output("mp3")),
    optionFields: [numberOption("bitrateKbps", "Bitrate", 192, 32, 320), selectOption("channels", "Channels", "up-to-stereo", ["up-to-stereo"])],
    limits: limits(["audio"], 1, 1),
  }),
  defineMedia({
    id: "media.mp4-converter", slug: "mp4-converter", title: "MP4 Converter",
    description: "Convert local MOV, WebM, or AVI video to bounded H.264 and AAC MP4 output.",
    inputMode: "files", inputs: [input("mov"), input("webm"), input("avi")], result: filesResult(output("mp4")),
    optionFields: [selectOption("preset", "Codec preset", "balanced-h264-aac", ["balanced-h264-aac"]), toggleOption("capSourceDimensions", "Cap source dimensions", true)],
    limits: limits(["video"], 1, 1),
  }),
  defineMedia({
    id: "media.mp4-to-mp3", slug: "mp4-to-mp3", title: "MP4 to MP3",
    description: "Extract the full local audio track from an MP4 into a one hundred ninety-two kilobit MP3.",
    inputMode: "files", inputs: [input("mp4")], result: filesResult(output("mp3")),
    optionFields: [numberOption("bitrateKbps", "Bitrate", 192, 32, 320), toggleOption("fullDuration", "Use full duration", true)],
    limits: limits(["video", "audio"], 1, 1),
  }),
  defineMedia({
    id: "media.video-to-mp3", slug: "video-to-mp3", title: "Video to MP3",
    description: "Extract full-duration audio from an approved local video into an MP3 file.",
    inputMode: "files", inputs: broadVideoInputs(), result: filesResult(output("mp3")),
    optionFields: [numberOption("bitrateKbps", "Bitrate", 192, 32, 320), toggleOption("fullDuration", "Use full duration", true)],
    limits: limits(["video", "audio"], 1, 1),
  }),
  defineMedia({
    id: "media.mov-to-mp4", slug: "mov-to-mp4", title: "MOV to MP4",
    description: "Convert a local MOV file to MP4 using a balanced H.264 and AAC preset.",
    inputMode: "files", inputs: [input("mov")], result: filesResult(output("mp4")),
    optionFields: [selectOption("preset", "Codec preset", "balanced-h264-aac", ["balanced-h264-aac"])],
    limits: limits(["video"], 1, 1),
  }),
  defineMedia({
    id: "media.mp3-to-ogg", slug: "mp3-to-ogg", title: "MP3 to OGG",
    description: "Convert a local MP3 file to OGG Vorbis using quality level five by default.",
    inputMode: "files", inputs: [input("mp3")], result: filesResult(output("ogg")),
    optionFields: [numberOption("quality", "Vorbis quality", 5, 0, 10)], limits: limits(["audio"], 1, 1),
  }),
  defineMedia({
    id: "media.crop-video", slug: "crop-video", title: "Crop Video",
    description: "Crop a local video visually and encode the bounded result as balanced H.264 and AAC MP4.",
    inputMode: "files", inputs: videoInputs(), result: filesResult(output("mp4")),
    optionFields: [cropBoxOption("cropBox", "Crop box", null), selectOption("preset", "Codec preset", "balanced-h264-aac", ["balanced-h264-aac"])],
    limits: limits(["video"], 1, 1),
  }),
  defineMedia({
    id: "media.trim-video", slug: "trim-video", title: "Trim Video",
    description: "Trim an approved local video between explicit times with frame-accurate MP4 re-encoding.",
    inputMode: "files", inputs: broadVideoInputs(), result: filesResult(output("mp4")),
    optionFields: [
      { key: "startSeconds", label: "Start time", control: "number", defaultValue: null, required: true, minimum: 0, maximum: 180, step: 0.001 },
      { key: "endSeconds", label: "End time", control: "number", defaultValue: null, required: true, minimum: 0, maximum: 180, step: 0.001 },
      selectOption("encoding", "Encoding", "frame-accurate", ["frame-accurate"]),
    ],
    limits: limits(["video"], 1, 1),
  }),
]);

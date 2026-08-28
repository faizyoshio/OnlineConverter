import { capabilityRegistry } from "@/features/capabilities";
import { HEADERS } from "@/test/fixtures/headers";
import { createCapabilityValidator } from "./capability-validator";
import type { ProbeAndValidateAdapter } from "./types";

function manifest(id: string) {
  const value = capabilityRegistry.find((item) => item.id === id);
  expect(value).toBeDefined();
  return value!;
}

function fileBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function adapterReturning(probeResult: Awaited<ReturnType<ProbeAndValidateAdapter["probe"]>>) {
  return {
    probe: vi.fn(async () => probeResult),
    validate: vi.fn(async () => []),
  } satisfies ProbeAndValidateAdapter;
}

test("rejects an exact signature mismatch before adapter loading", async () => {
  const validator = createCapabilityValidator();
  const file = new File([fileBytes(HEADERS.jpeg)], "picture.png", { type: "image/png" });
  const adapter = adapterReturning({ kind: "png", probeRule: "png-signature", bytes: file.size });

  const issues = await validator.validateWithAdapter(manifest("image.compress-png"), [file], {}, adapter);

  expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unsupported-format" })]));
  expect(adapter.probe).not.toHaveBeenCalled();
  expect(adapter.validate).not.toHaveBeenCalled();
  expect(validator).not.toHaveProperty("worker");
  expect(validator).not.toHaveProperty("controller");
});

test("ignores a declared MIME when exact bytes conflict", async () => {
  const validator = createCapabilityValidator();
  const file = new File([fileBytes(HEADERS.pdf)], "document.png", { type: "image/png" });
  const issues = await validator.validateCheap(manifest("image.compress-png"), [file], {});
  expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unsupported-format" })]));
});

test("uses the adapter to resolve an ISO-BMFF candidate", async () => {
  const validator = createCapabilityValidator();
  const file = new File([fileBytes(HEADERS.heic)], "capture.heic", { type: "image/heic" });
  const adapter = adapterReturning({ kind: "heic", probeRule: "heic-brand", bytes: file.size, width: 100, height: 100 });

  await expect(validator.validateWithAdapter(manifest("image.heic-to-jpg"), [file], {}, adapter)).resolves.toEqual([]);
  expect(adapter.probe).toHaveBeenCalledTimes(1);
  expect(adapter.validate).toHaveBeenCalledTimes(1);
});

test("rejects the adapter-resolved ISO-BMFF kind before capability validation", async () => {
  const validator = createCapabilityValidator();
  const file = new File([fileBytes(HEADERS.heic)], "capture.heic", { type: "image/heic" });
  const adapter = adapterReturning({ kind: "mp4", probeRule: "iso-bmff-brand", bytes: file.size, durationSeconds: 1, width: 100, height: 100 });

  const issues = await validator.validateWithAdapter(manifest("image.heic-to-jpg"), [file], {}, adapter);
  expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unsupported-format" })]));
  expect(adapter.validate).not.toHaveBeenCalled();
});

test("converts option validation failures and stops before probing", async () => {
  const validator = createCapabilityValidator();
  const file = new File([fileBytes(HEADERS.heic)], "capture.heic", { type: "image/heic" });
  const adapter = adapterReturning({ kind: "heic", probeRule: "heic-brand", bytes: file.size });

  const issues = await validator.validateWithAdapter(manifest("image.heic-to-jpg"), [file], { quality: "90" }, adapter);
  expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "malformed-input", field: "options" })]));
  expect(adapter.probe).not.toHaveBeenCalled();
});

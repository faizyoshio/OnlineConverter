import type { EngineAdapter } from "./adapter";
import { EngineRouter } from "./router";

function adapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    probe: vi.fn(),
    validate: vi.fn(),
    createWorker: vi.fn(),
  };
}

test("registers loaders lazily and caches the resolved adapter", async () => {
  const router = new EngineRouter();
  const engine = adapter();
  const loader = vi.fn(async () => engine);
  router.register("pdf.merge", loader);

  expect(router.has("pdf.merge")).toBe(true);
  expect(loader).not.toHaveBeenCalled();
  await expect(Promise.all([router.load("pdf.merge"), router.load("pdf.merge")])).resolves.toEqual([engine, engine]);
  expect(loader).toHaveBeenCalledTimes(1);
});

test("rejects duplicate registrations and unknown adapter keys", async () => {
  const router = new EngineRouter();
  router.register("pdf.merge", async () => adapter());
  expect(() => router.register("pdf.merge", async () => adapter())).toThrow(/duplicate/i);
  await expect(router.load("missing.adapter")).rejects.toEqual(expect.objectContaining({ code: "engine-load-failed", phase: "loading-engine" }));
});

test("drops a rejected cache entry so explicit retry reloads", async () => {
  const router = new EngineRouter();
  const engine = adapter();
  const loader = vi.fn()
    .mockRejectedValueOnce(new Error("private loader detail"))
    .mockResolvedValueOnce(engine);
  router.register("image.converter", loader);

  await expect(router.load("image.converter")).rejects.toEqual(expect.objectContaining({ code: "engine-load-failed" }));
  await expect(router.load("image.converter")).resolves.toBe(engine);
  expect(loader).toHaveBeenCalledTimes(2);
});

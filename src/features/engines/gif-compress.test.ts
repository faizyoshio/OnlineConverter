import { describe, test, expect } from "vitest";
import { createGifCompressAdapter } from "./gif-compress";

describe("GIF Compress Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifCompressAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("gif");
  });
  test("validate returns empty", async () => {
    const adapter = createGifCompressAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});

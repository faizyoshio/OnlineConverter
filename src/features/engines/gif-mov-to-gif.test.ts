import { describe, test, expect } from "vitest";
import { createGifMovToGifAdapter } from "./gif-mov-to-gif";

describe("MOV to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifMovToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mov");
  });
  test("validate returns empty", async () => {
    const adapter = createGifMovToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});

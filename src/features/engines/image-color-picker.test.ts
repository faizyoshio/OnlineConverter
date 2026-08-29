import { describe, test, expect } from "vitest";
import { createImageColorPickerAdapter } from "./image-color-picker";

describe("Color Picker Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageColorPickerAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageColorPickerAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});

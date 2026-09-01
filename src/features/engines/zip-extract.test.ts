import { describe, test, expect } from "vitest";
import { createZip } from "@/engines/utility/operations";
import { createZipExtractAdapter } from "./zip-extract";

async function validZip(): Promise<File> {
  const bytes = await createZip([{ name: "a.txt", bytes: new TextEncoder().encode("a") }]);
  return new File([Uint8Array.from(bytes)], "test.zip", { type: "application/zip" });
}

describe("ZIP Extract Adapter", () => {
  test("probe returns zip kind", async () => {
    const adapter = createZipExtractAdapter();
    const probe = await adapter.probe(await validZip());
    expect(probe.kind).toBe("zip");
    expect(probe.probeRule).toBe("zip-header");
  });

  test("validate returns empty for valid inputs", async () => {
    const adapter = createZipExtractAdapter();
    const issues = await adapter.validate([await validZip()], {});
    expect(issues).toEqual([]);
  });
});

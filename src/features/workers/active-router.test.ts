import { capabilityRegistry } from "@/features/capabilities";
import { createActiveEngineRouter } from "./active-router";

test("registers exactly the release-gated adapters", () => {
  const router = createActiveEngineRouter();

  for (const capability of capabilityRegistry) {
    expect(router.has(capability.adapterKey)).toBe(capability.releaseStatus === "active");
  }
});

const activeCapabilities = capabilityRegistry.filter((cap) => cap.releaseStatus === "active");

test.each(activeCapabilities.map((cap) => [cap.id, cap.adapterKey]))(
  "registers the active adapter for %s (%s)",
  (_id, adapterKey) => {
    expect(createActiveEngineRouter().has(adapterKey)).toBe(true);
  },
);


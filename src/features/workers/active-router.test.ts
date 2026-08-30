import { capabilityRegistry } from "@/features/capabilities";
import { createActiveEngineRouter } from "./active-router";

test("registers exactly the release-gated adapters", () => {
  const router = createActiveEngineRouter();

  for (const capability of capabilityRegistry) {
    expect(router.has(capability.adapterKey), capability.id).toBe(capability.releaseStatus === "active");
  }
});

import { capabilityRegistry } from "./index";
import { getVisibleCapabilities } from "./visibility";

const activeIds = capabilityRegistry
  .filter((item) => item.releaseStatus === "active")
  .map((item) => item.id);

test("has exactly 38 active tools in capabilityRegistry", () => {
  expect(activeIds).toHaveLength(38);
});

test("production hides planned capabilities while keeping active capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "production", previewRequested: true }).map((item) => item.id)).toEqual(activeIds);
});

test("preview review mode returns planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "preview", previewRequested: true })).toHaveLength(capabilityRegistry.length);
});

test("local mode requires an explicit preview request for planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "local", previewRequested: false }).map((item) => item.id)).toEqual(activeIds);
});

test("active capabilities remain visible in every environment", () => {
  const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };
  expect(getVisibleCapabilities([active], { environment: "production", previewRequested: false })).toEqual([active]);
});

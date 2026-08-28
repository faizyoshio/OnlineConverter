import { capabilityRegistry } from "./index";
import { getVisibleCapabilities } from "./visibility";

test("production hides every planned capability", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "production", previewRequested: true })).toEqual([]);
});

test("preview review mode returns planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "preview", previewRequested: true })).toHaveLength(90);
});

test("local mode requires an explicit preview request for planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "local", previewRequested: false })).toEqual([]);
});

test("active capabilities remain visible in every environment", () => {
  const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };
  expect(getVisibleCapabilities([active], { environment: "production", previewRequested: false })).toEqual([active]);
});

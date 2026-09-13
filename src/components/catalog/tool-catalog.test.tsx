import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { capabilityRegistry } from "@/features/capabilities";
import { ToolCatalog } from "./tool-catalog";

const activeTools = capabilityRegistry.filter((c) => c.releaseStatus === "active");

test("renders 8 category group sections on default view", () => {
  render(<ToolCatalog capabilities={activeTools} previewMode={false} />);
  expect(screen.getByText("OPTIMIZE PDF")).toBeVisible();
  expect(screen.getByText("MERGE & SPLIT")).toBeVisible();
  expect(screen.getByText("VIEW & EDIT")).toBeVisible();
  expect(screen.getByText("CONVERT TO PDF")).toBeVisible();
  expect(screen.getByText("CONVERT FROM PDF")).toBeVisible();
  expect(screen.getByText("PDF SECURITY")).toBeVisible();
  expect(screen.getByText("OPTIMIZE IMAGE")).toBeVisible();
  expect(screen.getByText("CONVERT IMAGE")).toBeVisible();
});

test("filters by group and clears empty result", async () => {
  const user = userEvent.setup();
  render(<ToolCatalog capabilities={activeTools} previewMode={false} />);
  await user.click(screen.getByRole("button", { name: "Merge & Split" }));
  expect(screen.getByText("Merge PDF")).toBeVisible();
  expect(screen.getByText("Split PDF")).toBeVisible();

  await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "nonexistentqueryxyz");
  expect(screen.getByText(/no tools match/i)).toBeVisible();

  await user.click(screen.getByRole("button", { name: /clear filters/i }));
  expect(screen.getByRole("status")).toHaveTextContent("38 tools");
});

test("announces the result count", () => {
  render(<ToolCatalog capabilities={activeTools.slice(0, 3)} previewMode={false} />);
  expect(screen.getByRole("status")).toHaveTextContent("3 tools");
});

test("renders active tools as links", () => {
  const active = activeTools[0]!;
  render(<ToolCatalog capabilities={[active]} previewMode={false} />);
  expect(screen.getByRole("link", { name: new RegExp(active.title, "i") })).toHaveAttribute("href", `/tools/${active.slug}`);
});

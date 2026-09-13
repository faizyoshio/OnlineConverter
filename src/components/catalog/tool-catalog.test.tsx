import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { capabilityRegistry } from "@/features/capabilities";
import { ToolCatalog } from "./tool-catalog";

test("filters the catalog without turning planned cards into links", async () => {
  const user = userEvent.setup();
  render(<ToolCatalog capabilities={capabilityRegistry} previewMode />);
  await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "pdf to jpg");
  expect(screen.getByText("PDF to JPG")).toBeVisible();
  expect(screen.queryByRole("link", { name: /pdf to jpg/i })).not.toBeInTheDocument();
  expect(screen.getByText(/in development/i)).toBeVisible();
});

test("announces the result count", () => {
  render(<ToolCatalog capabilities={capabilityRegistry.slice(0, 3)} previewMode />);
  expect(screen.getByRole("status")).toHaveTextContent("3 tools");
});

test("filters by category and clears an empty result", async () => {
  const user = userEvent.setup();
  render(<ToolCatalog capabilities={capabilityRegistry.slice(0, 30)} previewMode />);
  await user.click(screen.getByRole("button", { name: "Figures & Images" }));
  await user.type(screen.getByRole("searchbox", { name: /search tools/i }), "video");
  expect(screen.getByText(/no tools match/i)).toBeVisible();
  await user.click(screen.getByRole("button", { name: /clear filters/i }));
  expect(screen.getByRole("status")).toHaveTextContent("30 tools");
});

test("renders active tools as links", () => {
  const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };
  render(<ToolCatalog capabilities={[active]} previewMode={false} />);
  expect(screen.getByRole("link", { name: /merge pdf/i })).toHaveAttribute("href", "/tools/merge-pdf");
});

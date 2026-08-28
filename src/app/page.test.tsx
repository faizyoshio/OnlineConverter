import { render, screen } from "@testing-library/react";
import HomePage from "./page";

test("introduces local browser conversion", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: /convert files locally/i })).toBeVisible();
  expect(screen.getByText(/files never leave your device/i)).toBeVisible();
});

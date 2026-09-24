import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { capabilityRegistry } from "@/features/capabilities";
import { CompressionSettings } from "./compression-settings";

const jpegCompress = capabilityRegistry.find((c) => c.id === "image.compress-jpeg")!;
const webpCompress = capabilityRegistry.find((c) => c.id === "image.compress-webp")!;

describe("CompressionSettings", () => {
  test("renders collapsible header and toggles content visibility", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();
    render(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "quality", quality: 75, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    const headerBtn = screen.getByRole("button", { name: /compression settings \(optional\)/i });
    expect(headerBtn).toBeVisible();
    expect(headerBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Quality")).toBeVisible();

    await user.click(headerBtn);
    expect(headerBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Quality")).not.toBeInTheDocument();

    await user.click(headerBtn);
    expect(headerBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Quality")).toBeVisible();
  });

  test("renders quality mode with slider and tooltip pill by default", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();
    render(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "quality", quality: 40, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    expect(screen.getByText("40%")).toBeVisible();
    const slider = screen.getByRole("slider", { name: /quality 40%/i });
    expect(slider).toHaveValue("40");

    await user.click(slider);
    expect(slider).toBeVisible();
  });

  test("switches between Max File Size and Quality modes", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();
    const { rerender } = render(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "quality", quality: 75, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    const maxFileRadio = screen.getByRole("radio", { name: /max file size \(mb\)/i });
    await user.click(maxFileRadio);
    expect(setOption).toHaveBeenCalledWith("compressionMode", "maxFileSize");

    rerender(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "maxFileSize", maxFileSizeMb: 200, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    const maxFileInput = screen.getByPlaceholderText("Enter Max File Size");
    expect(maxFileInput).toBeVisible();
    expect(maxFileInput).toHaveValue(200);

    const qualityRadio = screen.getByRole("radio", { name: /quality/i });
    await user.click(qualityRadio);
    expect(setOption).toHaveBeenCalledWith("compressionMode", "quality");
  });

  test("handles typing and clearing in max file size input", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();
    render(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "maxFileSize", maxFileSizeKb: null, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    const input = screen.getByPlaceholderText("Enter Max File Size");
    expect(input).toHaveValue(null);

    await user.type(input, "350");
    expect(setOption).toHaveBeenCalledWith("maxFileSizeMb", 3);
  });

  test("renders secondary academic options for JPEG and WebP", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();
    const { rerender } = render(
      <CompressionSettings
        capability={jpegCompress}
        options={{ compressionMode: "quality", quality: 75, stripMetadata: true }}
        setOption={setOption}
      />,
    );

    const jpegToggle = screen.getByRole("checkbox", { name: /strip nonessential metadata/i });
    expect(jpegToggle).toBeChecked();
    await user.click(jpegToggle);
    expect(setOption).toHaveBeenCalledWith("stripMetadata", false);

    rerender(
      <CompressionSettings
        capability={webpCompress}
        options={{ compressionMode: "quality", quality: 75, preserveAlpha: true }}
        setOption={setOption}
      />,
    );

    const webpToggle = screen.getByRole("checkbox", { name: /preserve alpha/i });
    expect(webpToggle).toBeChecked();
    await user.click(webpToggle);
    expect(setOption).toHaveBeenCalledWith("preserveAlpha", false);
  });
});

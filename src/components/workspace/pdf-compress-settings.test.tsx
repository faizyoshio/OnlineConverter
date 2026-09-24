import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfCompressSettings } from "./pdf-compress-settings";
import { capabilityRegistry } from "@/features/capabilities";

const compressCapability = capabilityRegistry.find((c) => c.id === "pdf.compress")!;

describe("PdfCompressSettings", () => {
  test("renders 4 compression presets with titles and subtitles", () => {
    render(
      <PdfCompressSettings
        capability={compressCapability}
        options={{ preset: "sedang", customQuality: 80 }}
        setOption={() => {}}
      />
    );

    expect(screen.getByText(compressCapability.title)).toBeInTheDocument();
    expect(screen.getByText(compressCapability.description)).toBeInTheDocument();

    expect(screen.getByText("Dasar")).toBeInTheDocument();
    expect(screen.getByText("Kompresi dasar, kualitas tinggi")).toBeInTheDocument();

    expect(screen.getByText("Sedang")).toBeInTheDocument();
    expect(screen.getByText("Kompresi baik, kualitas baik")).toBeInTheDocument();

    expect(screen.getByText("Kuat")).toBeInTheDocument();
    expect(screen.getByText("Kompresi tinggi, kualitas lebih rendah")).toBeInTheDocument();
    expect(screen.getByText("Terkecil")).toBeInTheDocument();

    expect(screen.getByText("Kustom")).toBeInTheDocument();
    expect(screen.getByText("Target ukuran file (MB), kualitas gambar disesuaikan")).toBeInTheDocument();
  });

  test("allows selecting a preset card", async () => {
    const user = userEvent.setup();
    const setOption = vi.fn();

    render(
      <PdfCompressSettings
        capability={compressCapability}
        options={{ preset: "sedang", customQuality: 80 }}
        setOption={setOption}
      />
    );

    const dasarCard = screen.getByText("Dasar");
    await user.click(dasarCard);

    expect(setOption).toHaveBeenCalledWith("preset", "dasar");
  });

  test("shows custom quality slider when kustom preset is selected", () => {
    render(
      <PdfCompressSettings
        capability={compressCapability}
        options={{ preset: "kustom", maxFileSizeMb: 65 }}
        setOption={() => {}}
      />
    );

    expect(screen.getByText("65 MB")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

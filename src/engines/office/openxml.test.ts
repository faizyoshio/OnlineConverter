import { describe, expect, test } from "vitest";
import {
  createDocx,
  extractTextFromDocx,
  createPptx,
  extractTextFromPptx,
  createXlsx,
  extractDataFromXlsx,
} from "./openxml";

describe("OpenXML Engine", () => {
  test("creates and extracts DOCX text", async () => {
    const paragraphs = ["Chapter 1: Introduction to Research", "Methodology and Experimental Design"];
    const docxBytes = await createDocx(paragraphs);
    expect(docxBytes.length).toBeGreaterThan(100);

    const extracted = await extractTextFromDocx(docxBytes);
    expect(extracted).toContain("Chapter 1: Introduction to Research");
    expect(extracted).toContain("Methodology and Experimental Design");
  });

  test("creates and extracts PPTX slides", async () => {
    const slides = ["Slide 1: Thesis Defense", "Slide 2: Results & Discussion"];
    const pptxBytes = await createPptx(slides);
    expect(pptxBytes.length).toBeGreaterThan(100);

    const extracted = await extractTextFromPptx(pptxBytes);
    expect(extracted.length).toBe(2);
    expect(extracted[0]).toContain("Thesis Defense");
    expect(extracted[1]).toContain("Results & Discussion");
  });

  test("creates and extracts XLSX data", async () => {
    const data = [
      ["Metric", "Value"],
      ["Accuracy", "0.98"],
      ["Precision", "0.95"],
    ];
    const xlsxBytes = await createXlsx(data);
    expect(xlsxBytes.length).toBeGreaterThan(100);

    const extracted = await extractDataFromXlsx(xlsxBytes);
    expect(extracted.length).toBe(3);
    expect(extracted[0]).toEqual(["Metric", "Value"]);
    expect(extracted[1]).toEqual(["Accuracy", "0.98"]);
  });
});

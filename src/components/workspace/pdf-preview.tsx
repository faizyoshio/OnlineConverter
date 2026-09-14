"use client";

import type { CapabilityManifest } from "@/features/capabilities";

interface PdfPreviewProps {
  capability: CapabilityManifest;
  files: readonly File[];
}

export function PdfPreview({ capability, files }: PdfPreviewProps) {
  if (files.length === 0) return null;

  const pdfFile = files[0];
  const previewUrl = URL.createObjectURL(pdfFile);

  return (
    <div className="pdf-preview-wrapper">
      <iframe
        src={previewUrl}
        className="pdf-preview"
        title={capability.title}
        sandbox="allow-same-origin"
      />
      <button
        onClick={() => URL.revokeObjectURL(previewUrl)}
        className="button button--secondary"
      >
        Bersihkan preview
      </button>
    </div>
  );
}
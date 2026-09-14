"use client";

import type { CapabilityManifest } from "@/features/capabilities";

interface ImagePreviewProps {
  capability: CapabilityManifest;
  files: readonly File[];
}

export function ImagePreview({ capability, files }: ImagePreviewProps) {
  if (files.length === 0) return null;

  const imageFile = files[0];
  const previewUrl = URL.createObjectURL(imageFile);

  return (
    <div className="image-preview-wrapper">
      <img
        src={previewUrl}
        className="image-preview"
        alt={capability.title}
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
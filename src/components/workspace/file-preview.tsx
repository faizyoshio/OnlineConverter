"use client";

import type { CapabilityManifest } from "@/features/capabilities";

interface FilePreviewProps {
  capability: CapabilityManifest;
  files: readonly File[];
}

const supportedTypes = [
  "pdf", "image", "docx", "pptx", "xlsx", "txt", "csv"
];

export function FilePreview({ capability, files }: FilePreviewProps) {
  if (files.length === 0) return null;

  const file = files[0];
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isPptx = file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const isXlsx = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const isText = file.type.startsWith("text/");

  if (!isPdf && !isImage && !isDocx && !isPptx && !isXlsx && !isText) {
    return null;
  }

  const previewUrl = URL.createObjectURL(file);

  return (
    <div className="file-preview-wrapper">
      {isPdf && (
        <iframe
          src={previewUrl}
          className="file-preview"
          title={capability.title}
          sandbox="allow-same-origin"
        />
      )}
      {(isImage || isDocx || isPptx || isXlsx || isText) && (
        <img
          src={previewUrl}
          className="file-preview"
          alt={capability.title}
        />
      )}
      <button
        onClick={() => URL.revokeObjectURL(previewUrl)}
        className="button button--secondary"
      >
        Bersihkan preview
      </button>
    </div>
  );
}
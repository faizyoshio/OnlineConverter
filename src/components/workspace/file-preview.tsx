"use client";

import { useEffect, useState } from "react";
import type { CapabilityManifest } from "@/features/capabilities";

type FilePreviewProps = {
  capability: CapabilityManifest;
  files: readonly File[];
};

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(file.name);
}

function isDocx(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  );
}

function isOffice(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.includes("wordprocessingml") ||
    file.type.includes("presentationml") ||
    file.type.includes("spreadsheetml") ||
    name.endsWith(".docx") ||
    name.endsWith(".pptx") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".doc")
  );
}

function isText(file: File): boolean {
  return file.type.startsWith("text/") || /\.(txt|csv|md)$/i.test(file.name);
}

export function FilePreview({ capability, files }: FilePreviewProps) {
  const file = files[0];
  const [url, setUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      setTextPreview(null);
      setDocxHtml(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    if (isText(file)) {
      void file
        .slice(0, 4000)
        .text()
        .then(setTextPreview)
        .catch(() => setTextPreview(null));
    } else if (isDocx(file)) {
      setTextPreview(null);
      void file
        .arrayBuffer()
        .then((buffer) => import("mammoth").then((m) => m.convertToHtml({ arrayBuffer: buffer })))
        .then((result) => setDocxHtml(result.value || null))
        .catch(() => setDocxHtml(null));
    } else {
      setTextPreview(null);
      setDocxHtml(null);
    }
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file || !url) return null;

  if (isPdf(file)) {
    return (
      <div className="workspace-preview">
        <iframe
          className="workspace-preview__frame"
          src={url}
          title={`${capability.title} preview`}
        />
      </div>
    );
  }

  if (isImage(file)) {
    return (
      <div className="workspace-preview">
        <img className="workspace-preview__image" src={url} alt={`${file.name} preview`} />
      </div>
    );
  }

  if (isText(file) && textPreview) {
    return (
      <div className="workspace-preview">
        <pre className="workspace-preview__text">{textPreview}</pre>
      </div>
    );
  }

  if (isDocx(file) && docxHtml) {
    return (
      <div className="workspace-preview">
        {/* ponytail: sanitized at source (mammoth emits p/table/img only); add DOMPurify when styleMap passthrough grows */}
        <div className="workspace-preview__docx" dangerouslySetInnerHTML={{ __html: docxHtml }} />
      </div>
    );
  }

  if (isOffice(file) || isText(file)) {
    return (
      <div className="workspace-preview workspace-preview--meta">
        <p className="workspace-preview__name">{file.name}</p>
        <p className="workspace-preview__hint">
          Browser cannot render this format inline. File stays local — run conversion to download.
        </p>
      </div>
    );
  }

  return null;
}

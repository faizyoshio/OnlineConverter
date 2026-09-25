"use client";

import type { ChangeEvent, DragEvent } from "react";
import type { CapabilityManifest } from "@/features/capabilities";

type DropZoneProps = {
  capability: CapabilityManifest;
  disabled: boolean;
  files: readonly File[];
  onFilesChange: (files: readonly File[]) => void;
};

function acceptedTypes(capability: CapabilityManifest): string {
  return capability.inputs
    .flatMap((input) => [...input.mimeTypes, ...input.extensions])
    .filter((value, index, values) => value !== "*" && values.indexOf(value) === index)
    .join(",");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone({ capability, disabled, files, onFilesChange }: DropZoneProps) {
  if (capability.inputMode === "values") return null;
  const accept = acceptedTypes(capability);
  const multiple = capability.limits.maximumFiles > 1;

  function receive(nextFiles: FileList | null): void {
    onFilesChange(nextFiles ? Array.from(nextFiles) : []);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    receive(event.currentTarget.files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (!disabled) receive(event.dataTransfer.files);
  }

  return (
    <div
      className="workspace-drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <input
        id="workspace-files"
        className="workspace-drop-zone__input"
        accept={accept}
        disabled={disabled}
        multiple={multiple}
        onChange={onChange}
        type="file"
      />
      <label className="workspace-drop-zone__label" htmlFor="workspace-files" aria-label={`Choose ${capability.title} files`}>
        Choose files
      </label>
      <p className="workspace-drop-zone__hint">Drop files here or use file picker. Files stay on device.</p>
      {files.length > 0 ? (
        <div className="workspace-drop-zone__selected" aria-live="polite">
          <p className="workspace-drop-zone__count">
            {files.length} file{files.length === 1 ? "" : "s"} selected.
          </p>
          <ul className="workspace-drop-zone__file-list">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="workspace-drop-zone__file-item">
                <span className="workspace-drop-zone__file-name">{file.name}</span>
                <span className="workspace-drop-zone__file-size">{formatSize(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

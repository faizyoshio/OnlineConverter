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
      <label className="workspace-drop-zone__label" htmlFor="workspace-files">
        Choose files
      </label>
      <input
        id="workspace-files"
        accept={accept}
        disabled={disabled}
        multiple={multiple}
        onChange={onChange}
        type="file"
      />
      <p className="workspace-drop-zone__hint">Drop files here or use file picker. Files stay on device.</p>
      {files.length > 0 ? <p aria-live="polite">{files.length} file{files.length === 1 ? "" : "s"} selected.</p> : null}
    </div>
  );
}

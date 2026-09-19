"use client";

import { useId } from "react";
import type { CapabilityManifest } from "@/features/capabilities";

export type PdfCompressSettingsProps = {
  capability: CapabilityManifest;
  options: Readonly<Record<string, unknown>>;
  setOption: (key: string, value: string | number | boolean | null) => void;
  disabled?: boolean;
  isAdvancedMode?: boolean;
  setIsAdvancedMode?: (value: boolean) => void;
};

type PresetOption = {
  id: "dasar" | "sedang" | "kuat" | "kustom";
  title: string;
  description: string;
  badge?: string;
};

const PRESETS: readonly PresetOption[] = [
  { id: "dasar", title: "Dasar", description: "Kompresi dasar, kualitas tinggi" },
  { id: "sedang", title: "Sedang", description: "Kompresi baik, kualitas baik" },
  { id: "kuat", title: "Kuat", description: "Kompresi tinggi, kualitas lebih rendah", badge: "Terkecil" },
  { id: "kustom", title: "Kustom", description: "Ukuran file terkecil, kualitas gambar kustom" },
];

export function PdfCompressSettings({
  capability,
  options,
  setOption,
  disabled = false,
  isAdvancedMode = false,
}: PdfCompressSettingsProps) {
  const baseId = useId();
  const selectedPreset = typeof options.preset === "string" && ["dasar", "sedang", "kuat", "kustom"].includes(options.preset) ? options.preset : "sedang";
  const customQuality = typeof options.customQuality === "number" ? options.customQuality : 80;

  return (
    <div className="pdf-compress-panel" aria-labelledby={`${baseId}-title`}>
      <div className="pdf-compress-header">
        <div className="pdf-compress-icon-wrapper" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="m9 15 3 3 3-3" />
          </svg>
        </div>
        <div className="pdf-compress-heading-text">
          <h2 id={`${baseId}-title`} className="pdf-compress-title">{capability.title}</h2>
          <p className="pdf-compress-subtitle">{capability.description}</p>
        </div>
      </div>

      <div className="pdf-compress-options-grid" role="radiogroup" aria-label="Tingkat kompresi PDF">
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const radioId = `${baseId}-preset-${preset.id}`;
          return (
            <label key={preset.id} htmlFor={radioId} className={`pdf-compress-card ${isSelected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}>
              <div className="pdf-compress-card__left">
                <input type="radio" id={radioId} name={`${baseId}-preset`} value={preset.id} checked={isSelected} onChange={() => setOption("preset", preset.id)} disabled={disabled} className="pdf-compress-radio" />
                <div className="pdf-compress-card__text">
                  <span className="pdf-compress-card__name">{preset.title}</span>
                  <span className="pdf-compress-card__desc">{preset.description}</span>
                </div>
              </div>
              {preset.badge ? <span className="pdf-compress-badge">{preset.badge}</span> : null}
            </label>
          );
        })}
      </div>

      {selectedPreset === "kustom" && (
        <div className="pdf-compress-custom-area">
          <label htmlFor={`${baseId}-custom-quality`} className="pdf-compress-custom-label">
            <span>Kualitas Gambar Kustom: <strong>{customQuality}%</strong></span>
            <input type="range" id={`${baseId}-custom-quality`} min="1" max="100" step="1" value={customQuality} onChange={(e) => setOption("customQuality", Number(e.target.value))} disabled={disabled} className="pdf-compress-slider" />
          </label>
          {isAdvancedMode && (
            <div className="pdf-compress-advanced-option" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
              <label htmlFor={`${baseId}-dpi`} className="pdf-compress-custom-label">
                <span>Target DPI: <strong>{String(options.dpi || "150")}</strong></span>
                <select id={`${baseId}-dpi`} value={String(options.dpi || "150")} onChange={(e) => setOption("dpi", e.target.value)} disabled={disabled}>
                  <option value="72">72 (Web)</option>
                  <option value="150">150 (Standard)</option>
                  <option value="300">300 (Print)</option>
                </select>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
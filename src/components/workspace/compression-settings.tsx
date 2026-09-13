"use client";

import { useId, useState } from "react";
import type { CapabilityManifest } from "@/features/capabilities";

export type CompressionSettingsProps = {
  capability: CapabilityManifest;
  options: Readonly<Record<string, unknown>>;
  setOption: (key: string, value: string | number | boolean | null) => void;
  disabled?: boolean;
};

export function CompressionSettings({
  capability,
  options,
  setOption,
  disabled = false,
}: CompressionSettingsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const baseId = useId();

  const mode = options.compressionMode === "maxFileSize" ? "maxFileSize" : "quality";
  const quality = typeof options.quality === "number" ? Math.max(1, Math.min(100, options.quality)) : 75;
  const maxFileSizeKb = options.maxFileSizeKb == null ? "" : String(options.maxFileSizeKb);

  // Secondary option (e.g. stripMetadata or preserveAlpha)
  const secondaryField = capability.optionFields.find(
    (field) => field.key === "stripMetadata" || field.key === "preserveAlpha",
  );

  // Calculate thumb offset for tooltip alignment
  // Thumb diameter: 20px, radius: 10px
  const percent = ((quality - 1) / 99) * 100;
  const thumbOffset = 10 - 20 * (percent / 100);

  const maxFileRadioId = `${baseId}-mode-max-size`;
  const qualityRadioId = `${baseId}-mode-quality`;
  const maxFileInputId = `${baseId}-input-max-size`;
  const qualitySliderId = `${baseId}-input-quality`;

  return (
    <div className="compression-settings" aria-label="Compression settings">
      <button
        type="button"
        className="compression-settings__header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${baseId}-content`}
      >
        <span className="compression-settings__title">Compression Settings (optional)</span>
        <span className="compression-settings__chevron" aria-hidden="true">
          {isOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>
      </button>

      {isOpen && (
        <div id={`${baseId}-content`} className="compression-settings__body">
          <div className="compression-settings__main-row">
            {/* Left side: Radio options */}
            <div className="compression-settings__modes" role="radiogroup" aria-label="Compression mode">
              <label
                htmlFor={maxFileRadioId}
                className={`compression-radio-label ${mode === "maxFileSize" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  id={maxFileRadioId}
                  name={`${baseId}-compression-mode`}
                  value="maxFileSize"
                  checked={mode === "maxFileSize"}
                  onChange={() => setOption("compressionMode", "maxFileSize")}
                  disabled={disabled}
                  className="compression-radio-input"
                />
                <span className="compression-radio-custom" />
                <span className="compression-radio-text">Max File Size (KB)</span>
                <span
                  className="compression-help-icon"
                  title="Target maximum output file size in kilobytes (KB)"
                  aria-label="Target maximum output file size in kilobytes"
                >
                  ?
                </span>
              </label>

              <label
                htmlFor={qualityRadioId}
                className={`compression-radio-label ${mode === "quality" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  id={qualityRadioId}
                  name={`${baseId}-compression-mode`}
                  value="quality"
                  checked={mode === "quality"}
                  onChange={() => setOption("compressionMode", "quality")}
                  disabled={disabled}
                  className="compression-radio-input"
                />
                <span className="compression-radio-custom" />
                <span className="compression-radio-text">Quality</span>
                <span
                  className="compression-help-icon"
                  title="Compression quality percentage from 1% to 100%"
                  aria-label="Compression quality percentage from 1% to 100%"
                >
                  ?
                </span>
              </label>
            </div>

            {/* Right side: Dynamic input or slider */}
            <div className="compression-settings__control-area">
              {mode === "maxFileSize" ? (
                <div className="compression-max-size-container">
                  <input
                    type="number"
                    id={maxFileInputId}
                    className="compression-text-input"
                    placeholder="Enter Max File Size"
                    min="1"
                    max="50000"
                    step="1"
                    value={maxFileSizeKb}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val === "") {
                        setOption("maxFileSizeKb", null);
                      } else {
                        const num = Number(val);
                        if (!Number.isNaN(num)) {
                          setOption("maxFileSizeKb", num);
                        }
                      }
                    }}
                    disabled={disabled}
                    aria-label="Enter maximum file size in KB"
                  />
                </div>
              ) : (
                <div className="compression-slider-container">
                  <div
                    className="compression-slider-tooltip"
                    style={{
                      left: `calc(${percent}% + ${thumbOffset}px)`,
                    }}
                  >
                    <span>{quality}%</span>
                    <span className="compression-slider-tooltip-arrow" />
                  </div>
                  <input
                    type="range"
                    id={qualitySliderId}
                    min="1"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(e) => setOption("quality", Number(e.target.value))}
                    disabled={disabled}
                    className="compression-slider-input"
                    style={{
                      background: `linear-gradient(to right, #5584f7 0%, #5584f7 ${percent}%, #525866 ${percent}%, #525866 100%)`,
                    }}
                    aria-label={`Quality ${quality}%`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Secondary academic option if applicable */}
          {secondaryField && (
            <div className="compression-settings__secondary">
              <label
                htmlFor={`${baseId}-secondary`}
                className="compression-secondary-checkbox-label"
              >
                <input
                  type="checkbox"
                  id={`${baseId}-secondary`}
                  checked={options[secondaryField.key] === true}
                  onChange={(e) => setOption(secondaryField.key, e.target.checked)}
                  disabled={disabled}
                  className="compression-checkbox-input"
                />
                <span className="compression-secondary-label-text">{secondaryField.label}</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

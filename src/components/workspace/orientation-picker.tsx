type OrientationPickerProps = {
  value: "portrait" | "landscape";
  onChange: (value: "portrait" | "landscape") => void;
  disabled?: boolean;
};

export function OrientationPicker({ value, onChange, disabled }: OrientationPickerProps) {
  return (
    <div className="orientation-picker">
      <button
        className={`orientation-option ${value === "portrait" ? "selected" : ""}`}
        onClick={() => onChange("portrait")}
        disabled={disabled}
        aria-label="Portrait orientation"
      >
        <span className="orientation-icon">📄</span>
        <span className="orientation-label">Portrait</span>
      </button>
      <button
        className={`orientation-option ${value === "landscape" ? "selected" : ""}`}
        onClick={() => onChange("landscape")}
        disabled={disabled}
        aria-label="Landscape orientation"
      >
        <span className="orientation-icon">📄</span>
        <span className="orientation-label">Landscape</span>
      </button>
    </div>
  );
}
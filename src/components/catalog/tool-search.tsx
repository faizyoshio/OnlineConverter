type ToolSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ToolSearch({ value, onChange }: ToolSearchProps) {
  return (
    <label className="tool-search">
      <span className="tool-search__label">Search tools</span>
      <span className="tool-search__control">
        <span aria-hidden="true" className="tool-search__icon">⌕</span>
        <input
          autoComplete="off"
          inputMode="search"
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Try “PDF to JPG” or “compress image”"
          type="search"
          value={value}
        />
      </span>
    </label>
  );
}

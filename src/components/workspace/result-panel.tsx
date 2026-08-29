import type { ManagedResult } from "@/features/results/result-manager";

type ResultPanelProps = {
  result: ManagedResult | null;
};

function ValueResult({ result }: { result: Extract<ManagedResult, { mode: "value" }> }) {
  switch (result.value.kind) {
    case "number":
      return <output>{result.value.display}</output>;
    case "text":
      return <output>{result.value.text}</output>;
    case "time":
      return <output>{result.value.display} ({result.value.zone})</output>;
    case "color":
      return <output>{result.value.hex} · {result.value.rgb} · {result.value.hsl}</output>;
    case "palette":
      return <ul className="workspace-palette">{result.value.colors.map((color) => <li key={color.hex}>{color.hex} ({Math.round(color.proportion * 100)}%)</li>)}</ul>;
    case "password":
      return <output>{result.value.value}</output>;
  }
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) return null;
  if (result.mode === "value") {
    return <section className="workspace-result" aria-label="Local conversion result"><ValueResult result={result} /></section>;
  }
  return (
    <section className="workspace-result" aria-label="Local conversion result">
      <ul>
        {result.outputs.map((output) => (
          <li key={output.url}>
            <a download={output.downloadName} href={output.url}>Download {output.downloadName}</a>
            <span> ({output.mimeType}, {output.bytes} bytes)</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

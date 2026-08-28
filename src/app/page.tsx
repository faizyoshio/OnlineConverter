import { ToolCatalog } from "@/components/catalog/tool-catalog";
import { capabilityRegistry } from "@/features/capabilities";
import { getVisibleCapabilities, type CatalogEnvironment } from "@/features/capabilities/visibility";

function getCatalogEnvironment(): CatalogEnvironment {
  return process.env.VERCEL_ENV === "production"
    ? "production"
    : process.env.VERCEL_ENV === "preview"
      ? "preview"
      : "local";
}

export default function HomePage() {
  const environment = getCatalogEnvironment();
  const previewRequested = process.env.CATALOG_PREVIEW === "1" || environment === "local";
  const visibleCapabilities = getVisibleCapabilities(capabilityRegistry, { environment, previewRequested });

  return (
    <>
      <section aria-labelledby="home-title" className="hero">
        <div>
          <h1 id="home-title">Convert files locally in your browser</h1>
          <p className="hero__lead">A clear, searchable catalog for everyday file work—without routing your files through a conversion server.</p>
        </div>
        <aside className="privacy-panel" aria-label="Privacy promise">
          <strong>Files never leave your device.</strong>
          <p>Conversion engines run in browser workers. Planned tools stay visibly unavailable until their real adapters pass the launch gate.</p>
          <ul className="privacy-list">
            <li>No uploads for conversion</li>
            <li>Anonymous-first workflow</li>
            <li>Truthful quality labels</li>
          </ul>
        </aside>
      </section>
      <ToolCatalog
        capabilities={visibleCapabilities}
        previewMode={environment !== "production" && previewRequested}
      />
    </>
  );
}

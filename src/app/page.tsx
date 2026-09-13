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
  const previewRequested = process.env.CATALOG_PREVIEW === "1";
  const visibleCapabilities = getVisibleCapabilities(capabilityRegistry, { environment, previewRequested });

  return (
    <>
      <section aria-labelledby="home-title" className="hero">
        <div>
          <h1 id="home-title">Convert files locally — Academic &amp; Research Toolkit</h1>
          <p className="hero__lead">A local-first toolkit for students, researchers, and academics. Format thesis chapters, paginate manuscripts, optimize publication figures, and meet portal submission limits—without uploading your research to external servers.</p>
        </div>
        <aside className="privacy-panel" aria-label="Privacy promise">
          <strong>Files never leave your device.</strong>
          <p>All processing runs inside local browser workers. Your unpublished manuscripts, thesis drafts, and confidential lab data stay 100% private and protected from plagiarism risks.</p>
          <ul className="privacy-list">
            <li>Zero uploads to external servers</li>
            <li>Safe for unpublished thesis & research drafts</li>
            <li>Meets journal & university portal requirements</li>
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

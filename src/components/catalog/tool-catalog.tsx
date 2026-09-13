"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { searchCapabilities } from "@/features/capabilities/search";
import type { CapabilityCategory, CapabilityManifest } from "@/features/capabilities/schema";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";
import { ToolSearch } from "./tool-search";

const categoryOrder: readonly CapabilityCategory[] = ["pdf", "image", "gif", "utility", "trust"];

type ToolCatalogProps = {
  capabilities: readonly CapabilityManifest[];
  previewMode: boolean;
};

export function ToolCatalog({ capabilities, previewMode }: ToolCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CapabilityCategory | "all">("all");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () => categoryOrder.filter((item) => capabilities.some((capability) => capability.category === item)),
    [capabilities],
  );
  const results = useMemo(() => {
    const categoryResults = category === "all"
      ? capabilities
      : capabilities.filter((capability) => capability.category === category);
    return searchCapabilities(deferredQuery, categoryResults);
  }, [capabilities, category, deferredQuery]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <section aria-labelledby="catalog-title" className="catalog-shell">
      <div className="catalog-heading">
        <div>
          <h2 id="catalog-title">Find the right local tool</h2>
        </div>
        <p>Search by task or narrow the catalog by file family.</p>
      </div>
      <div className="catalog-controls">
        <ToolSearch onChange={setQuery} value={query} />
        <CategoryFilter categories={categories} onSelect={setCategory} selected={category} />
      </div>
      <div className="catalog-status-row">
        <p aria-live="polite" role="status">{results.length} {results.length === 1 ? "tool" : "tools"}</p>
        {(query || category !== "all") && results.length > 0
          ? <Button onClick={clearFilters} variant="quiet">Clear filters</Button>
          : null}
      </div>
      {results.length > 0 ? (
        <div className="tool-grid">
          {results.map((item) => <ToolCard capability={item} key={item.id} previewMode={previewMode} />)}
        </div>
      ) : (
        <div className="catalog-empty">
          <h3>No tools match</h3>
          <p>Try a broader search or clear the selected category.</p>
          <Button onClick={clearFilters}>Clear filters</Button>
        </div>
      )}
    </section>
  );
}

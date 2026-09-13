"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { searchCapabilities } from "@/features/capabilities/search";
import type { CapabilityCategory, CapabilityManifest } from "@/features/capabilities/schema";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";
import { ToolSearch } from "./tool-search";

const categoryOrder: readonly CapabilityCategory[] = ["pdf", "image", "gif", "utility", "trust"];
const groupOrder = [
  { id: "organize", title: "ORGANIZE PDF" },
  { id: "optimize", title: "OPTIMIZE PDF" },
  { id: "to-pdf", title: "CONVERT TO PDF" },
  { id: "from-pdf", title: "CONVERT FROM PDF" },
] as const;

type ToolCatalogProps = {
  capabilities: readonly CapabilityManifest[];
  previewMode: boolean;
};

export function ToolCatalog({ capabilities, previewMode }: ToolCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const deferredQuery = useDeferredValue(query);

  const filterOptions = useMemo(() => {
    const list: string[] = [];
    for (const g of groupOrder) {
      if (capabilities.some((item) => item.group === g.id)) {
        list.push(g.id);
      }
    }
    for (const cat of categoryOrder) {
      if (!list.length && capabilities.some((item) => item.category === cat)) {
        list.push(cat);
      }
      if (capabilities.some((item) => item.category === cat && !item.group) && !list.includes(cat)) {
        list.push(cat);
      }
    }
    return list;
  }, [capabilities]);

  const hasGroups = useMemo(
    () => capabilities.some((item) => Boolean(item.group)),
    [capabilities]
  );

  const results = useMemo(() => {
    const categoryResults = category === "all"
      ? capabilities
      : capabilities.filter((capability) => capability.group === category || capability.category === category);
    return searchCapabilities(deferredQuery, categoryResults);
  }, [capabilities, category, deferredQuery]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  const showGroupSections = hasGroups && category === "all" && !deferredQuery.trim();

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
        <CategoryFilter categories={filterOptions} onSelect={setCategory} selected={category} />
      </div>
      <div className="catalog-status-row">
        <p aria-live="polite" role="status">{results.length} {results.length === 1 ? "tool" : "tools"}</p>
        {(query || category !== "all") && results.length > 0
          ? <Button onClick={clearFilters} variant="quiet">Clear filters</Button>
          : null}
      </div>
      {results.length > 0 ? (
        showGroupSections ? (
          <div className="catalog-sections">
            {groupOrder.map((group) => {
              const groupTools = capabilities.filter((item) => item.group === group.id);
              if (groupTools.length === 0) return null;
              return (
                <div key={group.id} className="catalog-group-section">
                  <h3 className="catalog-group-title">{group.title}</h3>
                  <div className="tool-grid">
                    {groupTools.map((item) => (
                      <ToolCard capability={item} key={item.id} previewMode={previewMode} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tool-grid">
            {results.map((item) => <ToolCard capability={item} key={item.id} previewMode={previewMode} />)}
          </div>
        )
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

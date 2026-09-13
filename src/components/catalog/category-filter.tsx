import { Button } from "@/components/ui/button";
import type { CapabilityCategory } from "@/features/capabilities/schema";

const categoryLabels: Record<CapabilityCategory, string> = {
  pdf: "Thesis & Papers",
  image: "Figures & Images",
  gif: "Animations & GIF",
  utility: "Study Utilities",
  trust: "Trust & Privacy",
};

type CategoryFilterProps = {
  categories: readonly CapabilityCategory[];
  selected: CapabilityCategory | "all";
  onSelect: (category: CapabilityCategory | "all") => void;
};

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div aria-label="Tool categories" className="category-filter" role="group">
      <Button aria-pressed={selected === "all"} onClick={() => onSelect("all")} variant="secondary">
        All tools
      </Button>
      {categories.map((category) => (
        <Button
          aria-pressed={selected === category}
          key={category}
          onClick={() => onSelect(category)}
          variant="secondary"
        >
          {categoryLabels[category]}
        </Button>
      ))}
    </div>
  );
}

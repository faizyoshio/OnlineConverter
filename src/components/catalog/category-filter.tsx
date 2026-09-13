import { Button } from "@/components/ui/button";

const filterLabels: Record<string, string> = {
  all: "All tools",
  organize: "Organize PDF",
  optimize: "Optimize PDF",
  "to-pdf": "Convert to PDF",
  "from-pdf": "Convert from PDF",
  pdf: "Thesis & Papers",
  image: "Figures & Images",
  gif: "Animations & GIF",
  utility: "Study Utilities",
  trust: "Trust & Privacy",
};

type CategoryFilterProps = {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
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
          {filterLabels[category] ?? category}
        </Button>
      ))}
    </div>
  );
}

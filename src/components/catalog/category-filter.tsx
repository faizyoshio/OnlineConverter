import { Button } from "@/components/ui/button";

const filterLabels: Record<string, string> = {
  all: "All tools",
  pdf: "PDF Tools",
  image: "Image Tools",
  "optimize-pdf": "Optimize PDF",
  "merge-split": "Merge & Split",
  "view-edit": "View & Edit",
  "to-pdf": "Convert to PDF",
  "from-pdf": "Convert from PDF",
  "pdf-security": "PDF Security",
  "optimize-image": "Optimize Image",
  "convert-image": "Convert Image",
  organize: "Organize PDF",
  optimize: "Optimize PDF",
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

import type { CategoryFilter } from "@/features/games/model/game";

type Props = {
  query: string;
  category: CategoryFilter;
  categories: readonly CategoryFilter[];
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: CategoryFilter) => void;
};

export function Filters({ query, category, categories, onQueryChange, onCategoryChange }: Props) {
  return (
    <div className="av-filters">
      <div className="av-search">
        <span className="ico">⌕</span>
        <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Buscar un juego por nombre…" />
      </div>
      <div className="av-chips">
        {categories.map((c) => (
          <button key={c} className={"chip" + (category === c ? " active" : "")} onClick={() => onCategoryChange(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

import React from "react";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  selectedCategories: string[];
  onToggleCategory: (name: string) => void;
  onClearAll: () => void;
  categories: string[];
  capitalize: (s: string) => string;
  isSticky: boolean;
  isMobileView: boolean;
};

const WardrobeFilters: React.FC<Props> = ({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
  onClearAll,
  categories,
  capitalize,
  isSticky,
  isMobileView,
}) => {
  return (
    <section className={`wardrobe-controls ${isSticky ? 'is-sticky' : ''} ${isMobileView ? 'mobile' : ''}`}>
      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search clothing…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className={`category-buttons ${isSticky && isMobileView ? 'hide' : ''}`}>
        <button
          className={`category-chip ${selectedCategories.length === 0 ? "is-active" : ""}`}
          onClick={onClearAll}
        >
          All Items
        </button>
        {categories.map((c) => {
          const isSelected = selectedCategories.includes(c);
          return (
            <button
              key={c}
              className={`category-chip ${isSelected ? "is-active" : ""}`}
              onClick={() => onToggleCategory(c)}
            >
              {capitalize(c)}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default WardrobeFilters;

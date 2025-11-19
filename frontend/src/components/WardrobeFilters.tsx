// src/components/WardrobeFilters.tsx
import React from "react";
import "./WardrobeFilters.css";

const CATEGORIES = ["Shirt", "Pants", "Outerwear", "Accessories", "Shoes"];

interface WardrobeFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedCategories: string[];
  onToggleCategory: (name: string) => void;
  isSticky: boolean;
  isMobileView: boolean;

  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  sortOrder: "none" | "wornAsc" | "wornDesc";
  onSortOrderChange: (value: "none" | "wornAsc" | "wornDesc") => void;
}

const WardrobeFilters: React.FC<WardrobeFiltersProps> = ({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
  isSticky,
  isMobileView,
  favoritesOnly,
  onFavoritesOnlyChange,
  sortOrder,
  onSortOrderChange,
}) => {
  return (
    <section
      className={`wardrobe-controls ${isSticky ? "is-sticky" : ""} ${
        isMobileView ? "mobile" : ""
      }`}
    >
      {/* Search bar */}
      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search clothing…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      {/* Extra filters: favorites + sort */}
      <div className="filters-row-extra">
        <label className="favorites-toggle">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => onFavoritesOnlyChange(e.target.checked)}
          />
          <span>Favorites only</span>
        </label>

        <select
          className="sort-select"
          value={sortOrder}
          onChange={(e) =>
            onSortOrderChange(e.target.value as "none" | "wornAsc" | "wornDesc")
          }
        >
          <option value="none">Sort: Default</option>
          <option value="wornDesc">Most worn first</option>
          <option value="wornAsc">Least worn first</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="category-buttons">
        <button
          className={`category-chip ${selectedCategories.length === 0 ? "is-active" : ""}`}
          onClick={() => onToggleCategory("All Items")}
        >
          All Items
        </button>
        {CATEGORIES.map((c) => {
          const isOn = selectedCategories.includes(c.toLowerCase());
          return (
            <button
              key={c}
              className={`category-chip ${isOn ? "is-active" : ""}`}
              onClick={() => onToggleCategory(c)}
            >
              {c}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default WardrobeFilters;

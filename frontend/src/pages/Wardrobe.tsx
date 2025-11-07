import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./Wardrobe.css";
import WardrobeItem, { WardrobeItemProps } from "../components/WardrobeItem";
import ItemDetails from "../components/ItemDetails";
import WardrobeFilters from "../components/WardrobeFilters";

// Define categories in lowercase to match the data
const CATEGORIES = ["shirt", "pants", "jacket"]; // chip list (edit later if dynamic)

// Helper function to capitalize first letter for display
const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// (Renamed to avoid collision with the WardrobeItem component)
type WardrobeItemType = {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  favorite?: boolean;
};

const sampleItems: WardrobeItemType[] = [
  { id: "1", title: "White Tee", category: "shirt", imageUrl: "https://img.sonofatailor.com/images/customizer/product/extra-heavy-cotton/ss/Black.jpg", favorite: false },
  { id: "2", title: "Blue Jeans", category: "pants", imageUrl: "https://m.media-amazon.com/images/I/715K4AhGLZS._AC_UY1000_.jpg", favorite: true },
  { id: "3", title: "Black Dress", category: "dress", imageUrl: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/99486859-0ff3-46b4-949b-2d16af2ad421/custom-nike-dunk-high-by-you-shoes.png", favorite: false },
  { id: "4", title: "Red Sneakers", category: "shoes", imageUrl: "https://vader-prod.s3.amazonaws.com/1651851897-best-babydoll-dresses-matteau-dress-1651851878.png", favorite: false },
  { id: "5", title: "Leather Jacket", category: "jacket", imageUrl: "https://img.sonofatailor.com/images/customizer/product/extra-heavy-cotton/ss/Black.jpg", favorite: true },
];

const Wardrobe: React.FC = () => {
  const [items, setItems] = useState<WardrobeItemType[]>([]);
  const [query, setQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Handle scroll events to determine sticky state
  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    setIsSticky(offset > 100);
  }, []);

  // Handle resize events
  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll, handleResize]);

  // First file’s simple title filter (kept)
  const filteredByTitle = items.filter((it) =>
    (it.title || "").toLowerCase().includes(query.toLowerCase())
  );

  // ===== from second file =====
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // selected categories as array
  const [loading, setLoading] = useState(true);

  // Keep track of whether we've loaded items at least once
  const [hasInitialItems, setHasInitialItems] = useState(false);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(",")); // e.g. "shirt,pants"
    }
    if (query.trim()) params.set("q", query.trim());
    params.set("limit", "24");
    params.set("offset", "0");

    fetch(`/api/clothing-items?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Network error");
        return r.json();
      })
      .then((d) => {
        // Map backend rows to the UI shape used by your components
        // Normalize category to lowercase so it matches `CATEGORIES` and `selectedCategories`.
        const mapped: WardrobeItemType[] = (d.items || []).map((row: any) => ({
          id: row.id,
          title: row.category || "Item",
          category: (row.category || "").toLowerCase(),
          imageUrl: row.image_path, // your UI expects imageUrl
          favorite: !!row.favorite,
        }));
        setItems(mapped);
        if (mapped.length > 0) {
          setHasInitialItems(true);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedCategories, query]);

  // Second file’s combined (category + text) filter (kept)
  // Filter items based on selected categories and search query
  const filtered = useMemo(() => {
    return items.filter((item: WardrobeItemType) => {
      // Category filter: show item if it matches any selected category
      if (selectedCategories.length > 0) {
        if (!item.category || !selectedCategories.includes(item.category)) {
          return false;
        }
      }

      // Search filter
      if (query.trim()) {
        const searchText = `${item.title} ${item.category}`.toLowerCase();
        if (!searchText.includes(query.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [items, query, selectedCategories]);

  // Toggle category filters
  const toggleChip = (name: string) => {
    if (name === "All Items") {
      setSelectedCategories([]); // clear all filters
      return;
    }
    const category = name.toLowerCase();
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  return (
    <div className="page page-wardrobe">
      {/* filter controls (moved to component) */}
      <WardrobeFilters
        query={query}
        onQueryChange={setQuery}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleChip}
        onClearAll={() => setSelectedCategories([])}
        categories={CATEGORIES}
        capitalize={capitalizeFirst}
        isSticky={isSticky}
        isMobileView={isMobileView}
      />

      {/* first file main content (kept) */}
      <main className="wardrobe-content">
        {loading ? (
          <div className="items-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="item-card placeholder" />
            ))}
          </div>
        ) : !hasInitialItems && items.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🖼️</div>
            <h3>Your wardrobe is empty</h3>
            <p>
              Start building your digital wardrobe by adding your first item. Upload photos of your
              clothes and let our AI help organize them automatically.
            </p>
            <button className="btn btn-primary" onClick={() => {
              setItems(sampleItems);
              setHasInitialItems(true);
            }}>
              Add Your First Item
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🔍</div>
            <h3>No items found</h3>
            <p>Try adjusting your filters or search terms to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid">
            {(filtered.length ? filtered : filteredByTitle).map((it) => (
              <div key={it.id} className="item-card">
                <WardrobeItem
                  id={it.id}
                  title={it.title}
                  description={it.category}
                  tags={it.category ? [it.category] : []}
                  imageUrl={it.imageUrl}
                  favorite={!!it.favorite}
                  onClick={() => it.id}
                />
                <ItemDetails
                  id={it.id}
                  favorite={!!it.favorite}
                  onToggleFavorite={(id) =>
                    setItems((prev) =>
                      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
                    )
                  }
                  onDelete={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wardrobe;

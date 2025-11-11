import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./Wardrobe.css";
import WardrobeItem from "../components/WardrobeItem";
import WardrobeAddItemForm from "../components/WardrobeAddItemForm";
import ItemDetails from "../components/ItemDetails";

// Define categories in lowercase to match the data
const CATEGORIES = ["shirt", "pants", "outerwear"];

// Helper function to capitalize first letter for display (if needed elsewhere)
const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

type WardrobeItemType = {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  favorite?: boolean;
  color?: string | null;
  occasion?: string | null;
};

const Wardrobe: React.FC = () => {
  const [items, setItems] = useState<WardrobeItemType[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI niceties from the other branch
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  // Sticky header & responsive checks
  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    setIsSticky(offset > 100);
  }, []);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleResize(); // initial
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  // Fetch items (preserve robust error handling + query/category params)
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const params = new URLSearchParams();
        if (selectedCategories.length > 0) {
          params.set("categories", selectedCategories.join(","));
        }
        if (query.trim()) params.set("q", query.trim());
        params.set("limit", "24");
        params.set("offset", "0");

        // Try the public API first (credentials include), then fallback
        const apiBase = "http://localhost:4000";
        const primaryUrl = `${apiBase}/api/public/closet-items?${params.toString()}`;
        const fallbackUrl = `/api/clothing-items?${params.toString()}`;

        // Helper to map rows to UI model (prefers image_url then image_path)
        const mapRows = (rows: any[]): WardrobeItemType[] =>
          rows.map((row: any) => ({
            id: row.id,
            title: row.category || "Item",
            category: (row.category || "").toLowerCase() || undefined,
            imageUrl: row.image_url || row.image_path || undefined,
            favorite: !!row.favorite,
            color: row.color ?? null,
            occasion: row.occasion ?? null,
          }));

        // attempt #1
        let res = await fetch(primaryUrl, {
          credentials: "include",
          signal: ac.signal,
        });

        // Fallback attempt if primary fails (non-OK)
        if (!res.ok) {
          res = await fetch(fallbackUrl, { signal: ac.signal });
        }

        if (!res.ok) throw new Error(`Network error ${res.status}`);

        const data = await res.json();
        const rows: any[] = Array.isArray(data?.items) ? data.items : [];
        setItems(mapRows(rows));
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setItems([]);
          setErr("Failed to load your wardrobe. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [selectedCategories, query]);

  // Quick title-only fallback filter (kept from original)
  const filteredByTitle = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(q));
  }, [items, query]);

  // Combined filter: categories + richer text search (category/color/occasion/title)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item: WardrobeItemType) => {
      // Category filter
      if (selectedCategories.length > 0) {
        const cat = (item.category || "").toLowerCase();
        if (!cat || !selectedCategories.includes(cat)) return false;
      }

      // Text filter (richer fields)
      if (q) {
        const hay = `${item.title ?? ""} ${item.category ?? ""} ${
          item.color ?? ""
        } ${item.occasion ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, query, selectedCategories]);

  // Toggle category chips
  const toggleChip = (name: string) => {
    if (name === "All Items") {
      setSelectedCategories([]);
      return;
    }
    const category = name.toLowerCase();
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className={`page page-wardrobe ${isMobileView ? "is-mobile" : ""}`}>
      <header className={`wardrobe-header ${isSticky ? "is-sticky" : ""}`}>
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button className="wardrobe-add-button" type="button" onClick={handleOpenForm}>
          Add Item
        </button>
      </header>

      {isFormOpen && <WardrobeAddItemForm onClose={handleCloseForm} />}

      <section className="wardrobe-controls">
        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search clothing…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="category-buttons">
          <button
            className={`category-chip ${
              selectedCategories.length === 0 ? "is-active" : ""
            }`}
            onClick={() => toggleChip("All Items")}
          >
            All Items
          </button>
          {CATEGORIES.map((c) => {
            const isOn = selectedCategories.includes(c.toLowerCase());
            return (
              <button
                key={c}
                className={`category-chip ${isOn ? "is-active" : ""}`}
                onClick={() => toggleChip(c)}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <main className="wardrobe-content">
        {loading ? (
          <div className="items-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="item-card placeholder" />
            ))}
          </div>
        ) : err ? (
          <div className="empty-card">
            <div className="empty-icon">⚠️</div>
            <h3>Couldn’t load your wardrobe</h3>
            <p>{err}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🖼️</div>
            <h3>Your wardrobe is empty</h3>
            <p>Start building your digital wardrobe by adding your first item.</p>
          </div>
        ) : (filtered.length ? filtered : filteredByTitle).length === 0 ? (
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
                  onClick={() => {}}
                />
                <ItemDetails
                  id={it.id}
                  favorite={!!it.favorite}
                  onToggleFavorite={(id) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === id ? { ...p, favorite: !p.favorite } : p
                      )
                    )
                  }
                  onDelete={(id) =>
                    setItems((prev) => prev.filter((p) => p.id !== id))
                  }
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

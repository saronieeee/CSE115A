import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./Wardrobe.css";
import WardrobeItem from "../components/WardrobeItem";
import WardrobeAddItemForm from "../components/WardrobeAddItemForm";
import ItemDetails from "../components/ItemDetails";

const CATEGORIES = ["shirt", "pants", "outerwear"];

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
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  /** Sticky header + responsive handling */
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
    handleResize();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  /** Fetch wardrobe items */
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

        const url = `/api/clothing-items?${params.toString()}`;
        const res = await fetch(url, { signal: ac.signal });

        if (!res.ok) throw new Error(`Network error ${res.status}`);
        const data = await res.json();

        const rows: any[] = Array.isArray(data?.items) ? data.items : [];
        const mapped: WardrobeItemType[] = rows.map((row: any) => ({
          id: row.id,
          title: row.category || "Item",
          category: (row.category || "").toLowerCase() || undefined,
          imageUrl: row.image_url || row.image_path || undefined,
          favorite: !!row.favorite,
          color: row.color ?? null,
          occasion: row.occasion ?? null,
        }));

        setItems(mapped);
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

  /** Filter logic */
  const filteredByTitle = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(q));
  }, [items, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategories.length > 0) {
        const cat = (item.category || "").toLowerCase();
        if (!cat || !selectedCategories.includes(cat)) return false;
      }
      if (q) {
        const hay = `${item.title ?? ""} ${item.category ?? ""} ${
          item.color ?? ""
        } ${item.occasion ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, selectedCategories]);

  /** Toggle category chips */
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

  /** ---- Persist actions to Supabase ---- */

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const nextFav = !current.favorite;

    // optimistic UI update
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: nextFav } : p))
    );

    try {
      const res = await fetch(`/api/clothing-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFav }),
      });

      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
      const { item } = await res.json();

      // sync data from server
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                favorite: item.favorite,
                color: item.color,
                occasion: item.occasion,
                category: (item.category || "").toLowerCase() || undefined,
                imageUrl: item.image_url || item.image_path || p.imageUrl,
              }
            : p
        )
      );
    } catch (e) {
      console.error("Favorite update failed", e);
      // rollback
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, favorite: !nextFav } : p))
      );
      setErr("Couldn't save favorite. Please try again.");
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    const snapshot = items;
    setItems((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/clothing-items/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204)
        throw new Error(`DELETE failed: ${res.status}`);
    } catch (e) {
      console.error("Delete failed", e);
      setItems(snapshot); // rollback
      setErr("Couldn't delete item. Please try again.");
    }
  };

  /** ---- Render ---- */
  return (
    <div className={`page page-wardrobe ${isMobileView ? "is-mobile" : ""}`}>
      <header className={`wardrobe-header ${isSticky ? "is-sticky" : ""}`}>
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button
          className="wardrobe-add-button"
          type="button"
          onClick={handleOpenForm}
        >
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
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteItem}
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

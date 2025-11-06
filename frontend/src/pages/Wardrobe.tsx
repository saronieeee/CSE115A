import React, { useEffect, useMemo, useState } from "react";
import "./Wardrobe.css";
import WardrobeAddItemForm from '../components/WardrobeAddItemForm';
import WardrobeItem from "../components/WardrobeItem";
import ItemDetails from "../components/ItemDetails";

const CATEGORIES = ["Shirt", "Pants", "Outerwear"]; // chip list (edit later if dynamic)

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
  // ===== from first file =====
  // Start empty to show the empty-state by default; developer can add sample items for preview.
  const [items, setItems] = useState<WardrobeItemType[]>([]);
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  // First file’s simple title filter (kept)
  const filteredByTitle = items.filter((it) =>
    (it.title || "").toLowerCase().includes(query.toLowerCase())
  );

  // ===== from second file =====
  const [selected, setSelected] = useState<Set<string>>(new Set()); // selected categories
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    const cats = Array.from(selected).join(",");
    if (cats) params.set("categories", cats); // e.g. "shirt,pants"
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
        const mapped: WardrobeItemType[] = (d.items || []).map((row: any) => ({
          id: row.id,
          title: row.category || "Item",
          category: row.category,
          imageUrl: row.image_path, // your UI expects imageUrl
          favorite: !!row.favorite,
        }));
        setItems(mapped);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selected, query]);

  // Second file’s combined (category + text) filter (kept)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = Array.from(selected); // lowercased categories
    return items.filter((it: any) => {
      const cat = (it.category || "").toLowerCase();
      const matchesCat = active.length === 0 || active.includes(cat); // empty = All Items
      const hay = `${it.category ?? ""} ${(it as any).color ?? ""} ${(it as any).occasion ?? ""}`.toLowerCase();
      const matchesText = q === "" || hay.includes(q);
      return matchesCat && matchesText;
    });
  }, [items, query, selected]);

  // Toggle chips (kept)
  const toggleChip = (name: string) => {
    if (name === "All Items") {
      setSelected(new Set()); // clear others
      return;
    }
    const next = new Set(selected);
    const key = name.toLowerCase();
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  return (
    <div className="page page-wardrobe">
      {/* second file header (kept) */}
      <header className="wardrobe-header">
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button className="wardrobe-add-button" type="button" onClick={handleOpenForm}>
          Add Item
        </button>
      </header>
      {isFormOpen && <WardrobeAddItemForm onClose={handleCloseForm} />}
      <section className="wardrobe-content">
        <h2 className="wardrobe-section-heading">Wardrobe</h2>
        <p>Welcome to your wardrobe. This is a placeholder page — replace with your content.</p>
      </section>
      {/* second file controls (kept) */}
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
            className={`category-chip ${selected.size === 0 ? "is-active" : ""}`}
            onClick={() => toggleChip("All Items")}
          >
            All Items
          </button>
          {CATEGORIES.map((c) => {
            const isOn = selected.has(c.toLowerCase());
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

      {/* first file header (kept) */}
      <div className="wardrobe-header">
        <h2>Hi User!</h2>
      </div>

      {/* first file main content (kept) */}
      <main className="wardrobe-content">
        {loading ? (
          <div className="items-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="item-card placeholder" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🖼️</div>
            <h3>Your wardrobe is empty</h3>
            <p>
              Start building your digital wardrobe by adding your first item. Upload photos of your
              clothes and let our AI help organize them automatically.
            </p>
            <button className="btn btn-primary" onClick={() => setItems(sampleItems)}>
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid">
            {(filtered.length ? filtered : filteredByTitle).map((it) => (
              <div key={it.id} className="item-card">
                <WardrobeItem
                  id={it.id}
                  title={it.title}
                  description={it.category}
                  tags={[it.category ?? ""]}
                  imageUrl={it.imageUrl}
                  favorite={!!it.favorite}
                  onClick={() => {
                    /* placeholder for viewing details */
                  }}
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

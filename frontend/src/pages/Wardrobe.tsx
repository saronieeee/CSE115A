import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./Wardrobe.css";
import WardrobeItem from "../components/WardrobeItem";
import WardrobeAddItemForm from "../components/WardrobeAddItemForm";
import ItemDetails from "../components/ItemDetails";
import CreateOutfitModal from "../components/CreateOutfitModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import SelectionBar from "../components/SelectionBar";

const CATEGORIES = ["Shirt", "Pants", "Outerwear", "Accessories", "Shoes"];

type WardrobeItemType = {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  favorite?: boolean;
  tags?: string[];
  color?: string | null;
  occasion?: string | null;
};

const Wardrobe: React.FC = () => {
  const [items, setItems] = useState<WardrobeItemType[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI niceties
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Details modal (from teammate)
  const [selectedItem, setSelectedItem] = useState<WardrobeItemType | null>(null);
  // Handler for opening the details modal
  const handleViewDetails = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (item) setSelectedItem(item);
  };
  const handleCloseDetails = () => setSelectedItem(null);
  const handleSaveDetails = async (
    id: string,
    updatedDetails: { title: string; category: string; tags: string[]; color: string }
  ) => {
    try {
      // 1. Send update to backend
      const res = await fetch(`/api/clothing-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDetails),
      });

      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);

      const { item } = await res.json();

      // 2. Update React state with the returned (saved) item
      setItems((prev) =>
        prev.map((it) => (it.id === id ? {
          ...it,
          title: item.category || it.title,
          category: item.category?.toLowerCase() || it.category,
          tags: updatedDetails.tags,
          color: item.color,
          imageUrl: item.image_url || item.image_path || it.imageUrl,
          favorite: item.favorite
        } : it))
      );

      // 3. Close modal
      setSelectedItem(null);

    } catch (e: any) {
      console.error("Failed to save details:", e);
      alert("Could not save changes. Please try again.");
    }
  };


  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  // Sticky header & responsive checks
  const handleScroll = useCallback(() => setIsSticky(window.scrollY > 100), []);
  const handleResize = useCallback(() => setIsMobileView(window.innerWidth < 1024), []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  // Fetch items (keep your robust primary+fallback)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const params = new URLSearchParams();
        if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
        if (query.trim()) params.set("q", query.trim());
        params.set("limit", "24");
        params.set("offset", "0");

        const apiBase = "http://localhost:4000";
        const primaryUrl = `${apiBase}/api/public/closet-items?${params.toString()}`;
        const fallbackUrl = `/api/clothing-items?${params.toString()}`;

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

        let res = await fetch(primaryUrl, { credentials: "include", signal: ac.signal });
        if (!res.ok) res = await fetch(fallbackUrl, { signal: ac.signal });
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

  // Filters
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
        const hay = `${item.title ?? ""} ${item.category ?? ""} ${item.color ?? ""} ${item.occasion ?? ""}`.toLowerCase();
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
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // --- Your selection + outfit creation flow ---
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedItemIds(new Set());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const handleCreateOutfit = () => {
    if (selectedItemIds.size === 0) return;
    setIsCreateOpen(true);
  };
  const submitCreateOutfit = async ({ name, userId }: { name: string; userId: string }) => {
    const ids = Array.from(selectedItemIds);
    try {
      const r = await fetch("/api/outfits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId, // dev-only; replace with real auth later
        },
        credentials: "include",
        body: JSON.stringify({ name, itemIds: ids }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${r.status}`);
      }
      await r.json();
      setIsCreateOpen(false);
      clearSelection();
    } catch (e: any) {
      alert(`Failed to save outfit: ${e.message}`);
    }
  };

  // Bulk actions for selections
  const handleVirtualTryOn = () => {
    const ids = Array.from(selectedItemIds);
    console.log("Virtual Try-On for:", ids);
    // TODO: route to AI/try-on with selected ids
  };

  const handleAddSelectionToFavorites = async () => {
    if (selectedItemIds.size === 0) return;
    const snapshot = items;
    // optimistic
    setItems((prev) => prev.map((it) => (selectedItemIds.has(it.id) ? { ...it, favorite: true } : it)));
    try {
      const ids = Array.from(selectedItemIds);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/clothing-items/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ favorite: true }),
          })
        )
      );
    } catch (e) {
      console.error("Batch favorite failed", e);
      setItems(snapshot);
      setErr("Failed to add favorites.");
    }
  };

  const handleDeleteSelection = async () => {
    if (selectedItemIds.size === 0) return;
    const snapshot = items;
    const ids = Array.from(selectedItemIds);
    // optimistic remove
    setItems((prev) => prev.filter((it) => !selectedItemIds.has(it.id)));
    setSelectedItemIds(new Set());
    try {
      await Promise.all(ids.map((id) => fetch(`/api/clothing-items/${id}`, { method: "DELETE" })));
    } catch (e) {
      console.error("Batch delete failed", e);
      setItems(snapshot);
      setErr("Failed to delete selection.");
    }
  };

  // --- Teammate’s server-persisted favorite/delete ---
  const toggleFavorite = async (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const nextFav = !current.favorite;

    // optimistic
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: nextFav } : p)));

    try {
      const res = await fetch(`/api/clothing-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFav }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
      const { item } = await res.json();

      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                favorite: item.favorite,
                color: item.color,
                occasion: item.occasion,
                category: (item.category || "").toLowerCase() || p.category,
                imageUrl: item.image_url || item.image_path || p.imageUrl,
              }
            : p
        )
      );
    } catch (e) {
      console.error("Favorite update failed", e);
      // rollback
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !nextFav } : p)));
      setErr("Couldn't save favorite. Please try again.");
    }
  };

  const deleteItem = async (id: string) => {
    const snapshot = items;
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/clothing-items/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`DELETE failed: ${res.status}`);
      // also drop from selection if deleted
      setSelectedItemIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error("Delete failed", e);
      setItems(snapshot); // rollback
      setErr("Couldn't delete item. Please try again.");
    }
  };

  // ---- Render ----
  return (
    <div className={`page page-wardrobe ${isMobileView ? "is-mobile" : ""}`}>
      <header className={`wardrobe-header ${isSticky ? "is-sticky" : ""}`}>
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button className="wardrobe-add-button" type="button" onClick={handleOpenForm}>
          Add Item
        </button>
      </header>

      {isFormOpen && <WardrobeAddItemForm onClose={handleCloseForm} />}

      <section
        className={`wardrobe-controls ${isSticky ? "is-sticky" : ""} ${isMobileView ? "mobile" : ""}`}
      >
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
            className={`category-chip ${selectedCategories.length === 0 ? "is-active" : ""}`}
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
            {(filtered.length ? filtered : filteredByTitle).map((it) => {
              const isSelected = selectedItemIds.has(it.id);
              return (
                <div key={it.id} className={`item-card ${isSelected ? "is-selected" : ""}`}>
                  {/* selection overlay */}
                  <button
                    type="button"
                    className="item-card__select-overlay"
                    onClick={() => toggleSelect(it.id)}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? "Deselect item" : "Select item"}
                  />
                  {/* If you want the details modal on click instead, wire WardrobeItem onClick to handleViewDetails(it.id) and remove the overlay. */}
                  <WardrobeItem
                    id={it.id}
                    title={it.title}
                    description={it.category}
                    tags={it.category ? [it.category] : []}
                    imageUrl={it.imageUrl}
                    favorite={!!it.favorite}
                    selected={selectedItemIds.has(it.id)}
                    onSelect={(id, sel) => {
                      if (sel) {
                        setSelectedItemIds((prev) => {
                          const next = new Set(prev);
                          next.add(id);
                          return next;
                        });
                      } else {
                        setSelectedItemIds((prev) => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }
                    }}
                    onClick={() => handleViewDetails(it.id)}
                  />
                  <ItemDetails
                    id={it.id}
                    favorite={!!it.favorite}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteItem}
                    onViewDetails={() => handleViewDetails(it.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedItemIds.size > 0 && (
        <SelectionBar
          count={selectedItemIds.size}
          onClear={clearSelection}
          onCreate={handleCreateOutfit}
          onVirtualTryOn={handleVirtualTryOn}
          onAddFavorites={handleAddSelectionToFavorites}
          onDelete={handleDeleteSelection}
          disabled={false}
        />
      )}

      <CreateOutfitModal
        open={isCreateOpen}
        defaultName={`Outfit – ${new Date().toLocaleDateString()}`}
        defaultUserId={localStorage.getItem("DTI_DEV_USER_ID") || ""}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={(vals) => {
          localStorage.setItem("DTI_DEV_USER_ID", vals.userId);
          submitCreateOutfit(vals);
        }}
      />

      {/* Details Modal (still available if you later wire it up) */}
      {selectedItem && (
        <ItemDetailsModal
          id={selectedItem.id}
          imageUrl={selectedItem.imageUrl || ""}
          title={selectedItem.title}
          category={selectedItem.category}
          tags={selectedItem.tags || []}
          color={selectedItem.color || ""}
          onClose={handleCloseDetails}
          onSave={(updated) => handleSaveDetails(selectedItem.id, updated)}
        />
      )}

      {/* (legacy array-based selection removed) */}
    </div>
  );
};

export default Wardrobe;

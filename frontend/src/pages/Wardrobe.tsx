import React, { useEffect, useMemo, useState } from "react";
import "./Wardrobe.css";
import WardrobeItem from "../components/WardrobeItem";
import ItemDetails from "../components/ItemDetails";

const CATEGORIES = ["Shirt", "Pants", "Jacket"];

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const filteredByTitle = items.filter((it) =>
    (it.title || "").toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const params = new URLSearchParams();
        const cats = Array.from(selected).join(",");
        if (cats) params.set("categories", cats);
        if (query.trim()) params.set("q", query.trim());
        params.set("limit", "24");
        params.set("offset", "0");

        // Use env or dev proxy; fallback to localhost:4000
        const apiBase = " http://localhost:4000";
        // If your backend route is /api/public/items, use that:
        const url = `${apiBase}/api/public/items?${params.toString()}`;
        // If your current route is /api/clothing-items, swap the line above:
        // const url = `${apiBase}/api/clothing-items?${params.toString()}`;

        const r = await fetch(url, { credentials: "include", signal: ac.signal });
        if (!r.ok) throw new Error(`Network error ${r.status}`);
        const d = await r.json();

        const rows: any[] = Array.isArray(d?.items) ? d.items : [];

        const mapped: WardrobeItemType[] = rows.map((row) => ({
          id: row.id,
          title: row.category || "Item",
          category: row.category ?? undefined,
          // ✅ use the backend-provided imageUrl ONLY; normalize double slashes
          imageUrl: row.imageUrl ? String(row.imageUrl).replace(/([^:]\/)\/+/g, "$1") : undefined,
          favorite: !!row.favorite,
          color: row.color ?? null,
          occasion: row.occasion ?? null,
        }));

        setItems(mapped);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setItems([]);
          setErr("Failed to load closet items.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [selected, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = Array.from(selected);
    return items.filter((it: any) => {
      const cat = (it.category || "").toLowerCase();
      const matchesCat = active.length === 0 || active.includes(cat);
      const hay = `${it.category ?? ""} ${it.color ?? ""} ${it.occasion ?? ""}`.toLowerCase();
      const matchesText = q === "" || hay.includes(q);
      return matchesCat && matchesText;
    });
  }, [items, query, selected]);

  const toggleChip = (name: string) => {
    if (name === "All Items") return setSelected(new Set());
    const next = new Set(selected);
    const key = name.toLowerCase();
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  return (
    <div className="page page-wardrobe">
      <header className="wardrobe-header">
        <h1>Wardrobe</h1>
      </header>

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

      <div className="wardrobe-header">
        <h2>Hi User!</h2>
      </div>

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
        ) : (filtered.length ? filtered : items).length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🖼️</div>
            <h3>Your wardrobe is empty</h3>
            <p>Start building your digital wardrobe by adding your first item.</p>
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
                  imageUrl={it.imageUrl}  // ← uses backend URL, or undefined
                  favorite={!!it.favorite}
                  onClick={() => {}}
                />
                <ItemDetails
                  id={it.id}
                  favorite={!!it.favorite}
                  onToggleFavorite={(id) =>
                    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)))
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

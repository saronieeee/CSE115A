import React, { useEffect, useMemo, useState } from "react";
import "./Wardrobe.css";

const CATEGORIES = ["Shirt", "Pants", "Jacket"]; // chip list (edit later if dynamic)

const Wardrobe: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set()); // selected categories
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const cats = Array.from(selected).join(",");
    if (cats) params.set("categories", cats);   // e.g. "shirt,pants"
    if (query.trim()) params.set("q", query.trim());
    params.set("limit", "24");
    params.set("offset", "0");

    fetch(`/api/clothing-items?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Network error");
        return r.json();
      })
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selected, query]);

  // Toggle chips
  const toggleChip = (name: string) => {
    if (name === "All Items") {
      setSelected(new Set()); // clear others
      return;
    }
    const next = new Set(selected);
    if (next.has(name.toLowerCase())) next.delete(name.toLowerCase());
    else next.add(name.toLowerCase());
    setSelected(next);
  };

  // Derived filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = Array.from(selected); // lowercased categories
    return items.filter((it) => {
      const cat = (it.category || "").toLowerCase();
      const matchesCat = active.length === 0 || active.includes(cat); // empty = All Items
      const hay = `${it.category ?? ""} ${it.color ?? ""} ${it.occasion ?? ""}`.toLowerCase();
      const matchesText = q === "" || hay.includes(q);
      return matchesCat && matchesText;
    });
  }, [items, query, selected]);

  return (
    <div className="page page-wardrobe">
      <header className="wardrobe-header">
        <h1>Wardrobe</h1>
      </header>

      {/* Top controls */}
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

      {/* Items grid - TODO for Sarone*/}
    </div>
  );
};

export default Wardrobe;

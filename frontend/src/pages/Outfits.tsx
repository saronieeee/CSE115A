import React, { useEffect, useState } from "react";
import OutfitCard from "../components/OutfitCard";


type ClosetItem = {
  id: string;
  category: string | null;
  color?: string | null;
  image_path?: string | null;
  image_url?: string | null; // if you’ve resolved public URL
};

type OutfitItemLink = {
  link_id: string;
  category: string | null;
  closet_item: ClosetItem | null;
};

type OutfitRow = {
  id: string;
  name: string;
  worn_count?: number | null;
  last_worn?: string | null;
  user_id?: string;
  items?: OutfitItemLink[];
};

const Outfits: React.FC = () => {
  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const userId = localStorage.getItem("DTI_DEV_USER_ID") || ""; // dev-only header to match backend

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch("/api/outfits", { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        setOutfits(Array.isArray(d?.outfits) ? d.outfits : []);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErr("Failed to load outfits.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const thumbsFor = (o: OutfitRow) => {
    const items = o.items ?? [];
    return items.slice(0, 3).map((j) => {
      const img = j.closet_item?.image_url || j.closet_item?.image_path || "";
      const label = j.category || j.closet_item?.category || undefined;
      return { url: img, label };
    });
  };

  // === mirror of your Wardrobe delete pattern (optimistic with rollback) ===
  const handleDeleteOutfit = async (id: string) => {
    const snapshot = outfits;
    // optimistic remove
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    try {
      const r = await fetch(`/api/outfits/${id}`, {
        method: "DELETE",
        headers: userId ? { "x-user-id": userId } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      console.error("Delete outfit failed", e);
      setOutfits(snapshot); // rollback
      alert("Couldn't delete outfit. Please try again.");
    }
  };

  return (
    <div className="page page-outfits">
      <header>
        <h1>Outfits</h1>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <div className="empty-card">
          <div className="empty-icon">⚠️</div>
          <h3>Couldn’t load outfits</h3>
          <p>{err}</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">🧩</div>
          <h3>No outfits yet</h3>
          <p>Create your first outfit from the Wardrobe page.</p>
        </div>
      ) : (
        <div className="outfits-grid">
          {outfits.map((o) => (
            <OutfitCard
              key={o.id}
              id={o.id}
              name={o.name}
              wornCount={o.worn_count ?? undefined}
              lastWorn={o.last_worn ?? null}
              thumbs={thumbsFor(o)}
              onClick={(id) => {
                // optional: navigate to outfit detail
                console.log("Open outfit", id);
              }}
              onDelete={handleDeleteOutfit}  // ← mirrors Wardrobe delete
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Outfits;

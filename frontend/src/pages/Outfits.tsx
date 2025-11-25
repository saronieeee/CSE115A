import React, { useEffect, useState } from "react";
import OutfitCard from "../components/OutfitCard";
import OutfitDetailsModal from "../components/OutfitDetailsModal";
import "./Outfits.css";

type ClosetItem = {
  id: string;
  category: string | null;
  color?: string | null;
  image_path?: string | null;
  image_url?: string | null;
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
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitRow | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const token = localStorage.getItem("DTI_ACCESS_TOKEN");
        const currentUserId = localStorage.getItem("DTI_DEV_USER_ID"); // Supabase user.id

        if (!token) {
          setOutfits([]);
          setErr("You must be signed in to view outfits.");
          setLoading(false);
          return;
        }

        const r = await fetch("/api/outfits", {
          signal: ac.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const d = await r.json();
        const rawOutfits: OutfitRow[] = Array.isArray(d?.outfits)
          ? d.outfits
          : [];

        const visibleOutfits = currentUserId
          ? rawOutfits.filter((o) => o.user_id === currentUserId)
          : rawOutfits;

        setOutfits(visibleOutfits);
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
    const hasMore = items.length > 3;
    const displayItems = items.slice(0, hasMore ? 2 : 3);
    
    const thumbs = displayItems.map((j) => {
      const img = j.closet_item?.image_url || j.closet_item?.image_path || "";
      const label = j.category || j.closet_item?.category || undefined;
      return { url: img, label };
    });

    if (hasMore) {
      const remaining = items.length - 2;
      thumbs.push({ url: '', label: `+${remaining}`, isCounter: true } as any);
    }

    return thumbs;
  };

  const handleDeleteOutfit = async (id: string) => {
    const snapshot = outfits;
    setOutfits((prev) => prev.filter((o) => o.id !== id));

    try {
      const token = localStorage.getItem("DTI_ACCESS_TOKEN");
      if (!token) throw new Error("Not signed in");

      const r = await fetch(`/api/outfits/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      console.error("Delete outfit failed", e);
      setOutfits(snapshot);
      alert("Couldn't delete outfit. Please try again.");
    }
  };

  const handleWearOutfit = async (outfitId: string) => {
    const token = localStorage.getItem("DTI_ACCESS_TOKEN");

    try {
      const res = await fetch(`/api/outfits/${outfitId}/wear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }

      const { outfit } = await res.json();

      setOutfits((prev) =>
        prev.map((o) =>
          o.id === outfitId
            ? {
                ...o,
                worn_count: outfit.worn_count,
                last_worn: outfit.last_worn,
              }
            : o
        )
      );
    } catch (err) {
      console.error("Wear outfit failed", err);
      alert("Could not mark outfit as worn. Please try again.");
    }
  };

  return (
    <div className="page page-outfits">
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
              lastWorn={o.last_worn}
              thumbs={thumbsFor(o)}
              onClick={(id) => {
                const outfit = outfits.find((outfit) => outfit.id === id);
                if (outfit) setSelectedOutfit(outfit);
              }}
              onDelete={handleDeleteOutfit}
              onWear={handleWearOutfit}
            />
          ))}
        </div>
      )}

      <OutfitDetailsModal
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        outfitName={selectedOutfit?.name || ''}
        items={selectedOutfit?.items || []}
        wornCount={selectedOutfit?.worn_count ?? undefined}
        lastWorn={selectedOutfit?.last_worn}
      />
    </div>
  );
};

export default Outfits;

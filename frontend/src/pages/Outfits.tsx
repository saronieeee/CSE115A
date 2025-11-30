import React, { useEffect, useState } from "react";
import OutfitCard from "../components/OutfitCard";
import OutfitDetailsModal from "../components/OutfitDetailsModal";
import AiImageCard from "../components/AiImageCard";
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

/** Snapshot of items stored on ai_outfits.items (from selectedItems) */
type AiOutfitItem = {
  id?: string;
  title?: string;
  category?: string | null;
  color?: string | null;
  tag?: string | null;
  image?: string | null;
};

type AiOutfitRow = {
  id: string;
  user_id?: string;
  image_url: string;
  items?: AiOutfitItem[];
  created_at?: string | null;
};

const Outfits: React.FC = () => {
  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [aiOutfits, setAiOutfits] = useState<AiOutfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedOutfit, setSelectedOutfit] = useState<OutfitRow | null>(null);
  const [selectedAiOutfit, setSelectedAiOutfit] = useState<AiOutfitRow | null>(null);

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
          setAiOutfits([]);
          setErr("You must be signed in to view outfits.");
          setLoading(false);
          return;
        }

        // 1️⃣ Fetch regular outfits
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
        try {
          const aiRes = await fetch("/api/ai/getOutfits", {
            signal: ac.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const rawAiOutfits: AiOutfitRow[] = Array.isArray(aiData?.outfits)
              ? aiData.outfits
              : [];

            const visibleAiOutfits = currentUserId
              ? rawAiOutfits.filter((o) => o.user_id === currentUserId)
              : rawAiOutfits;

            setAiOutfits(visibleAiOutfits);
          } else {
            console.warn("Failed to load AI outfits", aiRes.status);
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.error("Error fetching AI outfits", err);
          }
        }
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
      thumbs.push({ url: "", label: `+${remaining}`, isCounter: true } as any);
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

  // map AI outfit items snapshot
  const aiItemsToLinks = (ai: AiOutfitRow | null): OutfitItemLink[] => {
    if (!ai || !ai.items) return [];
    return ai.items.map((it, idx) => ({
      link_id: it.id || `ai-${ai.id}-${idx}`,
      category: (it.category || it.tag || null) as string | null,
      closet_item: {
        id: it.id || `ai-${ai.id}-${idx}`,
        category: (it.category || it.tag || null) as string | null,
        color: (it.color || null) as string | null,
        image_path: it.image || null,
        image_url: it.image || null,
      },
    }));
  };

  const noRegularOutfits = outfits.length === 0;
  const noAiOutfits = aiOutfits.length === 0;
  const nothingAtAll = noRegularOutfits && noAiOutfits;

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
      ) : nothingAtAll ? (
        <div className="empty-card">
          <div className="empty-icon">🧩</div>
          <h3>No outfits yet</h3>
          <p>
            Create your first outfit from the Wardrobe page, or generate an AI outfit
            from the AI tab.
          </p>
        </div>
      ) : (
        <>
          {/* Regular outfits */}
          {!noRegularOutfits && (
            <>
              <h2 className="outfits-section-title">Saved outfits</h2>
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
            </>
          )}

          {/* AI outfits */}
          {!noAiOutfits && (
            <>
              <h2 className="outfits-section-title">AI outfits</h2>
              <div className="outfits-grid">
                {aiOutfits.map((ai) => (
                  <AiImageCard
                    key={ai.id}
                    id={ai.id}
                    imageUrl={ai.image_url}
                    createdAt={ai.created_at || undefined}
                    itemCount={ai.items?.length ?? 0}
                    onClick={() => setSelectedAiOutfit(ai)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Regular outfit details */}
      <OutfitDetailsModal
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        outfitName={selectedOutfit?.name || ""}
        items={selectedOutfit?.items || []}
        wornCount={selectedOutfit?.worn_count ?? undefined}
        lastWorn={selectedOutfit?.last_worn}
      />

      {/* AI outfit details — reusing the same modal, but with mapped items */}
      <OutfitDetailsModal
        isOpen={!!selectedAiOutfit}
        onClose={() => setSelectedAiOutfit(null)}
        outfitName="AI Outfit"
        items={aiItemsToLinks(selectedAiOutfit)}
        wornCount={undefined}
        lastWorn={selectedAiOutfit?.created_at ?? undefined}
      />
    </div>
  );
};

export default Outfits;

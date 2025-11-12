import React, { useEffect, useState } from "react";
import OutfitCard from "../components/OutfitCard";
import "./Outfits.css";

type OutfitAPIItem = {
  category: string | null;
  link_id: string;
  closet_item: {
    id: string;
    category: string | null;
    color: string | null;
    image_path: string | null;
    times_worn: number | null;
    user_id: string;
    occasion: string | null;
    favorite: boolean | null;
  } | null;
};

type OutfitAPI = {
  id: string;
  name: string;
  last_worn: string | null;
  worn_count: number | null;
  user_id: string;
  items: OutfitAPIItem[];
};

const Outfits: React.FC = () => {
  const [outfits, setOutfits] = useState<OutfitAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/outfits")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setOutfits(d.outfits || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openOutfit = (id: string) => {
    // TODO: route to outfit detail if you have one (e.g., /outfits/:id)
    // navigate(`/outfits/${id}`)
    console.log("open outfit", id);
  };

  if (loading) {
    return (
      <div className="page page-outfits">
        <header><h1>Outfits</h1></header>
        <section className="outfits-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="outfit-card skeleton" />
          ))}
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page page-outfits">
        <header><h1>Outfits</h1></header>
        <section><p className="error">Failed to load outfits: {err}</p></section>
      </div>
    );
  }

  if (!outfits.length) {
    return (
      <div className="page page-outfits">
        <header><h1>Outfits</h1></header>
        <section><p>No outfits yet—save one from the generator!</p></section>
      </div>
    );
  }

  return (
    <div className="page page-outfits">
      <header><h1>Outfits</h1></header>

      <section className="outfits-grid">
        {outfits.map((o) => {
          // build up to 3 thumbnails (prefer shirt, pants, outerwear order)
          const order = { shirt: 0, pants: 1, outerwear: 2 } as Record<string, number>;
          const imgs = (o.items || [])
            .filter((x) => x.closet_item?.image_path)
            .sort((a, b) => (order[(a.category || a.closet_item?.category || "")] ?? 99) - (order[(b.category || b.closet_item?.category || "")] ?? 99))
            .map((x) => ({
              url: x.closet_item!.image_path as string,
              label: (x.category || x.closet_item?.category || undefined) || undefined,
            }));

          return (
            <OutfitCard
              key={o.id}
              id={o.id}
              name={o.name}
              wornCount={o.worn_count ?? undefined}
              lastWorn={o.last_worn}
              thumbs={imgs.slice(0, 3)}
              onClick={openOutfit}
            />
          );
        })}
      </section>
    </div>
  );
};

export default Outfits;

import { Router } from "express";
import { supabaseService } from "../lib/supabase";

const router = Router();

// LIST all outfits (always include items)
router.get("/", async (req, res) => {
  const userId = req.query.user_id as string | undefined;

  let q = supabaseService
    .from("outfits")
    .select("id,name,last_worn,worn_count,user_id")
    .order("last_worn", { ascending: false })
    .limit(100);
  if (userId) q = q.eq("user_id", userId);

  const { data: outfits, error: outfitErr } = await q;
  if (outfitErr) return res.status(500).json({ error: outfitErr.message });
  if (!outfits?.length) return res.json({ outfits: [] });

  const outfitIds = outfits.map(o => o.id);
  const { data: joins, error: joinErr } = await supabaseService
    .from("outfit_combination_items")
    .select("id, combination_id, item_id, category")
    .in("combination_id", outfitIds);
  if (joinErr) return res.status(500).json({ error: joinErr.message });

  const itemIds = Array.from(new Set((joins ?? []).map(j => j.item_id)));
  const { data: items, error: itemsErr } = await supabaseService
    .from("closet_items")
    .select("id, category, color, image_path, times_worn, user_id, occasion, favorite")
    .in("id", itemIds);
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const itemsById = new Map((items ?? []).map(i => [i.id, i]));
  const joinsByOutfit = new Map<string, any[]>();
  (joins ?? []).forEach(j => {
    const arr = joinsByOutfit.get(j.combination_id) ?? [];
    arr.push({
      category: j.category ?? itemsById.get(j.item_id)?.category ?? null,
      closet_item: itemsById.get(j.item_id) || null,
      link_id: j.id
    });
    joinsByOutfit.set(j.combination_id, arr);
  });

  const order: Record<string, number> = { shirt: 0, pants: 1, jacket: 2 };
  const withItems = outfits.map(o => ({
    id: o.id,
    name: o.name,
    last_worn: o.last_worn,
    worn_count: o.worn_count,
    user_id: o.user_id,
    items: (joinsByOutfit.get(o.id) ?? []).sort(
      (a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99)
    )
  }));

  return res.json({ outfits: withItems });
});

/* List outfit based on outfit id*/
router.get("/:id", async (req, res) => {
  const outfitId = req.params.id;

  // Fetch the outfit
  const { data: outfit, error: outfitErr } = await supabaseService
    .from("outfits")
    .select("id,name,last_worn,worn_count")
    .eq("id", outfitId)
    .single();

  if (outfitErr) {
    if (outfitErr.code === "PGRST116" /* no rows */) {
      return res.status(404).json({ error: "Outfit not found" });
    }
    return res.status(500).json({ error: outfitErr.message });
  }

  // JOIN
  const { data: joins, error: joinErr } = await supabaseService
    .from("outfit_combination_items")
    .select("id, combination_id, item_id, category")
    .eq("combination_id", outfitId);

  if (joinErr) return res.status(500).json({ error: joinErr.message });

  const itemIds = (joins ?? []).map(j => j.item_id).filter(Boolean);
  if (!itemIds.length) {
    return res.json({ ...outfit, items: [] });
  }

  // 3) Fetch the actual closet items in one query
  const { data: items, error: itemsErr } = await supabaseService
    .from("closet_items")
    .select("id, category, color, image_path, times_worn, user_id, occasion, favorite")
    .in("id", itemIds);

  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  // Join the data together based on the category
  // Currently the only categoies for clothing are shirt, pants, jacket
  const byId = new Map((items ?? []).map(i => [i.id, i]));
  const merged = (joins ?? [])
    .map(j => ({
      category: j.category,
      closet_item: byId.get(j.item_id) || null,
      link_id: j.id
    }))

    // consistent order
    .sort((a, b) => {
      const order = { shirt: 0, pants: 1, jacket: 2 } as Record<string, number>;
      return (order[a.category] ?? 99) - (order[b.category] ?? 99);
    });

  return res.json({
    id: outfit.id,
    name: outfit.name,
    last_worn: outfit.last_worn,
    worn_count: outfit.worn_count,
    items: merged
  });
});

export default router;

import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { resolvePublicImageUrlAndFixPath } from "../utils/resolveImageUrl";
import { requireUser } from "../lib/requireUser";

const router = Router();

// LIST all outfits for current user (always include items)
router.get("/", requireUser, async (req, res) => {
  const user = (req as any).user;
  const userId = user.id;

  let q = supabaseService
    .from("outfits")
    .select("id,name,last_worn,worn_count,user_id")
    .eq("user_id", userId) // 🔐 only this user’s outfits
    .order("last_worn", { ascending: false })
    .limit(100);

  const { data: outfits, error: outfitErr } = await q;
  if (outfitErr) return res.status(500).json({ error: outfitErr.message });
  if (!outfits?.length) return res.json({ outfits: [] });

  const outfitIds = outfits.map((o) => o.id);
  const { data: joins, error: joinErr } = await supabaseService
    .from("outfit_combination_items")
    .select("id, combination_id, item_id, category")
    .in("combination_id", outfitIds);
  if (joinErr) return res.status(500).json({ error: joinErr.message });

  const itemIds = Array.from(new Set((joins ?? []).map((j) => j.item_id)));

  const { data: items, error: itemsErr } = await supabaseService
    .from("closet_items")
    .select(
      "id, category, color, image_path, image_url, times_worn, user_id, occasion, favorite"
    )
    .in("id", itemIds);

  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const hydratedItems = await Promise.all(
    (items ?? []).map(async (it) => {
      let finalUrl = it.image_url;
      if (!finalUrl && it.image_path) {
        try {
          const resolved = await resolvePublicImageUrlAndFixPath(
            it.id,
            it.image_path,
            SUPABASE_URL
          );
          finalUrl = resolved || it.image_path;
        } catch {
          finalUrl = it.image_path || null;
        }
      }
      return { ...it, image_url: finalUrl };
    })
  );

  const itemsById = new Map(hydratedItems.map((i) => [i.id, i]));
  const joinsByOutfit = new Map<string, any[]>();

  (joins ?? []).forEach((j) => {
    const src = itemsById.get(j.item_id) || null;
    const arr = joinsByOutfit.get(j.combination_id) ?? [];
    arr.push({
      category: j.category ?? src?.category ?? null,
      closet_item: src,
      link_id: j.id,
    });
    joinsByOutfit.set(j.combination_id, arr);
  });

  const order: Record<string, number> = { shirt: 0, pants: 1, outerwear: 2 };
  const withItems = outfits.map((o) => ({
    id: o.id,
    name: o.name,
    last_worn: o.last_worn,
    worn_count: o.worn_count,
    user_id: o.user_id,
    items: (joinsByOutfit.get(o.id) ?? []).sort(
      (a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99)
    ),
  }));

  return res.json({ outfits: withItems });
});

/* Get single outfit (owner only) */
router.get("/:id", requireUser, async (req, res) => {
  const outfitId = req.params.id;
  const user = (req as any).user;
  const userId = user.id;

  const { data: outfit, error: outfitErr } = await supabaseService
    .from("outfits")
    .select("id,name,last_worn,worn_count,user_id")
    .eq("id", outfitId)
    .eq("user_id", userId) // 🔐 must belong to current user
    .single();

  if (outfitErr) {
    if (outfitErr.code === "PGRST116") {
      return res.status(404).json({ error: "Outfit not found" });
    }
    return res.status(500).json({ error: outfitErr.message });
  }

  const { data: joins, error: joinErr } = await supabaseService
    .from("outfit_combination_items")
    .select("id, combination_id, item_id, category")
    .eq("combination_id", outfitId);

  if (joinErr) return res.status(500).json({ error: joinErr.message });

  const itemIds = (joins ?? []).map((j) => j.item_id).filter(Boolean);
  if (!itemIds.length) {
    return res.json({ ...outfit, items: [] });
  }

  const { data: items, error: itemsErr } = await supabaseService
    .from("closet_items")
    .select(
      "id, category, color, image_path, times_worn, user_id, occasion, favorite"
    )
    .in("id", itemIds);

  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const byId = new Map((items ?? []).map((i) => [i.id, i]));
  const merged = (joins ?? [])
    .map((j) => ({
      category: j.category,
      closet_item: byId.get(j.item_id) || null,
      link_id: j.id,
    }))
    .sort((a, b) => {
      const order = { shirt: 0, pants: 1, outerwear: 2 } as Record<string, number>;
      return (order[a.category] ?? 99) - (order[b.category] ?? 99);
    });

  return res.json({
    id: outfit.id,
    name: outfit.name,
    last_worn: outfit.last_worn,
    worn_count: outfit.worn_count,
    items: merged,
  });
});

const normalizeCategory = (raw?: string | null) => {
  const c = (raw || "").trim().toLowerCase();
  if (!c) return null;
  if (c === "jacket") return "outerwear";
  if (["shirt", "pants", "outerwear"].includes(c)) return c;
  return null;
};

type CreateOutfitBody = {
  name?: string;
  itemIds: string[];
};

router.post("/", requireUser, async (req, res) => {
  const { name, itemIds }: CreateOutfitBody = req.body || {};
  const user = (req as any).user;
  const userId = user.id;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: "itemIds must be a non-empty array" });
  }

  try {
    const outfitName =
      (typeof name === "string" && name.trim()) ||
      `Outfit – ${new Date().toLocaleDateString()}`;

    const { data: created, error: outfitErr } = await supabaseService
      .from("outfits")
      .insert([{ name: outfitName, user_id: userId }])
      .select("id, name")
      .single();

    if (outfitErr || !created) {
      return res
        .status(500)
        .json({ error: outfitErr?.message || "Failed to create outfit" });
    }
    const newOutfitId = created.id as string;

    const { data: items, error: itemsErr } = await supabaseService
      .from("closet_items")
      .select("id, user_id, category")
      .in("id", itemIds);

    if (itemsErr) {
      await supabaseService.from("outfits").delete().eq("id", newOutfitId);
      return res.status(500).json({ error: itemsErr.message });
    }

    const byId = new Map((items || []).map((i) => [i.id, i]));
    const invalid: string[] = [];
    itemIds.forEach((iid) => {
      const row = byId.get(iid);
      if (!row || row.user_id !== userId) invalid.push(iid);
    });
    if (invalid.length) {
      await supabaseService.from("outfits").delete().eq("id", newOutfitId);
      return res.status(403).json({
        error: "Items not found or do not belong to the user",
        invalidItemIds: invalid,
      });
    }

    const joinRows = itemIds.map((iid) => {
      const dbCat = byId.get(iid)?.category ?? null;
      const cat = normalizeCategory(dbCat);
      return { combination_id: newOutfitId, item_id: iid, category: cat };
    });

    if (joinRows.length) {
      const { error: joinErr } = await supabaseService
        .from("outfit_combination_items")
        .insert(joinRows);
      if (joinErr) {
        await supabaseService.from("outfits").delete().eq("id", newOutfitId);
        return res.status(500).json({ error: joinErr.message });
      }
    }

    return res.status(201).json({ id: newOutfitId, name: created.name });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

router.delete("/:id", requireUser, async (req, res) => {
  const outfitId = req.params.id;
  const user = (req as any).user;
  const userId = user.id;

  const { data: outfit, error: fetchErr } = await supabaseService
    .from("outfits")
    .select("id,user_id")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) {
    return res.status(404).json({ error: "Outfit not found" });
  }
  if (outfit.user_id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { error: joinErr } = await supabaseService
    .from("outfit_combination_items")
    .delete()
    .eq("combination_id", outfitId);
  if (joinErr) return res.status(500).json({ error: joinErr.message });

  const { error: outfitErr } = await supabaseService
    .from("outfits")
    .delete()
    .eq("id", outfitId);
  if (outfitErr) return res.status(500).json({ error: outfitErr.message });

  return res.json({ success: true });
});

export default router;

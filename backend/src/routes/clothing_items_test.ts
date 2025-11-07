import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { resolvePublicImageUrlAndFixPath } from "../utils/resolveImageUrl";

const router = Router();

router.get("/closet-items", async (_req, res) => {
  const { data, error } = await supabaseService
    .from("closet_items")
    .select("id,user_id,image_path, image_url,category,occasion,color,favorite,times_worn");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || "";

  const itemsWithImageUrls = await Promise.all(
    (data ?? []).map(async (item) => {
      if (item.image_url) {
        return { ...item, imageUrl: item.image_url };
      }
      const resolvedUrl = await resolvePublicImageUrlAndFixPath(
        String(item.id) as any,
        item.image_path,
        SUPABASE_URL
      );

      return {
        ...item,
        imageUrl: resolvedUrl,
      };
    })
  );

  return res.json({ items: itemsWithImageUrls });
});

router.post("/closet-items/:id/image-url", async (req, res) => {
  try {
    const { id } = req.params;

    // fetch row to get image_path
    const { data: row, error: fetchErr } = await supabaseService
      .from("closet_items")
      .select("id,image_path")
      .eq("id", id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ error: fetchErr?.message || "Item not found" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || "";
    const resolvedUrl = await resolvePublicImageUrlAndFixPath(
      String(row.id) as any, // see note above about changing the resolver to accept string
      row.image_path,
      SUPABASE_URL
    );

    // persist to DB (ok if null; it just clears image_url)
    const { data: updated, error: updErr } = await supabaseService
      .from("closet_items")
      .update({ image_url: resolvedUrl ?? null })
      .eq("id", row.id)
      .select("id,user_id,image_path,image_url,category,occasion,color,favorite,times_worn")
      .single();

    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ item: updated });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
});


router.post("/closet-items/backfill-image-url", async (_req, res) => {
  try {
    const { data, error } = await supabaseService
      .from("closet_items")
      .select("id,image_path,image_url");

    if (error) return res.status(500).json({ error: error.message });

    const SUPABASE_URL = process.env.SUPABASE_URL || "";
    let updated = 0;

    for (const row of data ?? []) {
      // Skip if we already have image_url and you don't want to refresh it
      if (row.image_url) continue;

      const resolvedUrl = await resolvePublicImageUrlAndFixPath(
        String(row.id) as any, // see resolver type note
        row.image_path,
        SUPABASE_URL
      );

      const { error: updErr } = await supabaseService
        .from("closet_items")
        .update({ image_url: resolvedUrl ?? null })
        .eq("id", row.id);

      if (!updErr) updated += 1;
      else console.error("Update failed for", row.id, updErr.message);
    }

    return res.json({ ok: true, updated });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
});

export default router;

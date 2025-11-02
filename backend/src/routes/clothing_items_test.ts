import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { resolvePublicImageUrlAndFixPath } from "../utils/resolveImageUrl";

const router = Router();

router.get("/closet-items", async (_req, res) => {
  const { data, error } = await supabaseService
    .from("closet_items")
    .select("id,user_id,image_path,category,occasion,color,favorite,times_worn");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || "";

  const itemsWithImageUrls = await Promise.all(
    (data ?? []).map(async (item) => {
      const resolvedUrl = await resolvePublicImageUrlAndFixPath(
        item.id,
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

export default router;

import { Router } from "express";
import { supabaseService } from "../lib/supabase";

const router = Router();

/**
 * GET /api/public/closet-items
 * - Returns all closet items
 * - (image_url is now always set automatically by a DB trigger)
 */
router.get("/closet-items", async (_req, res) => {
  try {
    const { data, error } = await supabaseService
      .from("closet_items")
      .select(
        "id,user_id,image_path,image_url,category,occasion,color,favorite,times_worn,last_worn"
      );

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  } catch (e) {
    console.error("GET /closet-items error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;

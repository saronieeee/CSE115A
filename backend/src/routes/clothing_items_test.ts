import { Router } from "express";
import { supabaseService } from "../lib/supabase";

const router = Router();

router.get("/clothing-items", async (_req, res) => {
  const { data, error } = await supabaseService
    .from("clothing_items")
    .select("id,user_id, image_url,category,occasion,color,favorite,times_worn");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data ?? [] });
});

export default router;

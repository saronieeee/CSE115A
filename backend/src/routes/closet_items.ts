import { Router } from "express";
import { supabaseService } from "../lib/supabase";

const router = Router();

// get a single clothing item by id
router.get("/clothing-items/:id", async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseService
      .from("closet_items")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(404).json({ error: error.message });
    res.json({ item: data });
});

// get clothing items by category
router.get("/clothing-items/type/:category", async (req, res) => {
    const { category } = req.params;
    const { data, error } = await supabaseService
      .from("closet_items")
      .select("*")
      .eq("category", category);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ items: data ?? [] });
});

router.post("/clothing-items", async (req, res) => {
  const { user_id, category, image_path, occasion, color, favorite, times_worn } = req.body;
  if (!user_id || !category) {
    return res.status(400).json({ error: "Missing required field(s): user_id and category are required." });
  }

  const insertObj: any = { user_id, category };
  if (image_path !== undefined) insertObj.image_path = image_path;
  if (occasion !== undefined) insertObj.occasion = occasion;
  if (color !== undefined) insertObj.color = color;
  if (favorite !== undefined) insertObj.favorite = favorite;
  if (times_worn !== undefined) insertObj.times_worn = times_worn;

  const { data, error } = await supabaseService.from("closet_items").insert([insertObj]).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ item: data?.[0] });
});

// delete a clothing item by id
router.delete("/clothing-items/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseService
    .from("closet_items")
    .delete()
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// edit a clothing item by id
router.patch("/clothing-items/:id", async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: "No fields provided for update." });
  }
  const { data, error } = await supabaseService
    .from("closet_items")
    .update(updateFields)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ item: data });
});

export default router;

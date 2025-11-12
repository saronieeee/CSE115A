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
      .eq("category", String(category).toLowerCase());
    if (error) return res.status(500).json({ error: error.message });
    res.json({ items: data ?? [] });
});

router.post("/clothing-items", async (req, res) => {
  const { user_id, category, image_path, occasion, color, favorite, times_worn } = req.body;
  if (!user_id || !category) {
    return res.status(400).json({ error: "Missing required field(s): user_id and category are required." });
  }

  const insertObj: any = {
    user_id,
    category: String(category).toLowerCase(),
  };

  if (image_path !== undefined) insertObj.image_path = image_path;
  if (occasion !== undefined) insertObj.occasion = occasion;
  if (color !== undefined) insertObj.color = color;
  if (favorite !== undefined) insertObj.favorite = favorite;
  if (times_worn !== undefined) insertObj.times_worn = times_worn;

  const { data, error } = await supabaseService
    .from("closet_items")
    .insert([insertObj])
    .select("*"); // include image_url set by DB trigger

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
  res.status(204).send();
});

// edit a clothing item by id
router.patch("/clothing-items/:id", async (req, res) => {
  const { id } = req.params;
  const { favorite, color, occasion, times_worn, category } = req.body ?? {};

  const updateFields: Record<string, any> = {};
  if (typeof favorite === "boolean") updateFields.favorite = favorite;
  if (typeof color === "string") updateFields.color = color;
  if (typeof occasion === "string") updateFields.occasion = occasion;
  if (Number.isInteger(times_worn)) updateFields.times_worn = times_worn;
  if (typeof category === "string") updateFields.category = category.toLowerCase();

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: "No valid fields to update." });
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

// list clothing items with optional multi-category + search + pagination
router.get("/clothing-items", async (req, res) => {
  const categoriesRaw = (req.query.categories as string | undefined)?.trim();
  const categories = categoriesRaw
    ? categoriesRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const q = (req.query.q as string | undefined)?.trim();

  const limit = Math.min(Math.max(Number(req.query.limit ?? 24), 1), 100); // 1..100
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  let query = supabaseService
    .from("closet_items")
    .select(
      "id,user_id,image_path,image_url,category,occasion,color,favorite,times_worn",
      { count: "exact" }
    )
    .order("id", { ascending: false }) 
    .range(offset, offset + limit - 1);

  if (categories.length) {
    query = query.in("category", categories);
  }

  if (q) {
    query = query.or(
      // case sensitive
      `category.ilike.%${q}%,color.ilike.%${q}%,occasion.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({
    items: data ?? [],
    page: { limit, offset, count: data?.length ?? 0 }
  });
});


export default router;

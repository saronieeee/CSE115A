import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";

const router = Router();

/**
 * GET /clothing-items/:id
 * Only allow the owner to access this item
 */
router.get("/clothing-items/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const { data, error } = await supabaseService
    .from("closet_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // only return if owned by this user
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json({ item: data });
});

/**
 * GET /clothing-items/type/:category
 * Only allow user to view their own items of that category
 */
router.get("/clothing-items/type/:category", requireUser, async (req, res) => {
  const { category } = req.params;
  const user = (req as any).user;

  const { data, error } = await supabaseService
    .from("closet_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", String(category).toLowerCase());

  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data ?? [] });
});

/**
 * POST /clothing-items
 * Automatically sets user_id from JWT (never trust frontend)
 */
router.post("/clothing-items", requireUser, async (req, res) => {
  const user = (req as any).user; // logged-in user
  const { category, image_path, image_url, occasion, color, favorite, times_worn, last_worn } = req.body ?? {};

  if (!category) {
    return res.status(400).json({ error: "Category is required." });
  }

  const insertObj: any = {
    user_id: user.id, // use logged-in user
    category: String(category).toLowerCase(),
  };

  if (image_path !== undefined) insertObj.image_path = image_path;
  if (image_url !== undefined) insertObj.image_url = image_url;
  if (occasion !== undefined) insertObj.occasion = occasion;
  if (color !== undefined) insertObj.color = color;
  if (favorite !== undefined) insertObj.favorite = favorite;
  if (times_worn !== undefined) insertObj.times_worn = times_worn;
  if (last_worn !== undefined) insertObj.last_worn = last_worn;

  const { data, error } = await supabaseService
    .from("closet_items")
    .insert([insertObj])
    .select("*"); // includes URL from trigger

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ item: data?.[0] });
});

/**
 * DELETE /clothing-items/:id
 * Only allow the owner to delete the item
 */
router.delete("/clothing-items/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const { error } = await supabaseService
    .from("closet_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // ensure ownership

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

/**
 * PATCH /clothing-items/:id
 * Only allow the owner to update the item
 */
router.patch("/clothing-items/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { favorite, color, occasion, times_worn, last_worn, category } = req.body ?? {};

  const updateFields: Record<string, any> = {};
  if (typeof favorite === "boolean") updateFields.favorite = favorite;
  if (typeof color === "string") updateFields.color = color;
  if (typeof occasion === "string") updateFields.occasion = occasion;
  if (Number.isInteger(times_worn)) updateFields.times_worn = times_worn;
  if (typeof last_worn === "string") updateFields.last_worn = last_worn;
  if (typeof category === "string") updateFields.category = category.toLowerCase();

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: "No valid fields to update." });
  }

  const { data, error } = await supabaseService
    .from("closet_items")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id) // owner-only update
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ item: data });
});

/**
 * GET /clothing-items
 * Main wardrobe query — filtered to the logged-in user
 * Supports categories, search query, pagination
 */
router.get("/clothing-items", requireUser, async (req, res) => {
  const user = (req as any).user;

  const categoriesRaw = (req.query.categories as string | undefined)?.trim();
  const categories = categoriesRaw
    ? categoriesRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const q = (req.query.q as string | undefined)?.trim();

  const limit = Math.min(Math.max(Number(req.query.limit ?? 24), 1), 100);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  let query = supabaseService
    .from("closet_items")
    .select(
      "id,user_id,image_path,image_url,category,occasion,color,favorite,times_worn",
      { count: "exact" }
    )
    .eq("user_id", user.id) // only return this user’s wardrobe
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categories.length) {
    query = query.in("category", categories);
  }

  if (q) {
    query = query.or(
      `category.ilike.%${q}%,color.ilike.%${q}%,occasion.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({
    items: data ?? [],
    page: { limit, offset, count: count ?? 0 },
  });
});

export default router;

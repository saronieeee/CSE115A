import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";

const router = Router();

router.use(requireUser);

// list clothing items with optional multi-category + search + pagination
router.get("/", async (req, res) => {
  const user = (req as any).user;
  const queryParams = req.query as Record<string, string | undefined>;
  const categoriesRaw = queryParams.categories?.trim();
  const search = queryParams.q?.trim();
  const limitRaw = queryParams.limit ?? "24";
  const offsetRaw = queryParams.offset ?? "0";

  const limit = Math.min(Math.max(Number(limitRaw) || 24, 1), 100);
  const offset = Math.max(Number(offsetRaw) || 0, 0);

  let query = supabaseService
    .from("closet_items")
    .select("id,user_id,image_path,category,occasion,color,favorite,times_worn")
    .eq("user_id", user.id)
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoriesRaw) {
    const categories = categoriesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (categories.length) {
      query = query.in("category", categories);
    }
  }

  if (search) {
    query = query.or(`category.ilike.%${search}%,color.ilike.%${search}%,occasion.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    items: data ?? [],
    page: { limit, offset, count: data?.length ?? 0 },
  });
});

// get clothing items by category
router.get("/type/:category", async (req, res) => {
  const user = (req as any).user;
  const { category } = req.params;

  const { data, error } = await supabaseService
    .from("closet_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ items: data ?? [] });
});

// get a single clothing item by id
router.get("/:id", async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const { data, error } = await supabaseService
    .from("closet_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Clothing item not found." });
  }

  return res.json({ item: data });
});

router.post("/", async (req, res) => {
  const user = (req as any).user;
  const { category, image_path, occasion, color, favorite, times_worn } = req.body ?? {};

  if (!category) {
    return res.status(400).json({ error: "Missing required field: category." });
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    category,
  };

  if (image_path !== undefined) payload.image_path = image_path;
  if (occasion !== undefined) payload.occasion = occasion;
  if (color !== undefined) payload.color = color;
  if (favorite !== undefined) payload.favorite = favorite;
  if (times_worn !== undefined) payload.times_worn = times_worn;

  const { data, error } = await supabaseService.from("closet_items").insert(payload).select().maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ item: data });
});

// edit a clothing item by id
router.patch("/:id", async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const updateFields = req.body ?? {};

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: "No fields provided for update." });
  }

  const { data, error } = await supabaseService
    .from("closet_items")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Clothing item not found." });
  }

  return res.json({ item: data });
});

// delete a clothing item by id
router.delete("/:id", async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const { error } = await supabaseService
    .from("closet_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true });
});

export default router;

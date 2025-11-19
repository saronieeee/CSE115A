import { Router } from "express";
import type { Response } from "express";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";
import { fetchProfileRow, type ProfileRow } from "../lib/profileStore";

const router = Router();

// minimal snapshot of closet_items
type ClosetItemRow = {
  times_worn?: number | null;
  image_url?: string | null;
  image_path?: string | null;
};

// public URL, or fallback to the storage path
const getItemImage = (item?: ClosetItemRow | null) =>
  item?.image_url || item?.image_path || null;


// DB row
const toProfilePayload = (row: ProfileRow) => ({
  id: row.id,
  name: row.full_name || row.name || null,
  email: row.email || "",
  avatarUrl: row.avatar_url ?? null,
  bio: row.bio ?? null,
});

// profile endpoint returns either a profile row or error
const respondWithProfile = async (res: Response, userId?: string) => {
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { row, status, errorMessage } = await fetchProfileRow(userId);
  if (!row) {
    return res.status(status).json({ error: errorMessage || "Profile not found" });
  }

  return res.json({ profile: toProfilePayload(row) });
};

// dashboard endpoint that bundles profile and wardrobe stats
const respondWithDashboard = async (res: Response, userId?: string) => {
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { row: profileRow, status, errorMessage } = await fetchProfileRow(userId);
  if (!profileRow && status !== 404) {
    return res.status(status).json({ error: errorMessage || "Profile not found" });
  }

  const totalItemsPromise = supabaseService
    .from("closet_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const outfitCountPromise = supabaseService
    .from("outfits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const itemsAddedThisMonthPromise = supabaseService
    .from("closet_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const mostWornPromise = supabaseService
    .from("closet_items")
    .select("id,times_worn,image_url,image_path")
    .eq("user_id", userId)
    .order("times_worn", { ascending: false, nullsFirst: false })
    .limit(1);

  const [
    { count: totalItems, error: totalItemsError },
    { count: outfitCount, error: outfitCountError },
    { count: itemsAddedThisMonth, error: itemsAddedThisMonthError },
    { data: mostWornRows, error: mostWornError },
  ] = await Promise.all([
    totalItemsPromise,
    outfitCountPromise,
    itemsAddedThisMonthPromise,
    mostWornPromise,
  ]);

  const firstError =
    totalItemsError ||
    outfitCountError ||
    itemsAddedThisMonthError ||
    mostWornError;

  if (firstError) {
    return res.status(500).json({ error: firstError.message });
  }

  const mostWorn: ClosetItemRow | null = Array.isArray(mostWornRows) ? mostWornRows[0] ?? null : null;

  const totalItemsSafe = totalItems ?? 0;
  const outfitCountSafe = outfitCount ?? 0;
  const itemsAddedThisMonthSafe = itemsAddedThisMonth ?? 0;

  const stats = [
    {
      title: "Total Items",
      value: String(totalItemsSafe),
      sub: totalItemsSafe ? `+${itemsAddedThisMonthSafe} this month` : "Add your first item",
      positive: totalItemsSafe > 0,
    },
    {
      title: "Outfits",
      value: String(outfitCountSafe),
      sub: outfitCountSafe ? "Ready to wear" : "Create your first outfit",
    },
    {
      title: "Most Worn",
      sub: mostWorn ? `${mostWorn.times_worn ?? 0} times` : "No wear data yet",
      imageUrl: getItemImage(mostWorn),
    },
    {
      title: "New Items",
      value: String(itemsAddedThisMonthSafe),
      sub: itemsAddedThisMonthSafe ? "Added this month" : "No new items yet",
      positive: itemsAddedThisMonthSafe > 0,
    },
  ];

  return res.json({
    profile: profileRow
      ? toProfilePayload(profileRow)
      : {
          id: userId,
          name: null,
          email: "",
          avatarUrl: null,
          bio: null,
        },
    stats,
  });
};


router.get("/me", requireUser, async (req, res) => {
  const supabaseUser = (req as any).user;
  const userId = supabaseUser?.id;
  return respondWithProfile(res, userId);
});

router.get("/me/dashboard", requireUser, async (req, res) => {
  const supabaseUser = (req as any).user;
  const userId = supabaseUser?.id;
  return respondWithDashboard(res, userId);
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  return respondWithProfile(res, userId);
});

router.get("/:userId/dashboard", async (req, res) => {
  const { userId } = req.params;
  return respondWithDashboard(res, userId);
});

export default router;

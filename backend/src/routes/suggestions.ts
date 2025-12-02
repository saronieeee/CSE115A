import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";

const router = Router();

type ClosetItemRow = {
  id: string;
  title?: string | null;
  category?: string | null;
  color?: string | null;
  times_worn?: number | null;
  last_worn?: string | null;   // timestamptz
  created_at?: string | null;  // timestamptz
  occasion?: string | null;
  favorite?: boolean | null;
};

type DonationLevel = "keep" | "maybe_donate" | "donate";

type DonationSuggestion = {
  level: DonationLevel;
  score: number;
  reason: string;
};
function computeDonationSuggestion(item: ClosetItemRow): DonationSuggestion {
  const now = Date.now();

  const createdAtMs = item.created_at ? Date.parse(item.created_at) : NaN;
  const lastWornMs = item.last_worn ? Date.parse(item.last_worn) : NaN;

  const ageDays = isNaN(createdAtMs)
    ? 0
    : Math.max(1, Math.floor((now - createdAtMs) / (1000 * 60 * 60 * 24)));

  const daysSinceLastWorn = isNaN(lastWornMs)
    ? Infinity
    : Math.floor((now - lastWornMs) / (1000 * 60 * 60 * 24));

  const timesWorn = item.times_worn ?? 0;
  const occasion = (item.occasion || "").toLowerCase();
  const isFormal =
    occasion === "formal" || occasion === "business" || occasion === "party";

  // 0) Favorites: always keep
  if (item.favorite) {
    return {
      level: "keep",
      score: 0,
      reason: "You marked this as a favorite item.",
    };
  }

  // 1) Very new + recently worn items: grace period
  //    (only if both the item is new AND last worn is within ~2 months)
  if (ageDays < 60 && daysSinceLastWorn <= 60) {
    return {
      level: "keep",
      score: 0.2,
      reason: "This item is new and you’ve worn it recently.",
    };
  }

  // 2) Strong donate candidates: basically forgotten
  //    - worn at most once
  //    - not touched in over a year
  if (timesWorn <= 1 && daysSinceLastWorn >= 365) {
    return {
      level: "donate",
      score: 1.0,
      reason:
        "You’ve worn this at most once and haven’t reached for it in over a year.",
    };
  }

  // 3) Never worn for a long time (covers cases with missing created_at)
  if (timesWorn === 0 && daysSinceLastWorn >= 180) {
    return {
      level: "donate",
      score: 0.95,
      reason:
        "This has been in your closet for months and you’ve never worn it.",
    };
  }

  // 4) Soft donate candidates (everyday clothes)
  if (!isFormal && ageDays >= 365 && daysSinceLastWorn >= 180 && timesWorn <= 3) {
    return {
      level: "maybe_donate",
      score: 0.8,
      reason:
        "You’ve rarely worn this and haven’t reached for it in a long time.",
    };
  }

  // 5) Rare formal pieces: still suggest maybe donate if truly dead
  if (isFormal && ageDays >= 2 * 365 && timesWorn <= 1 && daysSinceLastWorn >= 365) {
    return {
      level: "maybe_donate",
      score: 0.7,
      reason:
        "This formal piece has barely been worn in over 2 years—it might be time to donate.",
    };
  }

  // Default: keep
  return {
    level: "keep",
    score: 0.1,
    reason: "You wear this item often enough to keep it in your closet.",
  };
}


// GET /api/suggestions/donation-suggestions
router.get("/donation-suggestions", requireUser, async (req, res) => {
  const user = (req as any).user;
  const userId = user.id;

  try {
    const { data: items, error } = await supabaseService
      .from("closet_items")
      .select(
        "id, category, color, times_worn, last_worn, created_at, occasion, favorite, image_url"
      )
      .eq("user_id", userId);

    if (error) {
      console.error("[donation-suggestions] fetch error", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to load closet items" });
    }

    const suggestions = (items || []).map((item) => {
      const suggestion = computeDonationSuggestion(item as ClosetItemRow);
      return {
        id: item.id,
        category: item.category,
        color: item.color,
        image_url: item.image_url,
        times_worn: item.times_worn,
        last_worn: item.last_worn,
        suggestion, // { level, score, reason }
      };
    });

    // Optional: sort by "most donate-y" first
    suggestions.sort((a, b) => b.suggestion.score - a.suggestion.score);

    return res.json({ items: suggestions });
  } catch (e: any) {
    console.error("[donation-suggestions] unexpected", e);
    return res
      .status(500)
      .json({ error: e?.message || "Server error generating suggestions" });
  }
});

export default router;

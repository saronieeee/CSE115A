import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";
import fetch from "node-fetch";

const router = Router();
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

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
  if (timesWorn <= 5 && daysSinceLastWorn >= 365) {
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

// GET /api/suggestions/style-summary
// Returns 1–2 sentences describing the user's overall clothing style
router.get("/style-summary", requireUser, async (req, res) => {
  const user = (req as any).user;
  const userId = user.id;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI is not configured" });
  }

  try {
    // 1️⃣ Pull ai_generated_description for this user's items
    const { data: items, error } = await supabaseService
      .from("closet_items")
      .select("ai_generated_description")
      .eq("user_id", userId)
      .not("ai_generated_description", "is", null)
      .limit(150); // safety cap

    if (error) {
      console.error("[style-summary] fetch error", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to load closet items" });
    }

    const descriptions = (items || [])
      .map((it) => (it as any).ai_generated_description as string | null)
      .filter((d) => typeof d === "string" && d.trim().length > 0);

    if (!descriptions.length) {
      // nothing to summarize yet
      return res.json({ summary: null });
    }

    // 2️⃣ Build a compact prompt from descriptions
    const joined = descriptions.slice(0, 80).join("\n- ");

    const chatBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly wardrobe assistant. You will receive short descriptions of a user's clothing items. " +
            "Infer their overall style and write 1–2 concise sentences describing what they tend to wear, " +
            "mentioning patterns like colors, fits, and occasions. Do not mention that you are reading descriptions.",
        },
        {
          role: "user",
          content:
            "Here are some of my clothing items:\n- " +
            joined +
            "\n\nPlease describe my general clothing style in 1–2 sentences.",
        },
      ],
      max_tokens: 120,
      temperature: 0.5,
    };

    const aiRes = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(chatBody),
    });

    const rawText = await aiRes.text();
    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }

    if (!aiRes.ok) {
      console.error("[style-summary] OpenAI error", payload);
      const msg =
        (payload &&
          typeof payload === "object" &&
          payload.error &&
          payload.error.message) ||
        aiRes.statusText ||
        "Failed to generate style summary";
      return res.status(aiRes.status || 500).json({ error: msg });
    }

    const summary =
      payload?.choices?.[0]?.message?.content?.trim() ||
      "We couldn’t infer your style yet.";

    return res.json({ summary });
  } catch (e: any) {
    console.error("[style-summary] unexpected", e);
    return res
      .status(500)
      .json({ error: e?.message || "Server error generating style summary" });
  }
});


export default router;

// backend/src/lib/outfitRules.ts

const TOP_CATEGORIES = ["Shirt"];
const BOTTOM_CATEGORIES = ["Pants", "Shorts", "Skirt"];
const DRESS_CATEGORIES = ["Dress"];
const SHOE_CATEGORIES = ["Shoes"];

export type OutfitItemInput = {
  category: string | null;
};

export function validateOutfitItems(
  items: OutfitItemInput[]
): { ok: boolean; error?: string } {
  const tops = items.filter((i) =>
    i.category ? TOP_CATEGORIES.includes(i.category) : false
  );
  const bottoms = items.filter((i) =>
    i.category ? BOTTOM_CATEGORIES.includes(i.category) : false
  );
  const dresses = items.filter((i) =>
    i.category ? DRESS_CATEGORIES.includes(i.category) : false
  );
  const shoes = items.filter((i) =>
    i.category ? SHOE_CATEGORIES.includes(i.category) : false
  );

  if (shoes.length === 0) {
    return { ok: false, error: "Outfit must include at least one pair of shoes." };
  }

  if (dresses.length > 0) {
    if (dresses.length !== 1) {
      return { ok: false, error: "Outfit can only contain one dress." };
    }
    if (tops.length > 0 || bottoms.length > 0) {
      return {
        ok: false,
        error:
          "Dress outfits cannot include separate tops or bottoms. Remove either the dress, or the extra pieces.",
      };
    }
    return { ok: true };
  }

  if (tops.length !== 1) {
    return { ok: false, error: "Outfit must contain exactly one top." };
  }

  if (bottoms.length !== 1) {
    return {
      ok: false,
      error: "Outfit must contain exactly one bottom (pants/shorts/skirt).",
    };
  }

  return { ok: true };
}

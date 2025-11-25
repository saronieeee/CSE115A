// frontend/src/utils/outfitRules.ts

const TOP_CATEGORIES = ["shirt"];
const BOTTOM_CATEGORIES = ["pants", "shorts", "skirt", "skirts"];
const DRESS_CATEGORIES = ["dress", "dresses"];
const SHOE_CATEGORIES = ["shoes"];

export type OutfitValidationResult = {
  isValid: boolean;
  message?: string;
};

export function validateOutfitSelection(
  selectedItems: { category?: string | null }[]
): OutfitValidationResult {
  const norm = (c?: string | null) => (c ?? "").toLowerCase();

  const tops = selectedItems.filter((i) =>
    TOP_CATEGORIES.includes(norm(i.category))
  );
  const bottoms = selectedItems.filter((i) =>
    BOTTOM_CATEGORIES.includes(norm(i.category))
  );
  const dresses = selectedItems.filter((i) =>
    DRESS_CATEGORIES.includes(norm(i.category))
  );
  const shoes = selectedItems.filter((i) =>
    SHOE_CATEGORIES.includes(norm(i.category))
  );

  if (shoes.length === 0) {
    return {
      isValid: false,
      message: "Outfit must include at least one pair of shoes.",
    };
  }

  if (dresses.length > 0) {
    if (dresses.length !== 1) {
      return { isValid: false, message: "Outfit can only contain one dress." };
    }
    if (tops.length > 0 || bottoms.length > 0) {
      return {
        isValid: false,
        message:
          "Dress outfits can't include separate tops or bottoms. Remove either the dress, or the extra pieces.",
      };
    }
    return { isValid: true };
  }

  if (tops.length !== 1) {
    return {
      isValid: false,
      message: "Outfit must contain exactly one top (e.g., a shirt).",
    };
  }

  if (bottoms.length !== 1) {
    return {
      isValid: false,
      message:
        "Outfit must contain exactly one bottom (pants, shorts, or skirt).",
    };
  }

  return { isValid: true };
}

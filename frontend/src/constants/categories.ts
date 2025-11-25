export const CATEGORY_OPTIONS = [
  { value: "shirt", label: "Shirt" },
  { value: "pants", label: "Pants" },
  { value: "outerwear", label: "Outerwear" },
  { value: "accessories", label: "Accessories" },
  { value: "shoes", label: "Shoes" },
  { value: "dresses", label: "Dresses" },
  { value: "skirts", label: "Skirt" },
  { value: "shorts", label: "Shorts" }
] as const;

export type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];

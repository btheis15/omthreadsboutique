import { crafts } from "@/lib/crafts";
import { categories, colors, materials } from "@/lib/site";

export const typeOptions = categories.map((c) => ({ title: c.singular, value: c.type }));
export const colorOptions = colors.map((c) => ({ title: c.label, value: c.value }));
export const craftOptions = crafts.map((c) => ({ title: `${c.label} (${c.region})`, value: c.value }));
export const materialOptions = materials.map((m) => ({ title: m.label, value: m.value }));

export const carePresets = {
  delicate:
    "Dry clean or hand wash gently in cold water with a wool or silk shampoo. Do not wring. Dry flat, away from direct sun.",
  washable: "Hand wash cold with a mild detergent. Dry flat in the shade and press on low heat.",
  dryClean: "Dry clean only. Store folded with a cedar block or lavender sachet.",
} as const;

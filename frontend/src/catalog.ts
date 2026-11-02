// Static BioRNA US catalog. Product names, patch counts, SKUs and packaging images
// were checked against the manufacturer shop (biorna.sg/shop, Nov 2026).
// The manufacturer lists prices in SGD only, so no USD prices exist yet.

// ---------------------------------------------------------------------------
// EDITABLE US RETAIL PRICING (USD). Leave null until a price is approved.
// A null price shows "Price coming soon" and disables Add to Cart.
// ---------------------------------------------------------------------------
export const US_PRICES: Record<ProductId, number | null> = {
  "antiscar-original": null,
  "biorna-c-starter": null,
  "biorna-c-standard": null,
  "biorna-c-baby-girl": null,
  "biorna-c-baby-boy": null,
};

// Online checkout stays off until a real payment provider and secure backend are set up.
export const CHECKOUT_ENABLED = false;

export type ProductId = "antiscar-original" | "biorna-c-starter" | "biorna-c-standard" | "biorna-c-baby-girl" | "biorna-c-baby-boy";
export type CategoryId = "antiscar" | "biorna-c" | "gift";

export type Product = {
  id: ProductId;
  name: string;
  line: string;
  category: CategoryId;
  patches: number;
  /** Manufacturer SKU; null when the manufacturer has not published one. */
  sku: string | null;
  image: number;
  tagline: string;
  description: string;
  packaging: string[];
  howToUse: string[];
  accent?: "girl" | "boy";
};

const ANTISCAR_USE = [
  "Apply only after the wound has fully closed.",
  "Clean the skin and let it dry completely.",
  "Apply the patch over the scar and press gently to secure.",
  "Wear overnight for approximately 8–12 hours.",
  "Replace with a new patch daily.",
  "Do not apply to open wounds.",
];

const BIORNA_C_USE = [
  "Use only on a fully closed, healed C-section incision.",
  "Clean the skin and let it dry completely.",
  "Apply the patch along the scar and press gently to secure.",
  "Follow the wear time and schedule printed on the BioRNA-C package insert.",
  "Do not apply to open wounds.",
];

const C_PACKAGING = ["Designed for Caesarean section scars", "Reduces scar appearance", "Works best on post-surgical scars", "Hydrates and protects", "Suitable for sensitive skin"];

export const PRODUCTS: Product[] = [
  {
    id: "antiscar-original",
    name: "BioRNA Antiscar",
    line: "Original Blue Box",
    category: "antiscar",
    patches: 7,
    sku: "RA1-1",
    image: require("../assets/images/products/antiscar-original.png"),
    tagline: "The original patch with dissolvable micro-tips.",
    description:
      "BioRNA Antiscar is a patch with dissolvable hyaluronic-acid micro-tips that uses RNA and hyaluronic acid technology. It is designed to help reduce the appearance of scars and works best after surgery or wounding. Hypoallergenic and dermatologically tested.",
    packaging: ["Reduces the appearance of scars", "Works best after surgery or wounding", "Hydrates and protects", "Hypoallergenic and dermatologically tested"],
    howToUse: ANTISCAR_USE,
  },
  {
    id: "biorna-c-starter",
    name: "BioRNA-C Starter Pack",
    line: "C-Section Scar Care",
    category: "biorna-c",
    patches: 2,
    sku: null,
    image: require("../assets/images/products/biorna-c-starter.png"),
    tagline: "A 2-patch introduction to BioRNA-C.",
    description:
      "BioRNA-C is designed for Caesarean section scars. It uses the same RNA and hyaluronic acid micro-tip technology to help reduce the appearance of post-surgical scars. The Starter Pack lets you try it before you commit to a larger pack.",
    packaging: C_PACKAGING,
    howToUse: BIORNA_C_USE,
  },
  {
    id: "biorna-c-standard",
    name: "BioRNA-C Standard Pack",
    line: "C-Section Scar Care",
    category: "biorna-c",
    patches: 8,
    sku: null,
    image: require("../assets/images/products/biorna-c-standard.png"),
    tagline: "8 patches for ongoing C-section scar care.",
    description:
      "BioRNA-C is designed for Caesarean section scars. Its RNA and hyaluronic acid micro-tip patch is made to hydrate, protect and help reduce the appearance of the scar. The Standard Pack is sized for ongoing use.",
    packaging: C_PACKAGING,
    howToUse: BIORNA_C_USE,
  },
  {
    id: "biorna-c-baby-girl",
    name: "BioRNA-C Baby Girl Gift Pack",
    line: "Baby Gift Collection",
    category: "gift",
    patches: 24,
    sku: null,
    image: require("../assets/images/products/biorna-c-baby-girl.png"),
    tagline: "24 patches in a gift box for a new mom.",
    description:
      "A 24-patch gift box of BioRNA-C, the micro-tip patch designed for Caesarean section scars. The Baby Girl packaging makes it a thoughtful postpartum gift.",
    packaging: C_PACKAGING,
    howToUse: BIORNA_C_USE,
    accent: "girl",
  },
  {
    id: "biorna-c-baby-boy",
    name: "BioRNA-C Baby Boy Gift Pack",
    line: "Baby Gift Collection",
    category: "gift",
    patches: 24,
    sku: null,
    image: require("../assets/images/products/biorna-c-baby-boy.png"),
    tagline: "24 patches in a gift box for a new mom.",
    description:
      "A 24-patch gift box of BioRNA-C, the micro-tip patch designed for Caesarean section scars. The Baby Boy packaging makes it a thoughtful postpartum gift.",
    packaging: C_PACKAGING,
    howToUse: BIORNA_C_USE,
    accent: "boy",
  },
];

export const CATEGORIES: { id: CategoryId; title: string; body: string; href: string }[] = [
  { id: "antiscar", title: "Original BioRNA Antiscar", body: "The original blue box, with 7 patches.", href: "/product/antiscar-original" },
  { id: "biorna-c", title: "BioRNA-C C-Section Scar Care", body: "Starter and Standard packs.", href: "/biorna-c" },
  { id: "gift", title: "BioRNA-C Baby Gift Collections", body: "24-patch gift boxes for new moms.", href: "/biorna-c" },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const priceOf = (id: ProductId) => US_PRICES[id] ?? null;
export const formatUSD = (n: number) => `$${n.toFixed(2)}`;
export const skuLabel = (p: Product) => p.sku ?? "SKU pending verification";

export const SAFETY = [
  "For external use on intact, closed skin only. Do not apply to open wounds, broken or infected skin.",
  "Stop using the patch and talk to a healthcare professional if you notice irritation, redness or an allergic reaction.",
  "Ask your doctor before use if you are pregnant, breastfeeding, or under medical care for your scar.",
  "Keep out of reach of children. Store in a cool, dry place.",
  "Results vary between people. This product is not intended to diagnose, treat, cure or prevent any disease.",
];

export const SHIPPING = [
  "Online checkout is not yet available in the US. Orders cannot be placed or paid for on this site.",
  "Shipping rates, delivery times and the US returns policy will be published here before checkout opens.",
];

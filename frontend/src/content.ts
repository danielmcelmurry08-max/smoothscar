export type PlanId = "one_time" | "subscribe" | "clinic";

export const PRICING = {
  one_time: { unit: 300, label: "One-time purchase", note: "Single box · ships in 1–2 days" },
  subscribe: { unit: 270, label: "Subscribe & Save 10%", note: "Delivered every 4 weeks · cancel anytime" },
  clinic: { unit: 185, label: "Provider partner price", note: "Per box · minimum 2 boxes" },
};

export const CLINIC_TIERS = [2, 5, 10];

export const formatSGD = (n: number) => `S$${n.toLocaleString("en-SG")}`;

export const IMAGES = {
  heroMother:
    "https://images.unsplash.com/photo-1570657891791-e39a9d185540?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80",
  productPatch:
    "https://images.unsplash.com/photo-1670201203150-bf8771401590?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  beforeScar:
    "https://images.unsplash.com/photo-1541752857837-f8a0154fd092?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
  afterSmooth:
    "https://images.unsplash.com/photo-1723540634462-528708cc17aa?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
};

export const AGITATION = [
  { id: "confidence", title: "Less confident with your scar?", body: "Avoiding swimwear, crop tops or intimacy because of how it looks." },
  { id: "itch", title: "Frustrated with an itchy, growing scar?", body: "Raised, tight and itchy — keloids and hypertrophic scars can keep spreading." },
  { id: "solution", title: "Desperate for an effective solution?", body: "Tried silicone gels, sheets or painful steroid injections without results." },
];

export const STATS = [
  { id: "volume", value: "95%", label: "Scar volume reduction after 60 days" },
  { id: "silicone", value: "88%", label: "Report better healing than silicone gel sheets" },
  { id: "prefer", value: "8/10", label: "Prefer BioRNA Antiscar over standard patches" },
];

export const CASES = [
  {
    id: "csection",
    tab: "C-section scar",
    caption: "Post-caesarean hypertrophic scar · 8 weeks of use",
    before: IMAGES.beforeScar,
    after: IMAGES.afterSmooth,
  },
  {
    id: "keloid",
    tab: "Knee keloid",
    caption: "Knee keloid · 60 days of use",
    before: IMAGES.beforeScar,
    after: IMAGES.afterSmooth,
  },
];

export const CITATION = "Annals of the Academy of Medicine, Singapore 2024;53:113-6";

export const TRUST = [
  { id: "lkc", name: "Lee Kong Chian", sub: "School of Medicine" },
  { id: "ntu", name: "NTU", sub: "Nanyang Technological University" },
  { id: "coolab", name: "CO11AB", sub: "Incubation Space" },
];

export const ACCORDIONS = [
  {
    id: "how-it-works",
    title: "How It Works",
    items: [
      "Each patch carries hundreds of dissolvable micro-tips that painlessly reach just beneath the skin surface.",
      "The micro-tips deliver a targeted RNA-based active that addresses the overactive fibroblast signalling behind raised scars — the root cause, not just the surface.",
      "Steroid-free: no skin thinning, no injections, no needles.",
    ],
  },
  {
    id: "how-to-use",
    title: "How to Use",
    items: [
      "1. Cleanse and fully dry the scar area.",
      "2. Press one patch firmly onto the scar for 10 seconds.",
      "3. Wear overnight (6–8 hours), then peel off and discard.",
      "4. Repeat as directed for the recommended 6–8 week regimen.",
    ],
  },
  {
    id: "faqs",
    title: "FAQs",
    items: [
      "Is it painful? No. The micro-tips are shorter than nerve endings, so most users feel only a light pressure.",
      "Which scars does it work on? C-section, keloid and hypertrophic scars — both new and established.",
      "Is it safe after pregnancy? It is steroid-free. If breastfeeding, consult your doctor before use.",
      "When will I see results? Many users notice softer, flatter scars within 4 weeks; clinical data measured 60 days.",
    ],
  },
];

export const CONTACT_EMAIL = "enquiry@BioRNA.sg";

export const DISCLAIMER =
  "BioRNA Antiscar is a cosmetic product and is not intended to diagnose, treat, cure or prevent any disease. Individual results may vary. Clinical statistics refer to study participants as published in the cited peer-reviewed journal. Before/after images are illustrative. Consult a healthcare professional if you have concerns about your scar.";

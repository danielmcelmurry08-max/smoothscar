export type PlanId = "one_time" | "subscribe" | "product";

// Live prices come from the server (editable in /admin); these are only shown until it responds.
export type Prices = { single: number; bundle: number; autoship: number };
export const DEFAULT_PRICES: Prices = { single: 300, bundle: 275, autoship: 275 };

export const PLAN_NOTES: Record<PlanId, string> = {
  one_time: "7 patches per box · ships in 1–2 days",
  subscribe: "Ships every 2 weeks · cancel anytime",
  product: "Ships in 1–2 days",
};

export const unitPriceFor = (p: Prices, plan: PlanId, qty: number) =>
  plan === "one_time" ? (qty >= 2 ? p.bundle : p.single) : p.autoship;

export const SUB_TIERS = [2, 4];

export const formatSGD = (n: number) => `$${n.toLocaleString("en-SG")}`;

export const IMAGES = {
  heroMother: {
    uri: "https://images.unsplash.com/photo-1570657891791-e39a9d185540?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80",
  },
  productBox: require("../assets/images/clinical/product-box.jpg"),
  awards: require("../assets/images/clinical/awards.jpg"),
  logoNtu: require("../assets/images/clinical/logo-ntu.jpg"),
  logoNsc: require("../assets/images/clinical/logo-nsc.jpg"),
  logoMadeSg: require("../assets/images/clinical/logo-made-sg.jpg"),
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

export const STUDY_NOTE = "*50 patients. Measurements made using a high-resolution 3D scanner.";

// Clinical case photos were removed: they come from a confidential clinician deck.
// Approved cases now live in src/clinicalResults.ts.

export const TESTIMONIALS = [
  { id: "amelia", name: "Amelia W.", scar: "Breast surgery scar", text: "A section of my scar popped up along the line. After a few uses, the uneven part flattened and is not so obvious anymore." },
  { id: "rajan", name: "Rajan P.", scar: "Knee keloid", text: "I had a keloid on my knee for years. Steroid jabs didn't last and were very painful. With BioRNA it feels less rigid and doesn't jut out as sharply when I bend my knee." },
  { id: "michelle", name: "Michelle L.", scar: "Chest keloid", text: "Silicone sheets never stayed on because I sweat easily. With BioRNA I only use it at night. After a while the keloid feels less bulky." },
  { id: "xinyu", name: "C. Xinyu", scar: "Thyroid surgery scar", text: "Silicone sheets would curl up every time. After giving BioRNA a go, the thick part slowly softened. It feels more even and less noticeable." },
  { id: "marcus", name: "Marcus L.", scar: "Keyhole surgery keloid", text: "I was hesitant about another injection, so I tried BioRNA first. After a few weeks the lump feels flatter when I run my thumb over it." },
];

export const CITATION = "Annals of the Academy of Medicine, Singapore 2024;53:113-6";

export const TRUST = [
  { id: "lkc", name: "Lee Kong Chian", sub: "School of Medicine" },
  { id: "coolab", name: "CO11AB", sub: "Incubation Space" },
  { id: "rnascence", name: "RNAscence", sub: "Biotechnology" },
];

export const TRUST_LOGOS = [
  { id: "ntu", label: "Nanyang Technological University", source: IMAGES.logoNtu },
  { id: "nsc", label: "National Skin Centre", source: IMAGES.logoNsc },
];

export const ACCORDIONS = [
  {
    id: "how-it-works",
    title: "How It Works",
    items: [
      "1. Apply patch — dissolvable micro-tips made of hyaluronic acid carry RNA nanoplexes.",
      "2. Micro-tips engage — they painlessly enter just beneath the skin surface.",
      "3. Ingredient transfer — the micro-tips dissolve and release the RNA nanoplex where the scar forms, targeting the root cause rather than just the surface.",
      "4. Reduced scar appearance — raised scars flatten, soften and blend toward your natural skin tone.",
      "Steroid-free and painless. Developed by RNAscence Biotechnology, a spin-off from NTU & National Skin Centre.",
    ],
  },
  {
    id: "how-to-use",
    title: "How to Use",
    items: [
      "Best before bed.",
      "1. Clean and dry the skin.",
      "2. Peel the patch and apply it on the scar.",
      "3. Press with gentle, constant pressure for 30 seconds to secure.",
      "4. Leave on for 8–12 hours.",
      "5. Replace daily until satisfied.",
      "For new wounds, start after wound closure or stitch removal. Do not use on open wounds.",
    ],
  },
  {
    id: "faqs",
    title: "FAQs",
    items: [
      "Is it painful? No. The micro-tips are shorter than nerve endings, so most users feel only a light pressure.",
      "Which scars does it work on? C-section, keloid and hypertrophic scars — both new and established.",
      "Is it safe after pregnancy? It is steroid-free. If breastfeeding, consult your doctor before use.",
      "When will I see results? Some users notice a softer, flatter scar within days to weeks; the clinical study measured 95% volume reduction at 60 days.",
      "Will the scar come back after I stop? 83% of study patients did not experience worsening or elevation of the scar after stopping usage (16.1 months follow-up).",
      "What's in a box? Each box contains 7 patches with dissolvable micro-tips (RNA & hyaluronic acid technology). Hypoallergenic and dermatologically tested.",
    ],
  },
];

export const CONTACT_EMAIL = "info@smoothscar.com";

// Replace each url with your brand's own profile page.
export const SOCIAL_LINKS = [
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/search/results/all/?keywords=BioRNA" },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/search/top?q=BioRNA" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/explore/search/keyword/?q=BioRNA" },
  { id: "x", label: "X (Twitter)", url: "https://x.com/search?q=BioRNA" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/results?search_query=BioRNA" },
] as const;

export const DISCLAIMER =
  "BioRNA Antiscar is a cosmetic product and is not intended to diagnose, treat, cure or prevent any disease. Individual results may vary. Clinical statistics refer to study participants as published in the cited peer-reviewed journal. Before/after photos are from real BioRNA users; results vary between individuals. Consult a healthcare professional if you have concerns about your scar.";

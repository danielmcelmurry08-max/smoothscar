// Provider inquiry forms, submitted to Netlify Forms. Field names must match public/__forms.html exactly.
export type Field = {
  name: string;
  label: string;
  required?: boolean;
  kind?: "text" | "email" | "tel" | "url" | "textarea" | "select" | "multi";
  options?: string[];
};
export type FormId = "provider-partner" | "sample-request" | "wholesale-inquiry";
export type FormDef = { id: FormId; slug: string; title: string; intro: string; submit: string; notice?: string; fields: Field[] };

export const PROVIDER_TYPES = [
  "Plastic surgeon",
  "Dermatologist",
  "OB/GYN",
  "Orthopedic surgeon",
  "Wound-care specialist",
  "Medical spa",
  "Aesthetic clinic",
  "Hospital",
  "Ambulatory surgery center",
  "Other",
];
const PRODUCTS = [
  "BioRNA Antiscar — Original 7-Patch Box",
  "BioRNA-C Starter Pack",
  "BioRNA-C Standard Pack",
  "BioRNA-C Baby Girl Gift Pack",
  "BioRNA-C Baby Boy Gift Pack",
];
const STATES =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" ");

export const FORMS: FormDef[] = [
  {
    id: "provider-partner",
    slug: "partner",
    title: "Become a Provider Partner",
    intro: "Tell us about your practice. Our team will reply about clinical resources, product availability and practice integration.",
    submit: "Submit Partnership Inquiry",
    fields: [
      { name: "full_name", label: "Full name", required: true },
      { name: "professional_title", label: "Professional title", required: true },
      { name: "practice_name", label: "Practice or facility name", required: true },
      { name: "email", label: "Email address", required: true, kind: "email" },
      { name: "phone", label: "Phone number", required: true, kind: "tel" },
      { name: "city", label: "City", required: true },
      { name: "state", label: "State", required: true, kind: "select", options: STATES },
      { name: "provider_type", label: "Provider type", required: true, kind: "select", options: PROVIDER_TYPES },
      {
        name: "primary_interest",
        label: "Primary interest",
        required: true,
        kind: "select",
        options: ["Offer BioRNA to patients", "Retail products within my practice", "Wholesale purchasing", "Clinical product evaluation", "Distribution partnership"],
      },
      { name: "website", label: "Practice website", kind: "url" },
      { name: "monthly_patient_volume", label: "Estimated monthly patient volume", kind: "select", options: ["Under 25", "25–100", "100–250", "250–500", "500+"] },
      { name: "comments", label: "Additional comments", kind: "textarea" },
    ],
  },
  {
    id: "sample-request",
    slug: "samples",
    title: "Request Product Samples",
    intro: "Request evaluation samples for your practice or facility.",
    notice: "All sample requests are reviewed before approval. Submitting a request does not guarantee free samples.",
    submit: "Request Samples",
    fields: [
      { name: "contact_name", label: "Contact name", required: true },
      { name: "practice_name", label: "Practice or facility name", required: true },
      { name: "email", label: "Professional email", required: true, kind: "email" },
      { name: "phone", label: "Phone", required: true, kind: "tel" },
      { name: "shipping_city", label: "Shipping city", required: true },
      { name: "shipping_state", label: "Shipping state", required: true, kind: "select", options: STATES },
      { name: "provider_type", label: "Provider type", required: true, kind: "select", options: PROVIDER_TYPES },
      { name: "product_interest", label: "Product interest", required: true, kind: "multi", options: PRODUCTS },
      { name: "monthly_usage", label: "Estimated monthly usage", kind: "select", options: ["Under 10 boxes", "10–50 boxes", "50–100 boxes", "100+ boxes"] },
      { name: "evaluation_setting", label: "Intended evaluation setting", kind: "select", options: ["Private practice", "Hospital / surgical center", "Medical spa / aesthetic clinic", "Other"] },
      { name: "comments", label: "Comments", kind: "textarea" },
    ],
  },
  {
    id: "wholesale-inquiry",
    slug: "wholesale",
    title: "Wholesale & Distribution Inquiry",
    intro: "Ask about wholesale purchasing or distribution. We share pricing directly with qualified businesses.",
    submit: "Request Wholesale Information",
    fields: [
      { name: "contact_name", label: "Contact name", required: true },
      { name: "company", label: "Company or practice", required: true },
      { name: "email", label: "Business email", required: true, kind: "email" },
      { name: "phone", label: "Phone", required: true, kind: "tel" },
      { name: "state", label: "State", required: true, kind: "select", options: STATES },
      {
        name: "business_type",
        label: "Business type",
        required: true,
        kind: "select",
        options: ["Medical practice", "Hospital / health system", "Ambulatory surgery center", "Medical spa / aesthetic clinic", "Pharmacy / retailer", "Distributor", "Other"],
      },
      { name: "products_of_interest", label: "Products of interest", required: true, kind: "multi", options: PRODUCTS },
      { name: "order_volume", label: "Estimated order volume (boxes per month)", required: true, kind: "select", options: ["Under 50", "50–250", "250–1,000", "1,000+"] },
      { name: "website", label: "Website", kind: "url" },
      { name: "locations", label: "Number of locations", kind: "select", options: ["1", "2–5", "6–20", "20+"] },
      { name: "comments", label: "Comments", kind: "textarea" },
    ],
  },
];

export const formBySlug = (slug: string) => FORMS.find((f) => f.slug === slug);

// Linked from the manufacturer (biorna.sg/brochure). Not copied locally: redistribution permission is not yet confirmed.
export const BROCHURES = [
  {
    id: "antiscar",
    title: "BioRNA Antiscar Brochure",
    subtitle: "Original 7-Patch Blue Box",
    description: "The manufacturer's brochure for BioRNA Antiscar, covering the micro-tip patch technology, the product and how to use it.",
    viewUrl: "https://www.biorna.sg/_files/ugd/c38d70_f9bbfb195e7145c388ceec0aa21b6703.pdf",
    viewLabel: "View PDF",
    downloadUrl: "https://www.biorna.sg/_files/ugd/c38d70_f9bbfb195e7145c388ceec0aa21b6703.pdf?dn=BioRNA-Antiscar-Brochure.pdf",
    downloadLabel: "Download PDF",
    image: require("../assets/images/products/antiscar-original.png"),
  },
  {
    id: "biorna-c",
    title: "BioRNA-C Brochure",
    subtitle: "C-Section Scar Care",
    description: "The manufacturer publishes the BioRNA-C brochure only as a ZIP download on its official brochure page, not as a direct PDF.",
    viewUrl: "https://www.biorna.sg/brochure",
    viewLabel: "Official brochure page",
    downloadUrl: "https://www.biorna.sg/_files/archives/c38d70_bda163c5e3044dd0b54958b8e99c3ca7.zip?dn=BioRNA-C-Brochure.zip",
    downloadLabel: "Download ZIP (official)",
    image: require("../assets/images/products/biorna-c-standard.png"),
  },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function validate(def: FormDef, values: Record<string, string>, consent: boolean) {
  const errors: Record<string, string> = {};
  for (const f of def.fields) {
    const v = (values[f.name] ?? "").trim();
    if (f.required && !v) errors[f.name] = "Required";
    else if (v && f.kind === "email" && !EMAIL.test(v)) errors[f.name] = "Enter a valid email";
    else if (v && f.kind === "tel" && v.replace(/\D/g, "").length < 10) errors[f.name] = "Enter a valid phone number";
    else if (v && f.kind === "select" && f.options && !f.options.includes(v.toUpperCase()) && !f.options.includes(v)) errors[f.name] = "Choose a valid option";
    else if (v.length > 2000) errors[f.name] = "Too long";
  }
  if (!consent) errors.consent = "Please confirm consent to continue";
  return errors;
}

const COOLDOWN_MS = 60_000;
let lastSubmit = 0;

/** POSTs a URL-encoded submission to Netlify Forms. Throws on failure. */
export async function submitForm(def: FormDef, values: Record<string, string>) {
  if (Date.now() - lastSubmit < COOLDOWN_MS) throw new Error("Please wait a minute before sending another inquiry.");
  const body = new URLSearchParams({ "form-name": def.id, "bot-field": values["bot-field"] ?? "", consent: "yes" });
  for (const f of def.fields) body.set(f.name, (values[f.name] ?? "").trim());
  const res = await fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!res.ok) throw new Error(`Submission failed (${res.status}).`);
  lastSubmit = Date.now();
}

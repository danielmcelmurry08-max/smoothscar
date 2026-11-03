// Clinical before/after cases from the BioRNA Clinician Deck (AXONVIS), which is marked CONFIDENTIAL.
//
// PHOTOS ARE NOT PUBLISHED. To publish a case, ALL of the following must be true:
//   1. Written permission from the rights holder (RNAscence Biotechnology) for public marketing use.
//   2. Documented consent from the patient for public marketing use.
//   3. Compliance review of the caption for US advertising.
// Then: extract the original before/after photos for that case from the listed PDF page, unedited
// (no retouching, color changes, stretching or cropping out of the treated area), save them to
// assets/images/clinical-results/, set `before` / `after` with require(...), and set `approved: true`.
// This repository is public on GitHub, so do not commit the photos before approval.

export type ResultCategory = "C-Section Scars" | "Hypertrophic Scars" | "Keloid Scars" | "Post-Surgical Scars";
export type ClinicalCase = {
  id: string;
  category: ResultCategory;
  title: string;
  interval: string;
  description: string;
  source: string;
  approved: boolean;
  before: number | null;
  after: number | null;
  /** width / height of the original photos, so they are never stretched */
  aspect: number;
};

const DECK = "BioRNA Clinician Deck (RNAscence Biotechnology)";

// Display order: page 17 C-section first, then page 8 elbow, then page 11 wrist keloid.
export const CLINICAL_CASES: ClinicalCase[] = [
  { id: "csection-6wk", category: "C-Section Scars", title: "C-section scar", interval: "Day 0 vs. after 6 weeks", description: "A C-section scar photographed before BioRNA use and after 6 weeks of use.", source: `${DECK}, p. 17`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "elbow-hypertrophic", category: "Hypertrophic Scars", title: "Hypertrophic elbow scar", interval: "Day 0 vs. Day 22", description: "A hypertrophic scar on the elbow photographed on Day 0 and Day 22 of BioRNA use.", source: `${DECK}, p. 8`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "wrist-keloid", category: "Keloid Scars", title: "Wrist keloid scar", interval: "Day 0 vs. Day 7", description: "A keloid scar on the wrist photographed on Day 0 and Day 7 of BioRNA use.", source: `${DECK}, p. 11`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "csection-28d", category: "C-Section Scars", title: "C-section scar", interval: "Day 0 vs. Day 28", description: "A C-section scar photographed on Day 0 and Day 28 of BioRNA use.", source: `${DECK}, p. 16`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "facial-hypertrophic", category: "Hypertrophic Scars", title: "Hypertrophic facial scar", interval: "Day 0 vs. Day 16", description: "A hypertrophic scar on the face photographed on Day 0 and Day 16 of BioRNA use.", source: `${DECK}, p. 9`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "knee-keloid", category: "Keloid Scars", title: "Knee-area keloid scar", interval: "Day 0 vs. Day 21", description: "A keloid scar near the knee photographed on Day 0 and Day 21 of BioRNA use.", source: `${DECK}, p. 12`, approved: false, before: null, after: null, aspect: 4 / 3 },
  { id: "shoulder-postsurgical", category: "Post-Surgical Scars", title: "Post-surgical shoulder scar", interval: "Day 0 vs. Day 6", description: "A post-surgical scar on the shoulder photographed on Day 0 and Day 6 of BioRNA use.", source: `${DECK}, p. 10`, approved: false, before: null, after: null, aspect: 4 / 3 },
];

export const RESULT_CATEGORIES: ResultCategory[] = ["C-Section Scars", "Hypertrophic Scars", "Keloid Scars", "Post-Surgical Scars"];
export const RESULTS_DISCLAIMER = "Individual results vary. Images show individual cases and do not guarantee similar outcomes.";

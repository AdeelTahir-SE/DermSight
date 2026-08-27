/**
 * HAM10000 labels. Output index order MUST match training LABEL_MAP
 * in the H-CBM notebook: nv=0, mel=1, bkl=2, bcc=3, akiec=4, vasc=5, df=6.
 */

import type { DiagnosisClass } from "@/types";

export const MODEL_VERSION = "h-cbm-full-1.0";

export const MODEL_OUTPUT_LABELS: DiagnosisClass[] = [
  "nv",
  "mel",
  "bkl",
  "bcc",
  "akiec",
  "vasc",
  "df",
];

/** @deprecated Use MODEL_OUTPUT_LABELS — kept as alias for older imports. */
export const MODEL_LABELS = MODEL_OUTPUT_LABELS;

export const MODEL_DISPLAY_NAMES: Record<DiagnosisClass, string> = {
  mel: "Melanoma",
  bcc: "Basal Cell Carcinoma",
  akiec: "Actinic Keratosis",
  bkl: "Benign Keratosis",
  df: "Dermatofibroma",
  vasc: "Vascular Lesion",
  nv: "Melanocytic Nevus",
};

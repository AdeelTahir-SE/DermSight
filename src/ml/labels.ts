/**
 * ML model labels — HAM10000 taxonomy.
 */

import type { DiagnosisClass } from "@/types";

export const MODEL_LABELS: DiagnosisClass[] = [
  "mel",
  "bcc",
  "akiec",
  "bkl",
  "df",
  "vasc",
  "nv",
];

export const MODEL_DISPLAY_NAMES: Record<DiagnosisClass, string> = {
  mel: "Melanoma",
  bcc: "Basal Cell Carcinoma",
  akiec: "Actinic Keratosis",
  bkl: "Benign Keratosis",
  df: "Dermatofibroma",
  vasc: "Vascular Lesion",
  nv: "Melanocytic Nevus",
};

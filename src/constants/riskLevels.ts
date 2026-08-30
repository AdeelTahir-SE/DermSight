/**
 * Risk level mapping from HAM10000 model classes to app-level triage tiers.
 * Kept separate from model inference so clinical advisors can adjust without touching ML code.
 */

export type RiskTier = "low" | "medium" | "high" | "urgent_referral";

export type DiagnosisClass =
  "mel" | "bcc" | "akiec" | "bkl" | "df" | "vasc" | "nv";

export interface RiskTierInfo {
  tier: RiskTier;
  label: string;
  color: string;
  bgColor: string;
  textColorClass: string;
  bgColorClass: string;
  action: string;
}

export const RISK_TIER_CONFIG: Record<RiskTier, RiskTierInfo> = {
  urgent_referral: {
    tier: "urgent_referral",
    label: "Urgent Referral",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    textColorClass: "text-red-650 dark:text-red-400",
    bgColorClass: "bg-red-50 dark:bg-red-950/30 border border-red-100/50 dark:border-red-900/30",
    action:
      "Refer to clinic/specialist immediately. Flag record for priority review.",
  },
  high: {
    tier: "high",
    label: "High Risk",
    color: "#EA580C",
    bgColor: "#FFEDD5",
    textColorClass: "text-orange-600 dark:text-orange-400",
    bgColorClass: "bg-orange-50 dark:bg-orange-950/30 border border-orange-100/50 dark:border-orange-900/30",
    action: "Refer within days. Schedule follow-up and monitor closely.",
  },
  medium: {
    tier: "medium",
    label: "Medium Risk",
    color: "#D97706",
    bgColor: "#FEF3C7",
    textColorClass: "text-amber-600 dark:text-amber-400",
    bgColorClass: "bg-amber-50 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/30",
    action: "Advise monitoring. Re-screen at next follow-up visit.",
  },
  low: {
    tier: "low",
    label: "Low Risk",
    color: "#16A34A",
    bgColor: "#DCFCE7",
    textColorClass: "text-green-600 dark:text-green-400",
    bgColorClass: "bg-green-50 dark:bg-green-950/30 border border-green-100/50 dark:border-green-900/30",
    action: "Routine care. No immediate action required.",
  },
};

/**
 * Maps each HAM10000 diagnostic class to an app-level risk tier.
 */
export const CLASS_TO_RISK_TIER: Record<DiagnosisClass, RiskTier> = {
  mel: "urgent_referral",
  bcc: "high",
  akiec: "high",
  bkl: "medium",
  df: "medium",
  nv: "low",
  vasc: "low",
};

/**
 * Display names for each HAM10000 diagnostic class.
 */
export const DIAGNOSIS_LABELS: Record<
  DiagnosisClass,
  { name: string; shortName: string; malignant: boolean }
> = {
  mel: { name: "Melanoma", shortName: "MEL", malignant: true },
  bcc: { name: "Basal Cell Carcinoma", shortName: "BCC", malignant: true },
  akiec: {
    name: "Actinic Keratosis / Intraepithelial Carcinoma",
    shortName: "AKIEC",
    malignant: true,
  },
  bkl: { name: "Benign Keratosis", shortName: "BKL", malignant: false },
  df: { name: "Dermatofibroma", shortName: "DF", malignant: false },
  vasc: { name: "Vascular Lesion", shortName: "VASC", malignant: false },
  nv: {
    name: "Melanocytic Nevus (Common Mole)",
    shortName: "NV",
    malignant: false,
  },
};

/**
 * ABCD concept score labels for the explainability panel.
 */
export const ABCD_LABELS = [
  {
    key: "asymmetry",
    label: "Asymmetry",
    description: "Shape irregularity of the lesion",
  },
  {
    key: "border",
    label: "Border",
    description: "Border irregularity and definition",
  },
  {
    key: "color",
    label: "Color",
    description: "Color variation within the lesion",
  },
  {
    key: "diameter",
    label: "Diameter",
    description: "Size assessment of the lesion",
  },
] as const;

export function getRiskTierForClass(diagnosisClass: DiagnosisClass): RiskTier {
  return CLASS_TO_RISK_TIER[diagnosisClass];
}

export function getRiskTierInfo(tier: RiskTier): RiskTierInfo {
  return RISK_TIER_CONFIG[tier];
}

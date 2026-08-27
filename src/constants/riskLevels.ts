/**
 * Risk level mapping from HAM10000 model classes to app-level triage tiers.
 * Kept separate from model inference so clinical advisors can adjust without touching ML code.
 */

export type RiskTier = 'low' | 'medium' | 'high' | 'urgent_referral';

export type DiagnosisClass = 'mel' | 'bcc' | 'akiec' | 'bkl' | 'df' | 'vasc' | 'nv';

export interface RiskTierInfo {
  tier: RiskTier;
  label: string;
  color: string;
  bgColor: string;
  action: string;
}

export const RISK_TIER_CONFIG: Record<RiskTier, RiskTierInfo> = {
  urgent_referral: {
    tier: 'urgent_referral',
    label: 'Urgent Referral',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    action: 'Refer to clinic/specialist immediately. Flag record for priority review.',
  },
  high: {
    tier: 'high',
    label: 'High Risk',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    action: 'Refer within days. Schedule follow-up and monitor closely.',
  },
  medium: {
    tier: 'medium',
    label: 'Medium Risk',
    color: '#D97706',
    bgColor: '#FEF3C7',
    action: 'Advise monitoring. Re-screen at next follow-up visit.',
  },
  low: {
    tier: 'low',
    label: 'Low Risk',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    action: 'Routine care. No immediate action required.',
  },
};

/**
 * Maps each HAM10000 diagnostic class to an app-level risk tier.
 */
export const CLASS_TO_RISK_TIER: Record<DiagnosisClass, RiskTier> = {
  mel: 'urgent_referral',
  bcc: 'high',
  akiec: 'high',
  bkl: 'medium',
  df: 'medium',
  nv: 'low',
  vasc: 'low',
};

/**
 * Display names for each HAM10000 diagnostic class.
 */
export const DIAGNOSIS_LABELS: Record<DiagnosisClass, { name: string; shortName: string; malignant: boolean }> = {
  mel: { name: 'Melanoma', shortName: 'MEL', malignant: true },
  bcc: { name: 'Basal Cell Carcinoma', shortName: 'BCC', malignant: true },
  akiec: { name: 'Actinic Keratosis / Intraepithelial Carcinoma', shortName: 'AKIEC', malignant: true },
  bkl: { name: 'Benign Keratosis', shortName: 'BKL', malignant: false },
  df: { name: 'Dermatofibroma', shortName: 'DF', malignant: false },
  vasc: { name: 'Vascular Lesion', shortName: 'VASC', malignant: false },
  nv: { name: 'Melanocytic Nevus (Common Mole)', shortName: 'NV', malignant: false },
};

/**
 * ABCD concept score labels for the explainability panel.
 */
export const ABCD_LABELS = [
  { key: 'asymmetry', label: 'Asymmetry', description: 'Shape irregularity of the lesion' },
  { key: 'border', label: 'Border', description: 'Border irregularity and definition' },
  { key: 'color', label: 'Color', description: 'Color variation within the lesion' },
  { key: 'diameter', label: 'Diameter', description: 'Size assessment of the lesion' },
] as const;

export function getRiskTierForClass(diagnosisClass: DiagnosisClass): RiskTier {
  return CLASS_TO_RISK_TIER[diagnosisClass];
}

export function getRiskTierInfo(tier: RiskTier): RiskTierInfo {
  return RISK_TIER_CONFIG[tier];
}

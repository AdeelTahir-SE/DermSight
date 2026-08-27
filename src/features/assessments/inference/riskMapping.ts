/**
 * Risk mapping utility — maps model output to app risk tiers.
 */

import { getRiskTierForClass, getRiskTierInfo } from "@/constants/riskLevels";
import type { DiagnosisClass, RiskTier } from "@/types";

export function mapClassToRiskTier(diagnosisClass: DiagnosisClass): RiskTier {
  return getRiskTierForClass(diagnosisClass);
}

export function getRiskTierDisplayInfo(tier: RiskTier) {
  return getRiskTierInfo(tier);
}

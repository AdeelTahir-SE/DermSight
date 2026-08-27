/**
 * Mock inference module — returns realistic-looking results.
 * Replace with real TFLite inference when model is available.
 */

import { getRiskTierForClass } from "@/constants/riskLevels";
import { MODEL_LABELS } from "@/ml/labels";
import type { DiagnosisClass, InferenceResult } from "@/types";

/**
 * Run mock inference on an image.
 * In production, this loads the TFLite model and runs real inference.
 */
export async function runInference(
  _imageUri: string,
): Promise<InferenceResult> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate realistic-looking mock probabilities
  const rawProbs = MODEL_LABELS.map(() => Math.random());
  const sum = rawProbs.reduce((a, b) => a + b, 0);
  const normalized = rawProbs.map((p) => p / sum);

  // Find the predicted class (highest probability)
  const maxIdx = normalized.indexOf(Math.max(...normalized));
  const predictedClass = MODEL_LABELS[maxIdx];
  const confidenceScore = normalized[maxIdx];

  // Build class probabilities record
  const classProbabilities = {} as Record<DiagnosisClass, number>;
  MODEL_LABELS.forEach((label, idx) => {
    classProbabilities[label] = Math.round(normalized[idx] * 1000) / 1000;
  });

  // Generate mock ABCD scores (0-1)
  const abcdScores = {
    asymmetry: Math.round(Math.random() * 100) / 100,
    border: Math.round(Math.random() * 100) / 100,
    color: Math.round(Math.random() * 100) / 100,
    diameter: Math.round(Math.random() * 100) / 100,
  };

  const riskTier = getRiskTierForClass(predictedClass);

  return {
    classProbabilities,
    predictedClass,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    abcdScores,
    riskTier,
  };
}

/**
 * Check if ML model is available on device.
 */
export async function isModelAvailable(): Promise<boolean> {
  // Mock: always available. In production, check for .tflite file.
  return true;
}

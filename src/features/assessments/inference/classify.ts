/**
 * Runs the trained H-CBM (EfficientNet-B0 + ABCD head).
 *
 * On-device TFLite is not in this Expo Go build. The captured image is sent
 * to the local Python server (`python scripts/ml/serve.py`) which loads
 * ml/weights/best_cbm_full.pth.
 */

import { getRiskTierForClass } from "@/constants/riskLevels";
import { getInferenceBaseUrl } from "@/ml/inferenceUrl";
import { MODEL_OUTPUT_LABELS, MODEL_VERSION } from "@/ml/labels";
import type { DiagnosisClass, InferenceResult } from "@/types";
import { File } from "expo-file-system";
export { MODEL_VERSION };

export class InferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InferenceError";
  }
}

interface ServerInferenceResponse {
  predictedClass: DiagnosisClass;
  confidenceScore: number;
  classProbabilities: Record<DiagnosisClass, number>;
  abcdScores: InferenceResult["abcdScores"];
  modelVersion?: string;
  error?: string;
}

function emptyProbabilities(): Record<DiagnosisClass, number> {
  return Object.fromEntries(
    MODEL_OUTPUT_LABELS.map((label) => [label, 0]),
  ) as Record<DiagnosisClass, number>;
}

function toInferenceResult(data: ServerInferenceResponse): InferenceResult {
  const classProbabilities = {
    ...emptyProbabilities(),
    ...data.classProbabilities,
  };
  const predictedClass = data.predictedClass;
  const riskTier = getRiskTierForClass(predictedClass);
  return {
    classProbabilities,
    predictedClass,
    confidenceScore: data.confidenceScore,
    abcdScores: data.abcdScores,
    riskTier,
  };
}

async function imageUriToBase64(imageUri: string): Promise<string> {
  const file = new File(imageUri);
  if (!file.exists) {
    throw new InferenceError(`Captured image file was not found on device (URI: ${imageUri}).`);
  }
  return file.base64();
}

/**
 * Classify a lesion image with the trained H-CBM.
 */
export async function runInference(imageUri: string): Promise<InferenceResult> {
  if (!imageUri) {
    throw new InferenceError("No image to analyze.");
  }

  const baseUrl = getInferenceBaseUrl();
  const imageBase64 = await imageUriToBase64(imageUri);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/infer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
    });
  } catch {
    throw new InferenceError(
      `Cannot reach the H-CBM server at ${baseUrl}. Start it with: python scripts/ml/serve.py`,
    );
  }

  const data = (await response.json()) as ServerInferenceResponse;
  if (!response.ok || data.error) {
    throw new InferenceError(data.error ?? `Inference failed (${response.status})`);
  }
  if (!data.predictedClass || !data.classProbabilities || !data.abcdScores) {
    throw new InferenceError("Model server returned an incomplete result.");
  }

  return toInferenceResult(data);
}

export async function isModelAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${getInferenceBaseUrl()}/health`);
    if (!response.ok) return false;
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

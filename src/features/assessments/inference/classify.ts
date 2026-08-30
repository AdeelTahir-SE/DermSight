/**
 * Real on-device inference using the converted TFLite model.
 * Falls back to mock predictions on web or if the model fails to load.
 */

import { getRiskTierForClass } from "@/constants/riskLevels";
import { MODEL_LABELS } from "@/ml/labels";
import type { DiagnosisClass, InferenceResult } from "@/types";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { Platform } from "react-native";
import {
  loadTensorflowModel,
  type TensorflowModel,
} from "react-native-fast-tflite";

// The converted EfficientNet-B0 model (PyTorch -> ONNX -> TFLite).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_PATH = require("../../../../assets/models/model.tflite");

const INPUT_SIZE = 224;
const INPUT_CHANNELS = 3;

// ImageNet normalization — the model expects RGB pixels in [0, 1].
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let modelPromise: Promise<TensorflowModel | null> | null = null;

async function getModel(): Promise<TensorflowModel | null> {
  if (Platform.OS === "web") return null;

  if (!modelPromise) {
    modelPromise = loadTensorflowModel(MODEL_PATH, [])
      .then((model) => {
        console.log("[TFLite] Model loaded successfully");
        return model;
      })
      .catch((error) => {
        console.error("[TFLite] Failed to load model:", error);
        modelPromise = null;
        return null;
      });
  }

  return modelPromise;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function softmax(logits: Float32Array): Float32Array {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - maxLogit));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => value / sum);
}

async function preprocessImage(imageUri: string): Promise<Float32Array> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    {
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error("Image manipulator did not return base64 data");
  }

  const jpegBytes = base64ToUint8Array(manipulated.base64);
  const decoded = jpeg.decode(jpegBytes, { useTArray: true });

  if (decoded.width !== INPUT_SIZE || decoded.height !== INPUT_SIZE) {
    throw new Error(
      `Unexpected decoded image size: ${decoded.width}x${decoded.height}`,
    );
  }

  const rgba = decoded.data as Uint8Array;
  const floatData = new Float32Array(INPUT_SIZE * INPUT_SIZE * INPUT_CHANNELS);
  let index = 0;

  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i] / 255;
    const g = rgba[i + 1] / 255;
    const b = rgba[i + 2] / 255;

    floatData[index++] = (r - MEAN[0]) / STD[0];
    floatData[index++] = (g - MEAN[1]) / STD[1];
    floatData[index++] = (b - MEAN[2]) / STD[2];
  }

  return floatData;
}

async function runMockInference(_imageUri: string): Promise<InferenceResult> {
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
 * Run real inference on an image using the converted TFLite model.
 * Falls back to mock predictions on web or if the model cannot be loaded.
 */
export async function runInference(imageUri: string): Promise<InferenceResult> {
  const model = await getModel();
  if (!model) {
    console.warn("[TFLite] Running mock inference (model unavailable)");
    return runMockInference(imageUri);
  }

  const inputTensor = await preprocessImage(imageUri);
  const inputBuffer = inputTensor.buffer.slice(
    inputTensor.byteOffset,
    inputTensor.byteOffset + inputTensor.byteLength,
  ) as ArrayBuffer;

  const outputs = await model.run([inputBuffer]);
  if (!outputs || outputs.length < 2) {
    throw new Error("TFLite model returned unexpected outputs");
  }

  const classLogits = new Float32Array(outputs[0]);
  const classProbabilitiesArray = softmax(classLogits);

  const maxIdx = classProbabilitiesArray.indexOf(
    Math.max(...classProbabilitiesArray),
  );
  const predictedClass = MODEL_LABELS[maxIdx];
  const confidenceScore = classProbabilitiesArray[maxIdx];

  const classProbabilities = {} as Record<DiagnosisClass, number>;
  MODEL_LABELS.forEach((label, idx) => {
    classProbabilities[label] =
      Math.round(classProbabilitiesArray[idx] * 1000) / 1000;
  });

  const abcdRaw = new Float32Array(outputs[1]);
  const abcdScores = {
    asymmetry: Math.round(sigmoid(abcdRaw[0]) * 100) / 100,
    border: Math.round(sigmoid(abcdRaw[1]) * 100) / 100,
    color: Math.round(sigmoid(abcdRaw[2]) * 100) / 100,
    diameter: Math.round(sigmoid(abcdRaw[3]) * 100) / 100,
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
  if (Platform.OS === "web") return false;
  const model = await getModel();
  return model !== null;
}

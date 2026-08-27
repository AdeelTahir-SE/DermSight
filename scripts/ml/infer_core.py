"""Shared preprocessing + inference used by the HTTP server and CLI."""

from __future__ import annotations

import io
from typing import Any

import torch
from PIL import Image
from torchvision import transforms

from model import IMAGENET_MEAN, IMAGENET_STD, INPUT_SIZE, OUTPUT_LABELS, SkinLesionCBM

VAL_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ]
)

RISK_TIER = {
    "mel": "urgent_referral",
    "bcc": "high",
    "akiec": "high",
    "bkl": "medium",
    "df": "medium",
    "nv": "low",
    "vasc": "low",
}


def image_from_bytes(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")


@torch.inference_mode()
def run_model(model: SkinLesionCBM, image: Image.Image) -> dict[str, Any]:
    tensor = VAL_TRANSFORM(image).unsqueeze(0)
    concepts, _, _, logits_final = model(tensor)
    probs = torch.softmax(logits_final, dim=1).squeeze(0)
    concept_scores = concepts.squeeze(0).tolist()
    prob_list = [round(float(p), 4) for p in probs.tolist()]
    max_idx = int(probs.argmax().item())
    predicted = OUTPUT_LABELS[max_idx]
    class_probabilities = {
        label: prob_list[i] for i, label in enumerate(OUTPUT_LABELS)
    }
    return {
        "classProbabilities": class_probabilities,
        "predictedClass": predicted,
        "confidenceScore": round(prob_list[max_idx], 4),
        "abcdScores": {
            "asymmetry": round(float(concept_scores[0]), 4),
            "border": round(float(concept_scores[1]), 4),
            "color": round(float(concept_scores[2]), 4),
            "diameter": round(float(concept_scores[3]), 4),
        },
        "riskTier": RISK_TIER[predicted],
        "modelVersion": "h-cbm-full-1.0",
    }

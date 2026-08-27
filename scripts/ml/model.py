"""Hybrid CBM (SkinLesionCBM) matching the HAM10000 training notebook."""

from __future__ import annotations

from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models

# Must match training LABEL_MAP in final_pipeline.ipynb
LABEL_MAP = {"nv": 0, "mel": 1, "bkl": 2, "bcc": 3, "akiec": 4, "vasc": 5, "df": 6}
INDEX_TO_LABEL = {v: k for k, v in LABEL_MAP.items()}

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = REPO_ROOT / "ml" / "weights" / "best_cbm_full.pth"

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
INPUT_SIZE = 224


class SkinLesionCBM(nn.Module):
    """
    Hybrid CBM: encoder feeds BOTH the ABCD bottleneck AND
    a direct classification head. Final logits blend both paths.
    """

    def __init__(self, num_classes: int = 7, blend: float = 0.5):
        super().__init__()
        self.blend = blend

        backbone = models.efficientnet_b0(weights=None)
        in_features = backbone.classifier[1].in_features
        backbone.classifier = nn.Identity()
        self.encoder = backbone

        self.abcd_head = nn.Sequential(
            nn.Linear(in_features, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Linear(32, 4),
            nn.Sigmoid(),
        )
        self.abcd_classifier = nn.Linear(4, num_classes)
        self.direct_classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor):
        features = self.encoder(x)
        concepts = self.abcd_head(features)
        logits_abcd = self.abcd_classifier(concepts)
        logits_direct = self.direct_classifier(features)
        logits_final = self.blend * logits_abcd + (1 - self.blend) * logits_direct
        return concepts, logits_abcd, logits_direct, logits_final


def load_model(weights_path: Path | None = None, device: torch.device | None = None) -> SkinLesionCBM:
    device = device or torch.device("cpu")
    path = weights_path or DEFAULT_WEIGHTS
    if not path.exists():
        raise FileNotFoundError(f"Model weights not found at {path}")

    model = SkinLesionCBM()
    state = torch.load(path, map_location=device, weights_only=True)
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    return model

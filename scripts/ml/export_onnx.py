"""Export the H-CBM to ONNX for a later on-device TFLite conversion."""

from __future__ import annotations

import sys
from pathlib import Path

import torch
import torch.nn as nn

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "ml"))

from model import INPUT_SIZE, load_model  # noqa: E402

OUT_PATH = ROOT / "ml" / "assets" / "dermsight_hcbm.onnx"


class InferenceWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x: torch.Tensor):
        concepts, _, _, logits_final = self.model(x)
        probs = torch.softmax(logits_final, dim=1)
        return concepts, probs


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    model = load_model()
    wrapped = InferenceWrapper(model).eval()
    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE)
    torch.onnx.export(
        wrapped,
        dummy,
        str(OUT_PATH),
        input_names=["image"],
        output_names=["abcd_scores", "class_probs"],
        opset_version=17,
        dynamo=False,
    )
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()

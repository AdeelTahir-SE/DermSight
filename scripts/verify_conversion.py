import os
import sys

import numpy as np
import onnx
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
from ai_edge_litert import interpreter as litert

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PTH_PATH = os.path.join(BASE_DIR, 'assets', 'models', 'best_cbm_full.pth')
TFLITE_PATH = os.path.join(BASE_DIR, 'assets', 'models', 'model.tflite')


class _EfficientNetEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        efficientnet = torchvision.models.efficientnet_b0(weights=None)
        self.features = efficientnet.features

    def forward(self, x: torch.Tensor):
        return self.features(x)


class DermSightModel(nn.Module):
    def __init__(self, num_classes: int = 7):
        super().__init__()
        self.encoder = _EfficientNetEncoder()
        self.direct_classifier = nn.Sequential(
            nn.Linear(1280, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )
        self.abcd_head = nn.Sequential(
            nn.Linear(1280, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Linear(32, 4),
        )
        self.abcd_classifier = nn.Linear(4, num_classes)

    def forward(self, x: torch.Tensor):
        features = self.encoder(x)
        pooled = F.adaptive_avg_pool2d(features, (1, 1)).flatten(1)
        class_logits = self.direct_classifier(pooled)
        abcd_scores = self.abcd_head(pooled)
        return class_logits, abcd_scores


def main():
    state = torch.load(PTH_PATH, map_location='cpu', weights_only=True)
    model = DermSightModel(num_classes=7)
    model.load_state_dict(state, strict=False)
    model.eval()

    torch.manual_seed(42)
    np.random.seed(42)
    # NCHW input for PyTorch
    pt_input = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        pt_logits, pt_abcd = model(pt_input)

    # Convert to NHWC for TFLite
    nhwc = pt_input.permute(0, 2, 3, 1).contiguous().numpy()
    tflite_input = nhwc.astype(np.float32)

    interp = litert.Interpreter(model_path=TFLITE_PATH)
    interp.allocate_tensors()
    input_details = interp.get_input_details()[0]
    output_details = interp.get_output_details()
    interp.set_tensor(input_details['index'], tflite_input)
    interp.invoke()
    tflite_logits = interp.get_tensor(output_details[0]['index'])
    tflite_abcd = interp.get_tensor(output_details[1]['index'])

    print('PyTorch logits sample:', pt_logits.numpy()[0, :3])
    print('TFLite logits sample:', tflite_logits[0, :3])
    print('Logits max abs diff:', np.max(np.abs(pt_logits.numpy() - tflite_logits)))
    print('ABCD max abs diff:', np.max(np.abs(pt_abcd.numpy() - tflite_abcd)))


if __name__ == '__main__':
    main()

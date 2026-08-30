import os
import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
import onnx

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PTH_PATH = os.path.join(BASE_DIR, 'assets', 'models', 'best_cbm_full.pth')
ONNX_PATH = os.path.join(BASE_DIR, 'assets', 'models', 'model.onnx')
TFLITE_PATH = os.path.join(BASE_DIR, 'assets', 'models', 'model.tflite')


class _EfficientNetEncoder(nn.Module):
    """Wraps EfficientNet features so state-dict keys match `encoder.features.*`."""

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
        features = self.encoder(x)  # [B, 1280, H, W]
        pooled = F.adaptive_avg_pool2d(features, (1, 1)).flatten(1)  # [B, 1280]
        class_logits = self.direct_classifier(pooled)
        abcd_scores = self.abcd_head(pooled)
        # abcd_classifier is kept for state_dict compatibility but not used at inference
        return class_logits, abcd_scores


def main():
    print('Loading state dict...')
    state = torch.load(PTH_PATH, map_location='cpu', weights_only=True)

    print('Building model...')
    model = DermSightModel(num_classes=7)
    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing:
        print('Missing keys:', missing)
    if unexpected:
        print('Unexpected keys:', unexpected)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        class_logits, abcd_scores = model(dummy_input)
    print('class_logits shape:', class_logits.shape)
    print('abcd_scores shape:', abcd_scores.shape)

    print('Exporting ONNX...')
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        input_names=['input'],
        output_names=['class_logits', 'abcd_scores'],
        dynamic_axes={
            'input': {0: 'batch'},
            'class_logits': {0: 'batch'},
            'abcd_scores': {0: 'batch'},
        },
        opset_version=13,
        do_constant_folding=True,
    )
    print('ONNX saved to', ONNX_PATH)

    onnx_model = onnx.load(ONNX_PATH)
    onnx.checker.check_model(onnx_model)
    print('ONNX check passed')

    print('Converting ONNX to TFLite with onnx2tf...')
    from onnx2tf import convert
    convert(
        input_onnx_file_path=ONNX_PATH,
        output_folder_path=os.path.dirname(TFLITE_PATH),
        copy_onnx_input_output_names_to_tflite=True,
        not_use_onnxsim=False,
        non_verbose=True,
    )
    # onnx2tf writes the float32 model with a fixed name inside output_folder_path
    generated = os.path.join(os.path.dirname(TFLITE_PATH), 'model_float32.tflite')
    if os.path.exists(generated):
        os.replace(generated, TFLITE_PATH)
        print('TFLite saved to', TFLITE_PATH)
    else:
        print('Expected TFLite not found at', generated)


if __name__ == '__main__':
    main()

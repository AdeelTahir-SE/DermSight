"""
Local H-CBM inference server for DermSight (Expo Go / emulator).

Usage (from repo root):
    python scripts/ml/serve.py

The app posts the captured JPEG; this process runs the real PyTorch weights.
"""

from __future__ import annotations

import base64
import io
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT / "scripts" / "ml") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts" / "ml"))

from model import (  # noqa: E402
    DEFAULT_WEIGHTS,
    IMAGENET_MEAN,
    IMAGENET_STD,
    INDEX_TO_LABEL,
    INPUT_SIZE,
    load_model,
)

HOST = "0.0.0.0"
PORT = 8765

preprocess = transforms.Compose(
    [
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ]
)

print(f"Loading H-CBM from {DEFAULT_WEIGHTS} ...")
DEVICE = torch.device("cpu")
MODEL = load_model(device=DEVICE)
print("Model ready.")


def infer_pil(image: Image.Image) -> dict:
    tensor = preprocess(image.convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        concepts, _, _, logits_final = MODEL(tensor)
        probs = torch.softmax(logits_final, dim=1).squeeze(0)

    class_probabilities = {
        INDEX_TO_LABEL[i]: round(float(probs[i]), 4) for i in range(len(INDEX_TO_LABEL))
    }
    pred_idx = int(torch.argmax(probs).item())
    predicted = INDEX_TO_LABEL[pred_idx]
    abcd = concepts.squeeze(0).tolist()

    return {
        "predictedClass": predicted,
        "confidenceScore": round(float(probs[pred_idx]), 4),
        "classProbabilities": class_probabilities,
        "abcdScores": {
            "asymmetry": round(float(abcd[0]), 4),
            "border": round(float(abcd[1]), 4),
            "color": round(float(abcd[2]), 4),
            "diameter": round(float(abcd[3]), 4),
        },
        "modelVersion": "h-cbm-full-1.0",
    }


def decode_image(payload: dict | None, raw_body: bytes, content_type: str) -> Image.Image:
    if payload and payload.get("image_base64"):
        b64 = payload["image_base64"]
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw = base64.b64decode(b64)
        return Image.open(io.BytesIO(raw))
    if raw_body:
        return Image.open(io.BytesIO(raw_body))
    raise ValueError("No image provided")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") in ("", "/health"):
            body = json.dumps(
                {
                    "ok": True,
                    "model": "SkinLesionCBM",
                    "weights": str(DEFAULT_WEIGHTS.name),
                    "labels": INDEX_TO_LABEL,
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") != "/infer":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b""
        content_type = self.headers.get("Content-Type", "")
        payload = None
        if "application/json" in content_type:
            payload = json.loads(raw.decode("utf-8") or "{}")
        try:
            image = decode_image(payload, raw, content_type)
            result = infer_pil(image)
            body = json.dumps(result).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:  # noqa: BLE001
            err = json.dumps({"error": str(exc)}).encode()
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"DermSight H-CBM server listening on http://0.0.0.0:{PORT}")
    print("POST /infer  JSON {\"image_base64\": \"...\"}  or raw JPEG body")
    print("GET  /health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")

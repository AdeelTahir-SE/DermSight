# DermSight

Offline-first skin-lesion screening for community health workers. Expo SDK 57 + a trained Hybrid CBM (HAM10000) that returns a 7-class diagnosis and ABCD scores.

## Prerequisites

- Node.js 20+
- Python 3.10+ with **PyTorch**, **torchvision**, and **Pillow** (`pip install -r ml/requirements.txt`)
- Expo Go on a phone, or an Android emulator

Weights live at `ml/weights/best_cbm_full.pth` (moved out of `src/` so Metro does not bundle them).

## Run the app (two terminals)

**Terminal 1 — model server** (required for Analyze; this is the real PyTorch model):

```bash
python scripts/ml/serve.py
```

Wait until you see `Model ready.` then `listening on http://0.0.0.0:8765`.

**Terminal 2 — Expo:**

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (same Wi‑Fi as the PC). The app sends the photo to `http://<your-pc-ip>:8765`.

Optional override:

```bash
# PowerShell
$env:EXPO_PUBLIC_INFERENCE_URL="http://192.168.1.10:8765"
npx expo start
```

### Test the model without the app

```bash
python scripts/ml/infer_cli.py path\to\lesion.jpg
```

Or open `http://127.0.0.1:8765/health` in a browser.

### In-app test path

1. Complete PIN setup / login.
2. Patients → New patient → save.
3. Open the patient → capture a lesion (or use a dermoscopic photo).
4. Review → **Use Image & Analyze**.
5. Result screen should show a real class distribution + ABCD bars (not random mock scores).

If Analyze fails, the server is not running or the phone cannot reach the PC (firewall / different network). Allow TCP port **8765**.

## Notes

- SAM 2 is **not** used at inference time; it was only used while training ABCD labels.
- Label order matches the notebook: `nv, mel, bkl, bcc, akiec, vasc, df`.
- On-device TFLite (no Python server) is the next step; `python scripts/ml/export_onnx.py` writes an ONNX graph for that conversion.

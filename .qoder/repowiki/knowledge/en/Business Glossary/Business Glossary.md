---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### H-CBM
- Definition：Hybrid Concept Bottleneck Model — the ML architecture powering DermSight's risk assessment. It combines an EfficientNet-B0 image encoder with two heads: a direct 7-class classifier and a concept head that predicts ABCD scores (Asymmetry, Border irregularity, Color variation, Diameter). Both outputs come from one interpreter run, enabling explainable triage without extra latency.
- Aliases：hybrid concept bottleneck model

### ABCD panel
- Definition：The on-screen explanation layer showing four horizontal bars (0–1 each) representing Asymmetry, Border irregularity, Color variation, and Diameter — derived from the H-CBM concept head. Used so community health workers without ML training can understand why a lesion was flagged.
- Aliases：ABCD scores、ABCD explainability panel

### risk tier
- Definition：App-level triage classification mapped from the model's 7 HAM10000 diagnostic classes into four actionable tiers for community health workers: Low (nv, vasc), Medium (bkl, df), High (bcc, akiec), Urgent Referral (mel). Defined centrally in `src/constants/riskLevels.ts` so clinical mapping can change without touching inference code.
- Aliases：triage tier、risk level

### outbox pattern
- Definition：The offline sync strategy where every local write is wrapped in a transaction that also inserts a row into the `sync_queue` table. A background task later drains pending rows, pushes them to Supabase, and marks them done or failed with exponential backoff. Guarantees no data loss even if the device goes offline mid-sync.
- Aliases：sync queue、outbox

### local-first
- Definition：Design principle that local SQLite is the single source of truth: UI reads/writes exclusively against the device database; network calls to Supabase happen asynchronously in the background sync engine. Screens never wait on connectivity.
- Aliases：offline-first、SQLite source of truth

### HAM10000 classes
- Definition：The seven diagnostic labels the model predicts from dermoscopic images: mel (melanoma), bcc (basal cell carcinoma), akiec (actinic keratosis/intraepithelial carcinoma), bkl (benign keratosis), df (dermatofibroma), vasc (vascular lesion), nv (melanocytic nevus). These map directly to risk tiers and drive the 7-class probability breakdown shown on the result screen.
- Aliases：7-class diagnosis、diagnostic classes

### TFLite model
- Definition：The on-device machine learning artifact (`dermsight_model.tflite`) produced by converting the PyTorch H-CBM model via ai-edge-torch and post-training INT8 quantization (~5–8 MB). Bundled with the app so inference runs zero-connectivity on the phone; optional OTA updates are versioned through the `model_versions` table.
- Aliases：on-device model、quantized model、dermsight_model.tflite

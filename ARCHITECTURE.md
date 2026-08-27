# DermSight MVP — Architecture Document

**Category:** Preventive Care & Global Health Accessibility
**Platform:** React Native (Expo, Dev Client — not Expo Go, due to native ML modules)
**Styling:** NativeWind v4 (Tailwind for React Native)
**Core value prop:** Offline-first, on-device dermatological risk screening for community health workers in low-bandwidth regions, with background sync to a central medical database.

**Model source:** [Clinically_Explainable_Skin_Lesion_Classification_Using_SAM2_HAM10000](https://github.com/moazzam71005/Clinically_Explainable_Skin_Lesion_Classification_Using_SAM2_HAM10000) — a Hybrid Concept Bottleneck Model (H-CBM) trained on HAM10000, chosen specifically because it outputs clinically interpretable ABCD scores alongside the diagnosis, not just a raw class probability. This is what powers the "explainable" result screen below.

---

## 1. Why Expo Dev Client (not Expo Go)

On-device TFLite inference and camera frame processing require native modules that Expo Go does not support. This project uses **Expo Prebuild + `expo-dev-client`** so we keep Expo's tooling (EAS Build, OTA updates, config plugins) while allowing native code (`react-native-fast-tflite`, `react-native-vision-camera`).

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Expo SDK (dev client) + React Native | Native module support + Expo DX |
| Navigation | `expo-router` (file-based) | Matches folder structure 1:1, deep-link ready |
| Styling | NativeWind v4 + Tailwind config | Required by spec, utility-first, themeable |
| State | Zustand | Lightweight, no boilerplate, offline-friendly |
| Server cache / sync orchestration | TanStack Query (used only for sync operations, not as source of truth) | Retry/backoff primitives |
| Local DB | `expo-sqlite` + Drizzle ORM | Structured offline storage, typed queries, migrations |
| On-device ML | `react-native-fast-tflite` running a converted, quantized version of the H-CBM model | Fast, small footprint, INT8 post-training quantization |
| Camera | `react-native-vision-camera` | Frame processor support for real-time capture guidance |
| Geo-tagging | `expo-location` | Patient/assessment location capture |
| Background sync | `expo-task-manager` + `expo-background-fetch` + `@react-native-community/netinfo` | Auto-sync when connectivity restored |
| Remote backend | Supabase (Postgres + Storage + Auth) | Central medical DB, RLS, image storage |
| Secure storage | `expo-secure-store` | Auth tokens, PIN hash |
| Forms/validation | `react-hook-form` + `zod` | Patient intake validation |
| i18n | `i18next` + `react-i18next` | Multi-region health worker deployment |
| Testing | Jest + React Native Testing Library + Detox (later) | Unit + E2E |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer (app/)                     │
│        expo-router screens — NativeWind styled              │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
        ┌───────▼────────┐             ┌────────▼────────┐
        │  Zustand Stores │             │  Feature Hooks   │
        │ (auth, patients,│             │ (useCamera, etc) │
        │  sync, ml)      │             └────────┬────────┘
        └───────┬────────┘                       │
                │                                │
        ┌───────▼─────────────────────────────────▼───────┐
        │              Feature Modules (src/features/)     │
        │  auth · patients · assessments · sync             │
        └───────┬───────────────────────┬──────────────────┘
                │                       │
      ┌─────────▼─────────┐   ┌─────────▼──────────┐
      │  Local SQLite DB    │   │  ML Inference Engine │
      │  (source of truth)  │   │  (TFLite, on-device) │
      └─────────┬───────────┘   └──────────────────────┘
                │
      ┌─────────▼───────────┐
      │   Sync Engine        │  ← triggered by NetInfo + background task
      │  (outbox pattern)     │
      └─────────┬───────────┘
                │ (when online)
      ┌─────────▼───────────┐
      │  Supabase (Postgres,  │
      │  Storage, Auth)        │
      └────────────────────────┘
```

**Key principle: local SQLite is the single source of truth.** The UI never waits on network. Every write (patient record, assessment, image) lands in SQLite first, then gets queued for sync. This is what makes the app truly offline-first rather than "offline-tolerant."

---

## 4. The Model: What It Actually Is (and What That Means for the App)

The linked notebook trains a **Hybrid Concept Bottleneck Model (H-CBM)** on EfficientNet-B0, on the full HAM10000 dataset (10,015 dermoscopic images, 7 diagnostic classes). This is materially different from a plain image classifier, and it shapes several architecture decisions below.

**Model structure (from the source repo):**

```
Dermoscopy Image
      │
      ▼
  EfficientNet-B0 Encoder (1,280-dim features)
      │
      ├──────────────────────┬───────────────────┐
      ▼                      ▼                    │
  ABCD Concept Head      Direct Classifier         │
  1280→128→32→4          1280→256→7                │
  (Sigmoid, BN,           (Dropout 0.4)            │
   Dropout 0.3)                │                   │
      │                        │                   │
      ▼                        │                   │
  ABCD Classifier (4→7)        │                   │
      │                        │                   │
      └────────────────────────┘                   │
               │  blend λ=0.5                       │
               ▼                                    │
         Final Logits ──────────────────────────────┘
               │
               ▼
      7-Class Diagnosis + 4 ABCD Concept Scores
```

**The 7 output classes (HAM10000 taxonomy):**

| Code | Diagnosis | Reported F1 | Malignant? |
|---|---|---|---|
| `mel` | Melanoma | 0.70 | Yes — highest priority |
| `bcc` | Basal cell carcinoma | 0.85 | Yes |
| `akiec` | Actinic keratosis / intraepithelial carcinoma | 0.76 | Pre-malignant |
| `bkl` | Benign keratosis | 0.76 | No |
| `df` | Dermatofibroma | 0.81 | No |
| `vasc` | Vascular lesion | 0.98 | No |
| `nv` | Melanocytic nevus (common mole) | 0.93 | No |

**Critical implication for the mobile pipeline: SAM 2 is not needed on-device.** SAM 2 segmentation is used only *during training* to compute the ground-truth ABCD feature values (Asymmetry, Border, Color, Diameter) that supervise the concept head. Once trained, the concept head predicts those same four scores directly from the EfficientNet-B0 image features — no mask, no SAM 2, no extra model. This is the entire point of a Concept Bottleneck architecture, and it's what makes this model realistic for edge deployment: a single ~5M-parameter EfficientNet-B0-based network, not a segmentation model plus a classifier.

**What ships on-device:** one converted, quantized model that takes a cropped lesion image and returns, in one forward pass:
1. 7-way diagnosis probability distribution
2. 4 ABCD concept scores (0–1 each: Asymmetry, Border irregularity, Color variation, Diameter)

Both outputs come from the same interpreter run — no extra latency for the explainability layer.

---

## 5. Model Conversion Pipeline (PyTorch → On-Device TFLite)

The source notebook trains and saves a **PyTorch** model (`best_cbm_full.pth`). This is a one-time, offline step done *before* the app is built — it does not run on the phone.

```
best_cbm_full.pth (PyTorch, from the notebook)
      │
      ▼
1. Export with ai-edge-torch (Google's PyTorch→LiteRT/TFLite converter)
   — preferred over the older ONNX→TF→TFLite path because this model
     has two output heads (concept scores + blended logits), which
     onnx-tf frequently mishandles for custom forward() logic.
      │
      ▼
2. Post-training INT8 quantization
   — calibrate using a few hundred representative HAM10000 images
     (same preprocessing as training: resize, normalize)
      │
      ▼
3. Validate converted model against the PyTorch original
   — run both on a held-out sample, confirm per-class probabilities
     and ABCD scores match within acceptable tolerance
      │
      ▼
4. Output: dermsight_model.tflite  (~5–8MB after INT8 quantization)
      │
      ▼
5. Bundle into src/ml/assets/ for the RN app (zero-connectivity first run)
```

This conversion step lives in its own small Python script/notebook alongside the model repo — **not** part of the React Native codebase. The RN app only ever consumes the final `.tflite` file.

---

## 6. Risk Mapping (7 HAM10000 classes → 4 app-level triage tiers)

The model's raw output is a diagnostic label, not a triage decision. The app maps each class to an actionable tier for a community health worker with no dermatology training:

| App Risk Tier | HAM10000 Classes | Health Worker Action |
|---|---|---|
| **Urgent Referral** | `mel` (melanoma) | Refer to clinic/specialist immediately, flag record |
| **High** | `bcc`, `akiec` | Refer within days, monitor |
| **Medium** | `bkl`, `df` | Advise monitoring, re-screen in follow-up visit |
| **Low** | `nv`, `vasc` | Routine, no immediate action |

Defined in `src/constants/riskLevels.ts` — kept separate from the model's raw label so the mapping can be adjusted (e.g. by a clinical advisor) without touching the model or inference code. The confidence score and full class distribution are always stored alongside the mapped tier, never discarded, so a low-confidence "Low" result is still visibly flagged as low-confidence rather than presented as reassuring.

---

## 7. Screens (13 total)

Grouped by flow, matches the `app/` route groups below.

| # | Screen | Route | Purpose |
|---|---|---|---|
| 1 | Splash / Bootstrap | `app/index.tsx` | Checks auth + DB init + model presence, routes accordingly |
| 2 | Login (offline-capable PIN) | `(auth)/login.tsx` | Health worker signs in with cached credentials/PIN, no network required after first setup |
| 3 | PIN Setup | `(auth)/pin-setup.tsx` | First-run device enrollment, sets local PIN tied to Supabase account |
| 4 | Home Dashboard | `(app)/home/index.tsx` | Pending syncs, patient count, quick actions, connectivity indicator |
| 5 | Patient List | `(app)/patients/index.tsx` | Searchable/filterable list of locally stored patients |
| 6 | New Patient Registration | `(app)/patients/new.tsx` | Intake form + geo-tag capture (auto, via `expo-location`) |
| 7 | Patient Profile Detail | `(app)/patients/[patientId]/index.tsx` | Demographics, past assessments, sync status per record |
| 8 | Lesion Capture (Camera) | `(app)/patients/[patientId]/capture.tsx` | Guided camera UI (framing overlay, lighting check via frame processor) |
| 9 | Image Review / Retake | `(app)/patients/[patientId]/review.tsx` | Confirm or retake before running inference |
| 10 | Risk Assessment Result | `(app)/patients/[patientId]/result.tsx` | 7-class diagnosis, mapped risk tier, **ABCD explainability panel**, recommended action |
| 11 | Assessment History | `(app)/patients/[patientId]/history.tsx` | Timeline of past assessments for that patient |
| 12 | Sync Queue / Status | `(app)/sync/index.tsx` | Manual "Sync now," per-item status, failed-item retry |
| 13 | Settings | `(app)/settings/index.tsx` + `language.tsx` + `model-management.tsx` | Language, model version/update, account, data export |

**Screen 10 detail — this is the differentiator of the app.** Rather than showing a bare "High Risk" label, it renders:
- The mapped risk tier (color-coded badge) + recommended action text
- The top-line diagnosis label + confidence
- Full 7-class probability breakdown (collapsible)
- The **ABCD panel**: four horizontal bars (Asymmetry, Border, Color, Diameter), each 0–1, so a health worker with no ML background can see *why* the model flagged something — mirroring the "clinical dashboard" concept from the source repo, adapted for a phone screen instead of a 4-panel matplotlib figure.

---

## 8. Complete File Structure

```
dermsight/
├── app/                                   # expo-router (file-based routing)
│   ├── _layout.tsx                        # Root layout: providers (Zustand hydration, QueryClient, i18n, NativeWind)
│   ├── index.tsx                          # Splash/bootstrap + redirect logic
│   ├── +not-found.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx                    # Stack layout for unauthenticated flow
│   │   ├── login.tsx
│   │   └── pin-setup.tsx
│   │
│   └── (app)/
│       ├── _layout.tsx                    # Tab navigator: Home | Patients | Sync | Settings
│       ├── home/
│       │   └── index.tsx
│       ├── patients/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── [patientId]/
│       │       ├── _layout.tsx            # Sub-stack for patient flow
│       │       ├── index.tsx
│       │       ├── capture.tsx
│       │       ├── review.tsx
│       │       ├── result.tsx
│       │       └── history.tsx
│       ├── sync/
│       │   └── index.tsx
│       └── settings/
│           ├── index.tsx
│           ├── language.tsx
│           └── model-management.tsx
│
├── src/
│   ├── components/
│   │   ├── ui/                            # Primitive NativeWind components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx                  # Risk-tier badge (color-coded)
│   │   │   ├── Input.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ConnectivityBanner.tsx     # Persistent offline/online indicator
│   │   ├── patient/
│   │   │   ├── PatientListItem.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   └── PatientHeader.tsx
│   │   ├── camera/
│   │   │   ├── CaptureOverlay.tsx         # Framing guide, lighting hint
│   │   │   └── CaptureControls.tsx
│   │   ├── assessment/
│   │   │   ├── RiskTierBadge.tsx
│   │   │   ├── ClassProbabilityList.tsx   # Collapsible 7-class breakdown
│   │   │   └── ABCDPanel.tsx              # 4-bar explainability panel (Asymmetry/Border/Color/Diameter)
│   │   └── sync/
│   │       ├── SyncQueueItem.tsx
│   │       └── SyncStatusPill.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts                     # Supabase auth calls
│   │   │   ├── store.ts                   # Zustand: session, worker profile
│   │   │   ├── pin.ts                     # Local PIN hash/verify logic
│   │   │   └── types.ts
│   │   │
│   │   ├── patients/
│   │   │   ├── repository.ts              # SQLite CRUD (source of truth)
│   │   │   ├── store.ts                   # Zustand: active patient, list filters
│   │   │   ├── validation.ts              # zod schemas
│   │   │   └── types.ts
│   │   │
│   │   ├── assessments/
│   │   │   ├── repository.ts              # SQLite CRUD for assessments
│   │   │   ├── store.ts
│   │   │   ├── types.ts                   # AssessmentResult: { classProbs[7], abcdScores[4], riskTier, ... }
│   │   │   └── inference/
│   │   │       ├── modelLoader.ts         # Loads dermsight_model.tflite via fast-tflite
│   │   │       ├── preprocess.ts          # Resize/normalize frame to EfficientNet-B0 input tensor
│   │   │       ├── classify.ts            # Runs interpreter, returns { classProbs, abcdScores }
│   │   │       └── riskMapping.ts         # 7-class label → app risk tier (see §6)
│   │   │
│   │   └── sync/
│   │       ├── syncEngine.ts              # Orchestrates outbox → Supabase push/pull
│   │       ├── syncQueue.ts               # Enqueue/dequeue, retry with backoff
│   │       ├── conflictResolution.ts      # Last-write-wins / server-authoritative rules
│   │       └── backgroundTask.ts          # expo-task-manager registration
│   │
│   ├── db/
│   │   ├── client.ts                      # expo-sqlite + Drizzle instance
│   │   ├── schema.ts                      # Drizzle schema (see §9)
│   │   └── migrations/
│   │       └── 0001_init.sql
│   │
│   ├── lib/
│   │   ├── supabase.ts                    # Supabase client init
│   │   ├── netinfo.ts                     # Connectivity listener wrapper
│   │   ├── location.ts                    # expo-location wrapper
│   │   ├── secureStorage.ts               # expo-secure-store wrapper
│   │   └── i18n.ts                        # i18next init
│   │
│   ├── ml/
│   │   ├── assets/
│   │   │   └── dermsight_model.tflite     # Converted + INT8-quantized H-CBM model (see §5)
│   │   ├── labels.ts                      # ['mel','bcc','akiec','bkl','df','vasc','nv'] + display names
│   │   └── modelDownloader.ts             # Optional OTA model version updates
│   │
│   ├── hooks/
│   │   ├── useConnectivity.ts
│   │   ├── useSyncStatus.ts
│   │   ├── useCameraPermissions.ts
│   │   └── useDebounce.ts
│   │
│   ├── constants/
│   │   ├── theme.ts                       # Color tokens consumed by tailwind.config.js
│   │   └── riskLevels.ts                  # LOW / MEDIUM / HIGH / URGENT_REFERRAL enum + colors + class mapping
│   │
│   ├── types/
│   │   └── index.ts                       # Shared cross-feature types
│   │
│   └── utils/
│       ├── date.ts
│       ├── image.ts                       # Compression before local storage
│       └── uuid.ts                        # Local ID generation (offline-safe)
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── locales/
│       ├── en.json
│       ├── fr.json
│       └── sw.json
│
├── global.css                             # NativeWind entry (Tailwind directives)
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── app.config.ts                          # Expo config (plugins: vision-camera, fast-tflite, location)
├── eas.json
├── package.json
├── tsconfig.json
└── .env.example                           # SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## 9. Local Database Schema (SQLite via Drizzle)

```
users (health workers)
  id (uuid, pk) · full_name · region · pin_hash · supabase_user_id · created_at

patients
  id (uuid, pk, generated locally)
  full_name · age · sex · phone (nullable)
  latitude · longitude · captured_at
  created_by (fk → users.id)
  created_at · updated_at
  sync_status: 'pending' | 'synced' | 'failed'
  remote_id (nullable, set after first successful sync)

assessments
  id (uuid, pk)
  patient_id (fk → patients.id)
  image_local_uri
  image_remote_url (nullable, set post-sync)
  predicted_class: 'mel' | 'bcc' | 'akiec' | 'bkl' | 'df' | 'vasc' | 'nv'
  class_probabilities (json — all 7 scores, not just top-1)
  abcd_asymmetry · abcd_border · abcd_color · abcd_diameter (float 0–1 each)
  risk_tier: 'low' | 'medium' | 'high' | 'urgent_referral'
  confidence_score (float)
  model_version
  latitude · longitude · captured_at
  created_by (fk → users.id)
  sync_status: 'pending' | 'synced' | 'failed'
  remote_id (nullable)

sync_queue
  id (pk, autoincrement)
  entity_type: 'patient' | 'assessment'
  entity_id (uuid)
  operation: 'create' | 'update'
  payload (json)
  attempt_count
  last_attempted_at
  status: 'pending' | 'in_progress' | 'failed' | 'done'

model_versions
  id · version_tag · file_uri · downloaded_at · is_active
```

**Supabase (remote) mirrors `patients` and `assessments`** with the same shape plus RLS policies scoping rows to the health worker's organization/region. Images sync to Supabase Storage; `image_remote_url` is written back after upload. Storing the full class-probability array and ABCD scores (not just the top prediction) matters here — it's what lets a clinician later review *why* a case was flagged, and what would let you retrain/recalibrate the risk mapping without re-running inference on old images.

---

## 10. Offline Sync Strategy (Outbox Pattern)

1. Every local write (new patient, new assessment) is wrapped in a transaction that also inserts a row into `sync_queue`.
2. `NetInfo` listener + a registered `expo-background-fetch` task both call `syncEngine.run()`:
   - Pull `sync_queue` rows with `status = 'pending'`, ordered by creation time.
   - For each: upload image (if any) to Supabase Storage → upsert row to Postgres → mark `synced`, store `remote_id`.
   - On failure: increment `attempt_count`, apply exponential backoff, mark `failed` after N retries (surfaced in Sync Queue screen for manual retry).
3. **Never blocks the UI.** All sync happens on a background queue; screens read only from local SQLite.
4. Conflict rule for MVP: **server-authoritative on pull, client-wins on push** (health worker's on-site record is treated as ground truth for that record's own edits — no concurrent multi-device editing in MVP scope).

---

## 11. On-Device ML Inference Pipeline

```
Camera frame (vision-camera)
   → preprocess.ts: crop/resize to EfficientNet-B0 input shape, normalize
   → modelLoader.ts: cached TFLite interpreter instance (loaded once, reused)
   → classify.ts: single interpreter.run(tensor) → { classProbs[7], abcdScores[4] }
   → riskMapping.ts: argmax(classProbs) → predicted_class → risk_tier (per §6)
   → assessments.repository: persist predicted_class, all 7 probabilities,
     4 ABCD scores, risk_tier, and image locally
   → result.tsx renders RiskTierBadge + ClassProbabilityList + ABCDPanel
```

- Model ships bundled in `src/ml/assets/` for true zero-connectivity first run (see §5 for how it gets there).
- `modelDownloader.ts` allows optional OTA updates to a newer quantized model when online, versioned via `model_versions` table so results stay traceable to the model that produced them.
- Inference runs entirely on-device — no image, no SAM 2, no server call — until sync.

---

## 12. Security & Privacy Notes (MVP scope)

- Auth tokens and PIN hash stored via `expo-secure-store` (Keychain/Keystore-backed), never in SQLite.
- Patient records use locally generated UUIDs so the app never depends on the network to create a valid record.
- Recommend enabling Supabase Row Level Security scoped by `region`/`organization_id` before any pilot deployment.
- Note for later hardening: plain `expo-sqlite` is not encrypted at rest — flag `op-sqlite` (with SQLCipher) as a post-MVP upgrade if handling sensitive patient data long-term.
- Given the model's `mel`/melanoma F1 is only 0.70 (per the source repo's reported metrics) — the UI must never present a "Low" or "nv" result as a guarantee. Always show confidence and frame results as "screening triage," not diagnosis, with wording reviewed by a clinical advisor before pilot use.

---

## 13. Suggested Build Order (for the IDE agent)

1. Scaffold Expo project + `expo-router` + NativeWind config + folder structure above (no logic yet).
2. `db/schema.ts` + migrations + `db/client.ts` — get local persistence working first.
3. Auth flow (`(auth)` screens) with Supabase + PIN fallback.
4. Patients feature (list, new, detail) — CRUD against local DB only.
5. Camera capture + review screens (using a placeholder/mock inference result — no model yet).
6. Convert the PyTorch model to `.tflite` offline (§5), drop it into `src/ml/assets/`, wire up real `inference/` module.
7. Build the Result screen properly: `RiskTierBadge`, `ClassProbabilityList`, `ABCDPanel`.
8. Sync engine + background task + Sync Queue screen.
9. Settings, i18n, model management.
10. Polish: NativeWind theming pass, empty/error states, connectivity banner everywhere.

---

## 14. Key Packages to Install

```
expo-router expo-dev-client expo-sqlite expo-location expo-secure-store
expo-task-manager expo-background-fetch expo-camera
react-native-vision-camera react-native-fast-tflite
drizzle-orm drizzle-kit
zustand @tanstack/react-query
react-hook-form zod @hookform/resolvers
i18next react-i18next
@react-native-community/netinfo
nativewind tailwindcss
@supabase/supabase-js
```

*(Model conversion itself — `ai-edge-torch`, `torch`, `tensorflow` — is a Python-side dependency for the offline conversion script in §5, not part of the React Native app's `package.json`.)*
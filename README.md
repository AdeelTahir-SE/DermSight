


# DermSight Mobile App

DermSight is an offline-first, on-device dermatological risk screening application designed for community health workers in low-bandwidth regions. The app enables health workers to register patients, capture images of skin lesions, perform immediate on-device ML-based risk assessment (returning classification and clinical ABCD scores), and sync data automatically with a centralized Supabase database when internet connectivity is available.

>  **Download Demo APK**: [Download DermSight Android APK (Google Drive)](https://drive.google.com/file/d/12AdY-X3D3E5woK8AhKNMqWXBwQA1DxXJ/view?usp=sharing)

>  **Video Demo**: [DermSight (Demo)](https://github.com/user-attachments/assets/348f0073-3d5b-451c-8638-28a182b6e5fa)

## Key Capabilities

* **Offline-First Source of Truth**: All writes (patient files, assessments, images) land in a local SQLite database first. The UI never blocks on network connectivity.
* **On-Device Inference**: Uses a quantized Hybrid Concept Bottleneck Model (H-CBM) running on-device via TensorFlow Lite, outputting a 7-class diagnostic probability distribution alongside explainable ABCD concept scores (Asymmetry, Border, Color, Diameter).
* **Explainable Diagnostics**: Displays mapped risk tiers (Urgent Referral, High, Medium, Low) alongside a visual ABCD explainability panel mapping clinical feature scores directly.
* **Outbox Background Sync**: Leverages a robust SQLite-backed sync queue that automatically replicates data to Supabase using exponential backoff retries when connection is restored.
* **Multi-Device Synchronization**: Automatically pulls existing patient files and assessments from Supabase on email login, allowing users to sync their records across devices.
* **Guided Lesion Capture**: Custom camera screen with real-time framing guides and lighting checks to ensure high-quality skin lesion photography.
* **Secure Access**: Offline pin authentication to lock/unlock active sessions without requiring server round-trips.

## Technology Stack

* **Framework**: React Native with Expo SDK (Dev Client layout)
* **Routing**: Expo Router (file-based navigation stack)
* **Styling**: NativeWind v4 (Tailwind CSS for React Native)
* **Local Database**: Drizzle ORM + Expo SQLite
* **State Management**: Zustand
* **Remote Backend**: Supabase (Auth, Postgres, RLS Policies, and Storage)
* **On-Device ML**: TensorFlow Lite (via `react-native-fast-tflite`)
* **Sensors**: Expo Location (for patient intake geo-tagging) & Expo Camera (for guided captures)
* **Sync Triggers**: `@react-native-community/netinfo` & `expo-task-manager`

## High-Level Architecture

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

## Local Database Schema (SQLite + Drizzle)

The database schema is defined in [schema.ts](file:///d:/Projects/DermSight/src/db/schema.ts).

### Users Table (`users`)
Tracks registered health workers on the device.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | Primary Key | Health worker local ID |
| `full_name` | text | Not Null | Worker's display name |
| `region` | text | Not Null | Worker's geographic region |
| `pin_hash` | text | Not Null | Salted hash of local PIN code |
| `supabase_user_id`| text | Not Null | Linked Supabase Authentication UUID |
| `created_at` | text | Not Null | ISO timestamp |

### Patients Table (`patients`)
Stores patient details and GPS coordinates.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | Primary Key | Patient local UUID |
| `first_name` | text | Not Null | Patient first name |
| `last_name` | text | Not Null | Patient last name |
| `date_of_birth` | text | Not Null | Formatted date of birth |
| `sex` | text | Not Null | Enum: `male`, `female`, `other` |
| `phone` | text | Nullable | Contact number |
| `address` | text | Nullable | Residential address |
| `notes` | text | Nullable | Clinical notes / medical history |
| `latitude` | real | Nullable | GPS latitude at registration |
| `longitude` | real | Nullable | GPS longitude at registration |
| `captured_at` | text | Not Null | Record capture timestamp |
| `created_by` | text | Foreign Key -> `users.id` | Registering health worker |
| `created_at` | text | Not Null | Record creation timestamp |
| `updated_at` | text | Not Null | Record update timestamp |
| `sync_status` | text | Not Null, Default `pending` | Enum: `pending`, `synced`, `failed` |
| `remote_id` | text | Nullable | Assigned UUID in Supabase |

### Assessments Table (`assessments`)
Stores AI diagnostic results and clinical measurements.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | Primary Key | Assessment local UUID |
| `patient_id` | text | Foreign Key -> `patients.id` | Reference to patient record |
| `image_local_uri` | text | Not Null | Local file path of the lesion image |
| `image_remote_url` | text | Nullable | Storage URL on Supabase |
| `predicted_class` | text | Not Null | Enum: `mel`, `bcc`, `akiec`, `bkl`, `df`, `vasc`, `nv` |
| `class_probabilities` | text | Not Null | JSON string of full probability map |
| `abcd_asymmetry` | real | Not Null | Calculated asymmetry index (0–1) |
| `abcd_border` | real | Not Null | Calculated border index (0–1) |
| `abcd_color` | real | Not Null | Calculated color index (0–1) |
| `abcd_diameter` | real | Not Null | Calculated diameter index (0–1) |
| `risk_tier` | text | Not Null | Mapped tier: `low`, `medium`, `high`, `urgent_referral` |
| `confidence_score` | real | Not Null | Model confidence score |
| `model_version` | text | Not Null | Version tag of active TFLite file |
| `body_location` | text | Nullable | Anatomical site of the lesion |
| `latitude` | real | Nullable | GPS latitude of assessment |
| `longitude` | real | Nullable | GPS longitude of assessment |
| `captured_at` | text | Not Null | Capture/inference timestamp |
| `created_by` | text | Foreign Key -> `users.id` | Health worker executing inference |
| `sync_status` | text | Not Null, Default `pending` | Enum: `pending`, `synced`, `failed` |
| `remote_id` | text | Nullable | Assigned UUID in Supabase |
| `created_at` | text | Not Null | Record creation timestamp |

### Sync Queue Table (`sync_queue`)
Acts as the outbox queue for background sync operations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | integer| Primary Key, Autoincrement | Queue item sequence ID |
| `entity_type` | text | Not Null | Enum: `patient`, `assessment` |
| `entity_id` | text | Not Null | Local UUID of patient or assessment |
| `operation` | text | Not Null | Enum: `create`, `update` |
| `payload` | text | Not Null | Full entity JSON serialization |
| `attempt_count` | integer| Not Null, Default `0` | Number of failed push attempts |
| `last_attempted_at`| text | Nullable | Last sync attempt timestamp |
| `status` | text | Not Null, Default `pending` | Enum: `pending`, `in_progress`, `failed`, `done` |
| `created_at` | text | Not Null | Queue timestamp |

### Model Versions Table (`model_versions`)
Manages over-the-air updates for on-device TFLite models.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | text | Primary Key | Version UUID |
| `version_tag` | text | Not Null | Version release label |
| `file_uri` | text | Not Null | Local file path of TFLite binary |
| `downloaded_at` | text | Not Null | ISO timestamp |
| `is_active` | integer| Not Null, Default `false` | Boolean indicating active inference model |

## ML Diagnostic Pipeline

### Model Taxonomy & Risk Mapping
The Hybrid Concept Bottleneck Model classifies lesions into 7 diagnostic classes (HAM10000 taxonomy), which the application automatically translates to actionable risk tiers for non-specialist community health workers:

* **Urgent Referral** (`mel` - Melanoma): Refer to clinic or specialist immediately, flag record.
* **High Risk** (`bcc` - Basal Cell Carcinoma, `akiec` - Actinic Keratosis): Refer within days, monitor.
* **Medium Risk** (`bkl` - Benign Keratosis, `df` - Dermatofibroma): Advise monitoring, re-screen in follow-up.
* **Low Risk** (`nv` - Melanocytic Nevus, `vasc` - Vascular Lesion): Routine monitoring, no immediate action.

### Explainability Model (ABCD Model)
Along with classification probabilities, the concept head computes 4 scalar clinical features (0.0 to 1.0) representing the standard dermatological **ABCD criteria**:
* **Asymmetry**: Level of spatial asymmetry across lesion halves.
* **Border**: Irregularity or blurriness of outer lesion borders.
* **Color**: Variance or multiplicity of colors within the lesion.
* **Diameter**: Scaled size representation of the mole.

These details are rendered graphically inside the result explainability dashboard to give transparency behind the network's diagnostic rationale.

## Project Structure

```
├── app/                                   # expo-router file-based routes
│   ├── _layout.tsx                        # Root providers & database setup
│   ├── index.tsx                          # App bootstrap & routing gateway
│   ├── (auth)/                            # Authentication routes (Login, PIN setup)
│   └── (app)/                             # Main tab structure
│       ├── home/                          # Home dashboard & pending queue count
│       ├── patients/                      # Patient management, history, and screening
│       ├── sync/                          # Sync queue console & retry interface
│       └── settings/                      # Preferences, sync logs, and profile info
├── src/
│   ├── components/                        # UI elements, widgets, banners
│   ├── db/                                # SQLite initialization and Drizzle schemas
│   ├── features/                          # Feature sub-modules
│   │   ├── auth/                          # Secure credentials, state store, and hashes
│   │   ├── patients/                      # SQLite queries, patient Zustand store
│   │   ├── assessments/                   # Image preprocessing & TFLite inference
│   │   └── sync/                          # Sync outbox engine & remote pull sync
│   ├── hooks/                             # Shared React Hooks (Connectivity, netinfo)
│   ├── lib/                               # Third-party setups (Supabase, i18next)
│   └── types/                             # Shared TypeScript declarations
```

## Getting Started

###  Quick Install (Android APK)
Download and install the standalone Android APK directly to test the app on physical devices without needing local development dependencies:
 **[Download DermSight Android APK](https://drive.google.com/file/d/12AdY-X3D3E5woK8AhKNMqWXBwQA1DxXJ/view?usp=sharing)**

---

### Local Development Setup

### 1. Install Dependencies
Ensure you have Node.js installed, then install package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root containing your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
Start the Metro bundler locally:
```bash
npx expo start
```

### 4. Testing with ngrok Tunneling (Android / iOS Device)
To test the application on a physical mobile device running the **Expo Go** application:
1. Start the tunnel command (which loads `@expo/ngrok`):
   ```bash
   npm run tunnel
   ```
2. Open the **Expo Go** app on your phone.
3. Scan the QR code displayed in the terminal to bundle and load the application.

## Synchronization Mechanics

### One-Way Outbox Push
Every patient or assessment created on the device sets `syncStatus = "pending"` and pushes a reference to `sync_queue`. The sync engine monitors connection status via `NetInfo`. Once online, it:
1. Dequeues pending items in sequence.
2. Queries the local SQLite table directly to retrieve the complete, updated record.
3. Uploads lesion images first to Supabase Storage, replacing local references with remote links.
4. Executes remote Supabase RPC functions (`upsert_patient` and `upsert_assessment`) to insert records.
5. Updates the local SQLite record status to `synced` and assigns the returned `remoteId`.
6. Triggers Zustand store reloads using external `.getState()` dispatchers to update the UI instantly.

### Multi-Device Pull Sync
Upon entering email/password credentials on a new device, the authentication store invokes `pullRemoteData()` immediately following profile verification. The sync engine fetches all remote records owned by the current health worker, maps them back into local SQLite tables, and automatically hydrates the Zustand stores. This guarantees seamless data portability across devices.

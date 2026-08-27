---
kind: external_dependency
name: Expo Dev Client — required runtime for native modules
slug: expo-dev-client
category: external_dependency
category_hints:
    - client_constraint
scope:
    - '**'
source_files:
    - app.json
    - package.json
---

### Identity
The project runs under Expo SDK 57 but explicitly uses the **Expo Dev Client** (prebuilt development client) rather than Expo Go.

### Why it matters
On-device TFLite inference (`react-native-fast-tflite`) and real-time frame processing (`react-native-vision-camera`) require native modules that Expo Go cannot load. The Dev Client lets the team keep Expo's tooling (EAS Build, OTA updates, config plugins) while embedding native code.

### Stable constraint
- Development builds must be launched through the Dev Client, not Expo Go.
- Production builds will go through EAS Build (referenced in architecture build order); the same plugin set in `app.json` (camera, location) must remain consistent between dev and prod.
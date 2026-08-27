# Camera Integration

<cite>
**Referenced Files in This Document**
- [capture.tsx](file://src/app/(app)/patients/[patientId]/capture.tsx)
- [review.tsx](file://src/app/(app)/patients/[patientId]/review.tsx)
- [result.tsx](file://src/app/(app)/patients/[patientId]/result.tsx)
- [useCameraPermissions.ts](file://src/hooks/useCameraPermissions.ts)
- [image.ts](file://src/utils/image.ts)
- [classify.ts](file://src/features/assessments/inference/classify.ts)
- [riskLevels.ts](file://src/constants/riskLevels.ts)
- [ABCDPanel.tsx](file://src/components/assessment/ABCDPanel.tsx)
- [package.json](file://package.json)
</cite>

## Update Summary
**Changes Made**
- Migrated image infrastructure from legacy expo-file-system to modern v57 API using Directory, File, and Paths classes for improved file management
- Enhanced camera integration with production-ready implementation using expo-camera's CameraView component including sophisticated permission handling, flash mode toggling, front/back camera switching, and framing guides with corner brackets and center crosshair overlays
- Updated all file operations to use the new expo-file-system v57 API with proper directory creation and file management
- Improved camera UI with real-time preview, comprehensive controls, and professional-grade framing assistance
- Enhanced error handling and user feedback throughout the capture workflow

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
DermSight's camera integration system provides a complete end-to-end solution for capturing lesion images with professional-grade features. The system leverages expo-camera for native camera access with comprehensive permission management, real-time preview capabilities, and sophisticated framing assistance. Healthcare workers can capture high-quality images with guided positioning, review them for quality assurance, and proceed to AI-powered risk assessment with full transparency through ABCD explainability scores.

The system has been enhanced with modern file management using expo-file-system v57 API and a production-ready camera interface with advanced features like flash control, camera switching, and sophisticated framing guides.

## Project Structure
The camera workflow spans multiple screens and supporting components:
- **Capture Screen**: Full-screen camera interface with live preview, framing guides, and comprehensive controls
- **Review Screen**: Image validation interface with quality assessment and analysis options
- **Result Screen**: Comprehensive diagnosis presentation with confidence scores and clinical guidance
- **Permission Hook**: Cross-platform camera permission management with appropriate fallbacks
- **Image Utilities**: Modern file management using expo-file-system v57 API with Directory, File, and Paths classes
- **Inference Module**: Mock classification system ready for TFLite model integration

```mermaid
graph TB
Capture["Capture Screen<br/>expo-camera CameraView"] --> Review["Review Screen<br/>quality check & validation"]
Review --> Result["Result Screen<br/>diagnosis & ABCD"]
Capture --> Permissions["useCameraPermissions<br/>cross-platform hook"]
Review --> Inference["runInference<br/>mock ML"]
Capture --> Images["Image Utils<br/>expo-file-system v57"]
Result --> Risk["Risk Mapping<br/>constants"]
Result --> ABCD["ABCD Panel<br/>explainability"]
Images --> FileSystem["Directory/File/Paths API"]
```

**Diagram sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)

**Section sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)

## Core Components
- **Camera Permission Hook**: Provides status and request flow with platform-specific handling; supports undetermined/denied/granted states with web fallback
- **Capture Screen**: Presents a full-screen CameraView with real-time preview, sophisticated framing guides with corner brackets and center crosshair, instructional overlay, flash mode toggling, front/back camera switching, shutter button, and expandable tips panel
- **Review Screen**: Displays captured image with quality indicator, tips for better results, and actions to analyze or retake
- **Result Screen**: Shows top diagnosis, confidence, class probabilities, ABCD explainability, and recommended actions based on risk tier
- **Image Utilities**: Modern file management using expo-file-system v57 API with Directory, File, and Paths classes for directory creation, file operations, and size information
- **Inference Module**: Mock classifier that returns realistic probabilities, ABCD scores, and risk tier mapping

**Section sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)

## Architecture Overview
The camera integration follows a linear user journey with robust error handling and comprehensive user feedback:

1. User opens capture screen; permission hook ensures camera access with proper state management
2. Real-time camera preview with sophisticated framing guides and instructions helps position the lesion
3. Shutter triggers capture with optimized quality settings (0.8 quality, EXIF data preservation); navigation moves to review
4. Review screen validates image quality and offers analysis with loading states and progress indication
5. Inference runs (currently mock) and navigates to result screen
6. Result screen presents diagnosis, confidence, ABCD scores, and risk tier with clinical guidance

```mermaid
sequenceDiagram
participant U as "User"
participant C as "Capture Screen"
participant P as "useCameraPermissions"
participant R as "Review Screen"
participant I as "runInference"
participant J as "Result Screen"
U->>C : Open capture
C->>P : Check/request permission
P-->>C : Status (granted/denied/undetermined)
U->>C : Tap shutter with CameraView
C->>R : Navigate with captured image URI
U->>R : Tap "Use Image & Analyze"
R->>I : runInference(imageUri)
I-->>R : InferenceResult
R->>J : Navigate with result
J-->>U : Display diagnosis & ABCD
```

**Diagram sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)

## Detailed Component Analysis

### Camera Permission Hook
The useCameraPermissions hook provides cross-platform camera permission management with appropriate fallbacks for different environments:

- **Purpose**: Manage camera permission lifecycle with cross-platform support and provide a unified API for requesting access
- **Behavior**: On web/platforms without native camera, assumes granted; otherwise integrates with expo-camera's useCameraPermissions for native permission handling
- **State Management**: Tracks status (granted/denied/undetermined) and loading state during permission requests
- **Integration**: Used by capture screen to gate camera features and guide users through permission flow with appropriate UI states

```mermaid
flowchart TD
Start(["Hook Init"]) --> CheckPlatform{"Platform is web?"}
CheckPlatform --> |Yes| SetGranted["Set status=granted"]
CheckPlatform --> |No| UseExpo["useExpoCameraPermissions()"]
UseExpo --> MapStatus["Map to {granted, denied, undetermined}"]
MapStatus --> End(["Return {status, isLoading, requestPermission}"])
SetGranted --> End
```

**Diagram sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)

**Section sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)

### Capture Screen
The capture screen implements a comprehensive camera interface with professional-grade features:

- **Purpose**: Guided lesion capture with real-time camera preview, sophisticated framing guides, and comprehensive controls
- **Key Features**:
  - Live CameraView with real-time preview and hardware acceleration
  - Sophisticated framing guide with corner brackets and center crosshair for precise lesion positioning
  - Instruction overlay advising proper positioning and lighting conditions
  - Flash mode toggling (off/on/auto) with visual indicator showing current mode
  - Front/back camera switching with smooth transitions
  - Shutter button with loading state and capture animation
  - Expandable tips panel providing quick guidance on capturing clear images
  - Comprehensive error handling for capture failures with user-friendly messages
- **Navigation**: On successful capture, navigates to review screen with image URI and patient ID parameters

```mermaid
flowchart TD
Enter(["Open Capture"]) --> CheckPerm{"Permission Status"}
CheckPerm --> |Undetermined| ShowRequest["Show permission request UI"]
CheckPerm --> |Denied| ShowError["Show denial message"]
CheckPerm --> |Granted| ShowCamera["Show CameraView with preview"]
ShowCamera --> Controls["Flash/Camera Toggle Controls"]
Controls --> Guide["Framing Guide Overlay"]
Guide --> UserAction{"User taps shutter?"}
UserAction --> |Yes| Capture["cameraRef.takePictureAsync()"]
Capture --> Navigate["Navigate to Review"]
UserAction --> |No| Adjust["Adjust position/lighting"]
Adjust --> Guide
```

**Diagram sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)

**Section sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)

### Review Screen
The review screen provides image validation and analysis initiation:

- **Purpose**: Allow users to verify image quality and proceed to analysis or retake
- **Features**:
  - Actual captured image display with proper sizing and aspect ratio
  - Quality indicator with visual feedback and descriptive text
  - Tips for better results including natural light, focus, and full lesion capture guidance
  - Loading states during analysis with progress indication and user feedback
  - Actions: "Use Image & Analyze" and "Retake Photo" with appropriate styling
- **Workflow**: Calls inference module and navigates to result screen with inference data and image URI

```mermaid
sequenceDiagram
participant U as "User"
participant Rev as "Review Screen"
participant Inf as "runInference"
participant Res as "Result Screen"
U->>Rev : View captured image
U->>Rev : Tap "Use Image & Analyze"
Rev->>Inf : runInference(imageUri)
Inf-->>Rev : InferenceResult
Rev->>Res : Navigate with result params
Res-->>U : Display diagnosis & ABCD
```

**Diagram sources**
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)

**Section sources**
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)

### Result Screen
The result screen presents comprehensive diagnosis information with clinical context:

- **Purpose**: Present diagnosis, confidence, class probabilities, ABCD explainability, and recommended action based on risk tier
- **Features**:
  - Disclaimer emphasizing screening nature and need for specialist consultation
  - Risk tier badge with color-coded severity and action guidance
  - Class probability list showing all possible diagnoses with confidence levels
  - ABCD panel for transparency into model reasoning
  - Actions to save result or start new assessment
  - Proper parameter parsing for result data and patient context
- **Clinical Integration**: Maps model outputs to clinically meaningful risk tiers with appropriate action items

```mermaid
classDiagram
class ResultScreen {
+displayDisclaimer()
+showRiskTier(riskTier)
+renderClassProbabilities(probs)
+renderABCDPanel(scores)
+navigateToNewAssessment()
}
```

**Diagram sources**
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)

**Section sources**
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)

### Image Utilities
The image utilities provide modern file management using expo-file-system v57 API:

- **Purpose**: Manage local storage for captured images with modern Directory, File, and Paths API
- **Functions**:
  - `ensureImageDirectory`: Creates app-private directory for images using Directory and Paths classes with intermediate directory support
  - `saveImageLocally`: Copies captured image to private storage using File.copy() method with unique naming
  - `deleteLocalImage`: Removes stored image using File.delete() with existence checking
  - `getFileSizeKB`: Returns file size using File.info() for display or analytics purposes
- **Modern API Benefits**: Type-safe file operations, improved performance, and better memory management compared to legacy API

```mermaid
flowchart TD
Start(["Image Operation"]) --> EnsureDir["ensureImageDirectory()"]
EnsureDir --> CreateDir["new Directory(Paths.document, IMAGE_DIR_NAME)"]
CreateDir --> CheckExists{"dir.exists?"}
CheckExists --> |No| Create["dir.create({ intermediates: true })"]
CheckExists --> |Yes| Save["saveImageLocally(sourceUri, id)"]
Create --> Save
Save --> CopyFile["new File(sourceUri).copy(new File(dir, filename))"]
CopyFile --> ReturnURI["Return dest.uri"]
ReturnURI --> End(["Done"])
```

**Diagram sources**
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)

**Section sources**
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)

### Inference Module
The inference module provides classification results for captured images:

- **Purpose**: Provide classification results for captured images (currently mock implementation)
- **Behavior**:
  - Simulates processing delay for realistic user experience
  - Generates normalized probabilities across model labels
  - Computes ABCD scores and maps predicted class to risk tier
  - Exposes helper function to check model availability
- **Production Readiness**: Designed for easy replacement with TFLite model integration

```mermaid
flowchart TD
Start(["runInference(imageUri)"]) --> Delay["Simulate delay"]
Delay --> Probs["Generate normalized probabilities"]
Probs --> Predict["Find max probability class"]
Predict --> ABCD["Compute ABCD scores"]
ABCD --> Risk["Map to risk tier"]
Risk --> Return["Return InferenceResult"]
```

**Diagram sources**
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)

**Section sources**
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)

## Dependency Analysis
Key dependencies and relationships within the camera integration system:

- **Capture Screen**: Depends on routing and UI components; integrates with permission hook for camera access and uses expo-camera for live preview
- **Review Screen**: Depends on inference module and navigation to result screen
- **Result Screen**: Depends on constants for risk mapping and ABCD panel component
- **Image Utilities**: Uses expo-file-system v57 API with Directory, File, and Paths classes for modern file management
- **Inference Module**: Uses model labels and risk level mappings for classification

```mermaid
graph LR
Capture["capture.tsx"] --> Permissions["useCameraPermissions.ts"]
Capture --> ExpoCamera["expo-camera ~57.0.4"]
Capture --> Review["review.tsx"]
Review --> Inference["classify.ts"]
Review --> Result["result.tsx"]
Result --> Risk["riskLevels.ts"]
Result --> ABCD["ABCDPanel.tsx"]
Capture --> Images["image.ts"]
Images --> FileSystem["expo-file-system ^57.0.6"]
Inference --> Labels["ml/labels.ts"]
```

**Diagram sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)
- [package.json:15-18](file://package.json#L15-L18)

**Section sources**
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [result.tsx:1-148](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L148)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [package.json:15-18](file://package.json#L15-L18)

## Performance Considerations
- **Camera Preview**: Uses expo-camera's optimized CameraView component with hardware-accelerated rendering for smooth frame rates
- **Image Capture**: Configured with 0.8 quality setting and EXIF data preservation for optimal balance between quality and performance
- **Memory Management**: Proper cleanup of camera resources after capture; avoid retaining large image buffers in memory
- **Storage**: Store images in app-private directories using modern Directory/File API to minimize overhead and ensure fast access; consider compression before upload to reduce bandwidth
- **Inference**: Batch preprocessing steps and leverage device-specific accelerators when integrating real models; keep UI responsive with progress indicators
- **File Operations**: Modern expo-file-system v57 API provides better performance and type safety for file operations

## Troubleshooting Guide
Common issues and resolutions:

- **Camera Unavailable**: If platform lacks camera support or permissions are denied, show informative messages and guide users to settings to enable camera access
- **Permission Denied**: Persist denial state and offer retry flow; on web, assume granted for development but warn about limitations
- **Capture Failures**: Handle exceptions during photo capture with user-friendly error messages and retry options
- **Image Storage Errors**: Handle filesystem errors gracefully using modern Directory/File API; fallback to temporary storage if necessary and notify users
- **Inference Failures**: Catch exceptions during analysis; provide retry option and log errors for diagnostics

**Section sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [capture.tsx:1-248](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L248)
- [review.tsx:1-152](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L152)
- [image.ts:1-59](file://src/utils/image.ts#L1-L59)

## Conclusion
DermSight's camera integration provides a production-ready, user-friendly workflow for capturing lesion images with real-time preview, sophisticated framing guides, and comprehensive permission handling. The system leverages expo-camera for native camera access while maintaining a clean abstraction layer through the useCameraPermissions hook. The recent migration to expo-file-system v57 API with Directory, File, and Paths classes provides improved file management capabilities and better performance. The design emphasizes clarity, accessibility, and reliability to support healthcare workers in diverse environments, with robust error handling and user feedback throughout the capture and analysis workflow.

## Appendices

### Cross-Platform Compatibility Notes
- **iOS/Android**: Uses expo-camera for native camera access with proper permission handling aligned with platform requirements
- **Web**: Continues assuming granted for development; informs users of limited functionality and encourages mobile use for clinical workflows
- **Permission States**: Consistent handling of undetermined/denied/granted states across all platforms with appropriate UI feedback

### Accessibility Considerations
- **High Contrast**: Framing guides and overlays remain visible under various lighting conditions with appropriate contrast ratios
- **VoiceOver/TalkBack**: All interactive elements (shutter, tips, buttons) are properly labeled for screen readers
- **Lighting Guidance**: Clear instructions provided to improve image quality in low-light scenarios with practical tips
- **Touch Targets**: All interactive elements meet minimum touch target sizes for accessibility compliance

### Implementation Examples

#### Camera Permission Management
The useCameraPermissions hook provides consistent permission handling across platforms:

```typescript
// Platform-aware permission handling
if (Platform.OS === "web") {
  return {
    status: "granted",
    isLoading: false,
    requestPermission: async () => true,
  };
}
```

#### Real-time Camera Capture
The capture screen implements proper camera lifecycle management:

```typescript
const handleCapture = async () => {
  const photo = await cameraRef.current.takePictureAsync({
    quality: 0.8,
    skipProcessing: false,
    exif: true,
  });
};
```

#### Modern File Management with expo-file-system v57
The image utilities demonstrate the new API usage:

```typescript
// Using Directory, File, and Paths classes
const dir = new Directory(Paths.document, IMAGE_DIR_NAME);
if (!dir.exists) {
  dir.create({ intermediates: true });
}
const source = new File(sourceUri);
const dest = new File(dir, `${assessmentId}.jpg`);
await source.copy(dest);
```

#### Image Review and Validation
The review screen handles both successful captures and fallback scenarios:

```typescript
{imageUri ? (
  <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
) : (
  <View className="flex-1 items-center justify-center">
    {/* Fallback placeholder */}
  </View>
)}
```
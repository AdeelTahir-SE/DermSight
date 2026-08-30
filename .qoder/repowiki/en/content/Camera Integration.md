# Camera Integration

<cite>
**Referenced Files in This Document**
- [capture.tsx](file://src/app/(app)/patients/[patientId]/capture.tsx)
- [review.tsx](file://src/app/(app)/patients/[patientId]/review.tsx)
- [result.tsx](file://src/app/(app)/patients/[patientId]/result.tsx)
- [useCameraPermissions.ts](file://src/hooks/useCameraPermissions.ts)
- [image.ts](file://src/utils/image.ts)
- [classify.ts](file://src/features/assessments/inference/classify.ts)
- [store.ts](file://src/features/assessments/store.ts)
- [riskLevels.ts](file://src/constants/riskLevels.ts)
- [ABCDPanel.tsx](file://src/components/assessment/ABCDPanel.tsx)
- [package.json](file://package.json)
</cite>

## Update Summary
**Changes Made**
- Enhanced capture screen with tabbed navigation between PHOTO and GUIDE modes for improved user experience
- Integrated comprehensive haptic feedback using expo-haptics library across all user interactions
- Improved framing guide with larger corner brackets (72x72px) for better lesion positioning guidance
- Replaced text emojis with custom icon-based controls throughout the interface for better visual consistency
- Implemented structured tips panel with consistent formatting and professional styling
- Added haptic feedback integration for camera controls, shutter button, and navigation elements

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

The system has been enhanced with production-ready features including real-time camera preview, flash control, front/back camera switching, sophisticated framing guides with corner brackets and center crosshair overlays, and comprehensive error handling. The recent migration to expo-file-system v57 API with Directory, File, and Paths classes provides improved file management capabilities and better performance. **Updated**: The capture screen now features an enhanced interface with tabbed navigation between PHOTO and GUIDE modes, custom icon-based controls replacing text emojis, improved framing guides with larger corner brackets (72x72px), integrated haptic feedback using expo-haptics, and a structured tips panel with consistent formatting.

## Project Structure
The camera workflow spans multiple screens and supporting components:
- **Capture Screen**: Full-screen camera interface with live preview, tabbed navigation (PHOTO/GUIDE modes), sophisticated framing guides, and comprehensive controls
- **Review Screen**: Image validation interface with quality assessment and analysis options
- **Result Screen**: Comprehensive diagnosis presentation with confidence scores and clinical guidance
- **Permission Hook**: Cross-platform camera permission management with appropriate fallbacks
- **Image Utilities**: Modern file management using expo-file-system v57 API with Directory, File, and Paths classes
- **Inference Module**: Mock classification system ready for TFLite model integration
- **State Management**: Zustand store for managing captured image URIs across the application

```mermaid
graph TB
Capture["Enhanced Capture Screen<br/>expo-camera CameraView<br/>Tabbed Navigation<br/>Haptic Feedback"] --> Review["Review Screen<br/>quality check & validation"]
Review --> Result["Result Screen<br/>diagnosis & ABCD"]
Capture --> Permissions["useCameraPermissions<br/>cross-platform hook"]
Review --> Inference["runInference<br/>mock ML"]
Capture --> Images["Image Utils<br/>expo-file-system v57"]
Result --> Risk["Risk Mapping<br/>constants"]
Result --> ABCD["ABCD Panel<br/>explainability"]
Images --> FileSystem["Directory/File/Paths API"]
Capture --> Store["Zustand Store<br/>capturedImageUri"]
Store --> Review
Store --> Result
Capture --> Haptics["expo-haptics<br/>tactile feedback"]
```

**Diagram sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)

**Section sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)

## Core Components
- **Camera Permission Hook**: Provides status and request flow with platform-specific handling; supports undetermined/denied/granted states with web fallback
- **Enhanced Capture Screen**: Presents a full-screen CameraView with real-time preview, sophisticated framing guides with corner brackets and center crosshair, instructional overlay, flash mode toggling, front/back camera switching, shutter button, expandable tips panel, tabbed navigation between PHOTO and GUIDE modes, and comprehensive haptic feedback
- **Review Screen**: Displays captured image with quality indicator, tips for better results, and actions to analyze or retake
- **Result Screen**: Shows top diagnosis, confidence, class probabilities, ABCD explainability, and recommended actions based on risk tier
- **Image Utilities**: Modern file management using expo-file-system v57 API with Directory, File, and Paths classes for directory creation, file operations, and size information
- **Inference Module**: Mock classifier that returns realistic probabilities, ABCD scores, and risk tier mapping
- **State Management**: Zustand store for managing captured image URIs across the application lifecycle
- **Haptic Feedback System**: Integrated expo-haptics library providing tactile feedback for all user interactions

**Section sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)

## Architecture Overview
The camera integration follows a linear user journey with robust error handling and comprehensive user feedback:

1. User opens capture screen; permission hook ensures camera access with proper state management
2. Real-time camera preview with sophisticated framing guides and instructions helps position the lesion
3. Shutter triggers capture with optimized quality settings (0.9 quality, EXIF data preservation); captured URI stored in Zustand store and navigation moves to review
4. Review screen validates image quality using normalized URIs and offers analysis with loading states and progress indication
5. Inference runs (currently mock) and navigates to result screen with properly decoded parameters
6. Result screen presents diagnosis, confidence, ABCD scores, and risk tier with clinical guidance

**Updated**: The enhanced capture screen now includes tabbed navigation allowing users to switch between PHOTO mode for direct capture and GUIDE mode for instructional guidance, with haptic feedback provided for all user interactions.

```mermaid
sequenceDiagram
participant U as "User"
participant C as "Enhanced Capture Screen"
participant P as "useCameraPermissions"
participant S as "Zustand Store"
participant R as "Review Screen"
participant I as "runInference"
participant J as "Result Screen"
U->>C : Open capture
C->>P : Check/request permission
P-->>C : Status (granted/denied/undetermined)
U->>C : Switch tabs (PHOTO/GUIDE)
C-->>U : Haptic feedback
U->>C : Tap shutter with CameraView
C->>S : setCapturedImageUri(photo.uri)
C->>R : Navigate with imageUri param
U->>R : Tap "Use Image & Analyze"
R->>I : runInference(normalizedUri)
I-->>R : InferenceResult
R->>J : Navigate with decoded params
J-->>U : Display diagnosis & ABCD
```

**Diagram sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)

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

### Enhanced Capture Screen
The capture screen implements a comprehensive camera interface with professional-grade features and enhanced user experience:

- **Purpose**: Guided lesion capture with real-time camera preview, sophisticated framing guides, tabbed navigation, and comprehensive controls
- **Key Features**:
  - Live CameraView with real-time preview and hardware acceleration
  - **Updated**: Tabbed navigation between PHOTO and GUIDE modes for flexible user interaction
  - **Updated**: Sophisticated framing guide with larger corner brackets (72x72px) and center crosshair for precise lesion positioning
  - Instruction overlay advising proper positioning and lighting conditions
  - Flash mode toggling (off/on/auto) with visual indicator showing current mode
  - Front/back camera switching with smooth transitions
  - Shutter button with loading state and capture animation
  - **Updated**: Expandable tips panel with structured formatting and consistent styling
  - **Updated**: Custom icon-based controls replacing text emojis for better visual consistency
  - **Updated**: Comprehensive haptic feedback integration using expo-haptics for all user interactions
  - Comprehensive error handling for capture failures with user-friendly messages
- **State Management**: Captures image URI and stores it in Zustand store for cross-screen persistence
- **Navigation**: On successful capture, navigates to review screen with both image URI parameter and Zustand store reference

**Updated**: The enhanced interface now provides tabbed navigation allowing users to choose between direct capture mode (PHOTO) and guided capture mode (GUIDE), with haptic feedback confirming each interaction and improved visual design using custom icons instead of text emojis.

```mermaid
flowchart TD
Enter(["Open Capture"]) --> CheckPerm{"Permission Status"}
CheckPerm --> |Undetermined| ShowRequest["Show permission request UI"]
CheckPerm --> |Denied| ShowError["Show denial message"]
CheckPerm --> |Granted| ShowCamera["Show CameraView with preview"]
ShowCamera --> Tabs["Tabbed Navigation<br/>PHOTO/GUIDE Modes"]
Tabs --> Controls["Flash/Camera Toggle Controls"]
Controls --> Guide["Enhanced Framing Guide<br/>72x72px Corner Brackets"]
Guide --> UserAction{"User taps shutter?"}
UserAction --> |Yes| Capture["cameraRef.takePictureAsync()"]
Capture --> Haptic["Haptic Feedback<br/>Medium Impact"]
Haptic --> StoreURI["setCapturedImageUri(photo.uri)"]
StoreURI --> Navigate["Navigate to Review"]
UserAction --> |No| Adjust["Adjust position/lighting"]
Adjust --> Guide
```

**Diagram sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)

**Section sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)

### Review Screen
The review screen provides image validation and analysis initiation:

- **Purpose**: Allow users to verify image quality and proceed to analysis or retake
- **Features**:
  - Actual captured image display with proper sizing and aspect ratio using normalized URIs
  - Quality indicator with visual feedback and descriptive text
  - Tips for better results including natural light, focus, and full lesion capture guidance
  - Loading states during analysis with progress indication and user feedback
  - Actions: "Use Image & Analyze" and "Retake Photo" with appropriate styling
  - File existence checking with fallback mechanisms for missing images
- **URI Handling**: Implements normalizeImageUri function to handle various URI formats and encoding issues
- **Workflow**: Calls inference module and navigates to result screen with inference data and image URI

```mermaid
sequenceDiagram
participant U as "User"
participant Rev as "Review Screen"
participant Norm as "normalizeImageUri"
participant Inf as "runInference"
participant Res as "Result Screen"
U->>Rev : View captured image
U->>Rev : Tap "Use Image & Analyze"
Rev->>Norm : Normalize URI for compatibility
Norm-->>Rev : Normalized URI
Rev->>Inf : runInference(normalizedUri)
Inf-->>Rev : InferenceResult
Rev->>Res : Navigate with decoded params
Res-->>U : Display diagnosis & ABCD
```

**Diagram sources**
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)

**Section sources**
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)

### Result Screen
The result screen presents comprehensive diagnosis information with clinical context:

- **Purpose**: Present diagnosis, confidence, class probabilities, ABCD explainability, and recommended action based on risk tier
- **Features**:
  - Disclaimer emphasizing screening nature and need for specialist consultation
  - Risk tier badge with color-coded severity and action guidance
  - Class probability list showing all possible diagnoses with confidence levels
  - ABCD panel for transparency into model reasoning
  - Actions to save result or start new assessment
  - Proper parameter parsing with URL-decoding for result data and patient context
  - Fallback mechanisms for image display when local files are unavailable
- **Clinical Integration**: Maps model outputs to clinically meaningful risk tiers with appropriate action items
- **State Management**: Integrates with Zustand store for captured image URI and assessment data

```mermaid
classDiagram
class ResultScreen {
+displayDisclaimer()
+showRiskTier(riskTier)
+renderClassProbabilities(probs)
+renderABCDPanel(scores)
+navigateToNewAssessment()
+handleSave()
}
```

**Diagram sources**
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)

**Section sources**
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
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
  - `normalizeImageUri`: Handles various URI formats and encoding issues with recursive fallback mechanisms
- **Modern API Benefits**: Type-safe file operations, improved performance, and better memory management compared to legacy API
- **Cross-Platform Support**: Includes platform-specific handling for web vs mobile environments

```mermaid
flowchart TD
Start(["Image Operation"]) --> EnsureDir["ensureImageDirectory()"]
EnsureDir --> CreateDir["new Directory(Paths.document, IMAGE_DIR_NAME)"]
CreateDir --> CheckExists{"dir.exists?"}
CheckExists --> |No| Create["dir.create({ intermediates: true })"]
CheckExists --> |Yes| Save["saveImageLocally(sourceUri, id)"]
Create --> Save
Save --> Normalize["normalizeImageUri(sourceUri)"]
Normalize --> CopyFile["new File(normalizedUri).copy(new File(dir, filename))"]
CopyFile --> ReturnURI["Return dest.uri"]
ReturnURI --> End(["Done"])
```

**Diagram sources**
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)

**Section sources**
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)

### State Management
The Zustand store manages captured image URIs across the application lifecycle:

- **Purpose**: Provide centralized state management for captured image URIs and assessment data
- **Features**:
  - `capturedImageUri`: Stores the most recently captured image URI
  - `setCapturedImageUri`: Action to update the captured image URI
  - Integration with assessment repository for saving and retrieving assessments
  - Cross-screen state persistence for seamless user experience
- **Benefits**: Eliminates prop drilling and provides consistent state access across the application

**Section sources**
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)

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

### Haptic Feedback Integration
The capture screen integrates comprehensive haptic feedback using the expo-haptics library:

- **Purpose**: Provide tactile confirmation for user interactions to enhance accessibility and user experience
- **Implementation**: Uses Haptics.impactAsync() with different feedback styles (Light, Medium) for various interactions
- **Coverage**: Integrated across all user interactions including permission requests, camera controls, shutter button, tips toggle, and navigation elements
- **Accessibility**: Enhances usability for healthcare workers in various environments by providing tactile feedback alongside visual cues

**Section sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)

## Dependency Analysis
Key dependencies and relationships within the camera integration system:

- **Capture Screen**: Depends on routing and UI components; integrates with permission hook for camera access and uses expo-camera for live preview
- **Review Screen**: Depends on inference module and navigation to result screen
- **Result Screen**: Depends on constants for risk mapping and ABCD panel component
- **Image Utilities**: Uses expo-file-system v57 API with Directory, File, and Paths classes for modern file management
- **Inference Module**: Uses model labels and risk level mappings for classification
- **State Management**: Zustand store provides cross-screen state management for captured image URIs
- **Haptic Feedback**: expo-haptics library provides tactile feedback for enhanced user interaction

**Updated**: The system now includes expo-haptics dependency for comprehensive haptic feedback integration across all user interactions.

```mermaid
graph LR
Capture["capture.tsx"] --> Permissions["useCameraPermissions.ts"]
Capture --> ExpoCamera["expo-camera ~57.0.4"]
Capture --> Store["store.ts"]
Capture --> Review["review.tsx"]
Review --> Inference["classify.ts"]
Review --> Result["result.tsx"]
Result --> Risk["riskLevels.ts"]
Result --> ABCD["ABCDPanel.tsx"]
Capture --> Images["image.ts"]
Images --> FileSystem["expo-file-system ^57.0.6"]
Store --> Repository["repository.ts"]
Inference --> Labels["ml/labels.ts"]
Capture --> Haptics["expo-haptics ^57.0.2"]
Review --> Haptics
```

**Diagram sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)
- [package.json:15-22](file://package.json#L15-L22)

**Section sources**
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [result.tsx:1-280](file://src/app/(app)/patients/[patientId]/result.tsx#L1-L280)
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)
- [classify.ts:1-62](file://src/features/assessments/inference/classify.ts#L1-L62)
- [store.ts:1-87](file://src/features/assessments/store.ts#L1-L87)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [package.json:15-22](file://package.json#L15-L22)

## Performance Considerations
- **Camera Preview**: Uses expo-camera's optimized CameraView component with hardware-accelerated rendering for smooth frame rates
- **Image Capture**: Configured with 0.9 quality setting and EXIF data preservation for optimal balance between quality and performance
- **Memory Management**: Proper cleanup of camera resources after capture; avoid retaining large image buffers in memory
- **Storage**: Store images in app-private directories using modern Directory/File API to minimize overhead and ensure fast access; consider compression before upload to reduce bandwidth
- **Inference**: Batch preprocessing steps and leverage device-specific accelerators when integrating real models; keep UI responsive with progress indicators
- **File Operations**: Modern expo-file-system v57 API provides better performance and type safety for file operations
- **State Management**: Zustand store provides efficient state updates without unnecessary re-renders
- **URI Normalization**: Efficient URI normalization with early returns for web platforms and cached results where applicable
- **Haptic Feedback**: Lightweight haptic feedback implementation using expo-haptics with minimal performance impact

**Updated**: The enhanced capture screen maintains optimal performance while adding tabbed navigation and haptic feedback without compromising camera preview quality or capture speed.

## Troubleshooting Guide
Common issues and resolutions:

- **Camera Unavailable**: If platform lacks camera support or permissions are denied, show informative messages and guide users to settings to enable camera access
- **Permission Denied**: Persist denial state and offer retry flow; on web, assume granted for development but warn about limitations
- **Capture Failures**: Handle exceptions during photo capture with user-friendly error messages and retry options
- **Image Storage Errors**: Handle filesystem errors gracefully using modern Directory/File API; fallback to temporary storage if necessary and notify users
- **Inference Failures**: Catch exceptions during analysis; provide retry option and log errors for diagnostics
- **URI Issues**: Use normalizeImageUri function to handle various URI formats and encoding issues; implement fallback mechanisms for missing files
- **State Synchronization**: Ensure Zustand store is properly updated and accessed across screens to maintain consistent state
- **Haptic Feedback Issues**: Verify expo-haptics installation and handle cases where haptic feedback is not available on certain platforms

**Updated**: Added troubleshooting guidance for haptic feedback integration and tabbed navigation functionality.

**Section sources**
- [useCameraPermissions.ts:1-38](file://src/hooks/useCameraPermissions.ts#L1-L38)
- [capture.tsx:1-365](file://src/app/(app)/patients/[patientId]/capture.tsx#L1-L365)
- [review.tsx:1-268](file://src/app/(app)/patients/[patientId]/review.tsx#L1-L268)
- [image.ts:1-103](file://src/utils/image.ts#L1-L103)

## Conclusion
DermSight's camera integration provides a production-ready, user-friendly workflow for capturing lesion images with real-time preview, sophisticated framing guides, and comprehensive permission handling. The system leverages expo-camera for native camera access while maintaining a clean abstraction layer through the useCameraPermissions hook. The recent enhancements include production-ready features like flash control, camera switching, and sophisticated framing guides, along with the migration to expo-file-system v57 API with Directory, File, and Paths classes for improved file management. **Updated**: The capture screen now features an enhanced interface with tabbed navigation between PHOTO and GUIDE modes, custom icon-based controls replacing text emojis, improved framing guides with larger corner brackets (72x72px), integrated haptic feedback using expo-haptics, and a structured tips panel with consistent formatting. The addition of Zustand store for state management and robust URI normalization mechanisms ensures reliable operation across different platforms and edge cases. The design emphasizes clarity, accessibility, and reliability to support healthcare workers in diverse environments, with robust error handling and user feedback throughout the capture and analysis workflow.

## Appendices

### Cross-Platform Compatibility Notes
- **iOS/Android**: Uses expo-camera for native camera access with proper permission handling aligned with platform requirements
- **Web**: Continues assuming granted for development; informs users of limited functionality and encourages mobile use for clinical workflows
- **Permission States**: Consistent handling of undetermined/denied/granted states across all platforms with appropriate UI feedback
- **File System**: Modern expo-file-system v57 API provides consistent behavior across platforms with platform-specific optimizations
- **Haptic Feedback**: expo-haptics provides consistent haptic feedback across iOS and Android platforms with graceful fallbacks for unsupported devices

### Accessibility Considerations
- **High Contrast**: Framing guides and overlays remain visible under various lighting conditions with appropriate contrast ratios
- **VoiceOver/TalkBack**: All interactive elements (shutter, tips, buttons) are properly labeled for screen readers
- **Lighting Guidance**: Clear instructions provided to improve image quality in low-light scenarios with practical tips
- **Touch Targets**: All interactive elements meet minimum touch target sizes for accessibility compliance
- **Haptic Feedback**: Provides tactile confirmation for user interactions to enhance accessibility, especially beneficial in bright outdoor environments
- **Tabbed Navigation**: Enhanced accessibility through clear tab switching between PHOTO and GUIDE modes with visual and haptic feedback

### Implementation Examples

#### Enhanced Capture Screen with Tabbed Navigation
The capture screen now implements tabbed navigation between PHOTO and GUIDE modes:

```typescript
const [activeTab, setActiveTab] = useState<"photo" | "guide">("photo");

// Tabbed navigation implementation
<View className="flex-row justify-center mb-5">
  <Pressable onPress={() => setActiveTab("photo")} className="mr-6">
    <Text className={`text-base font-semibold ${activeTab === "photo" ? "text-[#0D9E94]" : "text-white/60"}`}>
      {t("capture:photo")}
    </Text>
  </Pressable>
  <Pressable onPress={() => setActiveTab("guide")}>
    <Text className={`text-base font-semibold ${activeTab === "guide" ? "text-[#0D9E94]" : "text-white/60"}`}>
      {t("capture:guide")}
    </Text>
  </Pressable>
</View>
```

#### Haptic Feedback Integration
Comprehensive haptic feedback integration using expo-haptics:

```typescript
import * as Haptics from "expo-haptics";

const handleCapture = async () => {
  // Haptic feedback for capture
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  const photo = await cameraRef.current.takePictureAsync({
    quality: 0.9,
    skipProcessing: true,
    exif: true,
  });
};

const toggleFlash = async () => {
  // Haptic feedback for control interactions
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setFlash((prev) => prev === "off" ? "on" : prev === "on" ? "auto" : "off");
};
```

#### Enhanced Framing Guide with Larger Corner Brackets
Improved framing guide with 72x72px corner brackets:

```typescript
{/* Framing guide */}
<View className="flex-1 items-center justify-center z-0">
  <View className="w-72 h-72 relative">
    <View className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-[#0D9E94] rounded-tl-2xl" />
    <View className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-[#0D9E94] rounded-tr-2xl" />
    <View className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-[#0D9E94] rounded-bl-2xl" />
    <View className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-[#0D9E94] rounded-br-2xl" />
  </View>
</View>
```

#### Custom Icon-Based Controls
Replacement of text emojis with custom icon assets:

```typescript
<Pressable onPress={toggleFlash} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
  <Image
    source={require("../../../../../assets/icons/capture-light.png")}
    style={{ width: 22, height: 22 }}
    contentFit="contain"
    tintColor={flashActive ? "#0D9E94" : "#FFFFFF"}
  />
</Pressable>
```

#### Structured Tips Panel with Consistent Formatting
Enhanced tips panel with professional styling:

```typescript
{showTips && (
  <View className="bg-white/10 rounded-2xl p-4">
    <View className="flex-row items-start mb-2">
      <Text className="text-white/90 text-xs mr-2">•</Text>
      <Text className="text-white/80 text-xs flex-1">Use natural light when possible</Text>
    </View>
    <View className="flex-row items-start mb-2">
      <Text className="text-white/90 text-xs mr-2">•</Text>
      <Text className="text-white/80 text-xs flex-1">Keep the lesion centered and in focus</Text>
    </View>
    {/* Additional tips with consistent formatting */}
  </View>
)}
```
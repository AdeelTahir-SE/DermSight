# UI Components Library

<cite>
**Referenced Files in This Document**
- [Button.tsx](file://src/components/ui/Button.tsx)
- [Input.tsx](file://src/components/ui/Input.tsx)
- [Card.tsx](file://src/components/ui/Card.tsx)
- [Badge.tsx](file://src/components/ui/Badge.tsx)
- [EmptyState.tsx](file://src/components/ui/EmptyState.tsx)
- [ConnectivityBanner.tsx](file://src/components/ui/ConnectivityBanner.tsx)
- [theme.ts](file://src/constants/theme.ts)
- [riskLevels.ts](file://src/constants/riskLevels.ts)
- [tailwind.config.js](file://tailwind.config.js)
- [global.css](file://global.css)
- [ABCDPanel.tsx](file://src/components/assessment/ABCDPanel.tsx)
- [ClassProbabilityList.tsx](file://src/components/assessment/ClassProbabilityList.tsx)
- [RiskTierBadge.tsx](file://src/components/assessment/RiskTierBadge.tsx)
- [PatientListItem.tsx](file://src/components/patient/PatientListItem.tsx)
- [SyncQueueItem.tsx](file://src/components/sync/SyncQueueItem.tsx)
- [useConnectivity.ts](file://src/hooks/useConnectivity.ts)
- [index.ts](file://src/types/index.ts)
- [_layout.tsx](file://src/app/(app)/_layout.tsx)
- [index.tsx](file://src/app/index.tsx)
- [app.json](file://app.json)
</cite>

## Update Summary
**Changes Made**
- Updated tab navigation system with dedicated PNG icon files replacing emoji-based icons
- Enhanced splash screen with improved image rendering and custom PNG integration
- Added FeatureCard and PermissionRow components with proper image handling
- Integrated automated icon processing for consistent visual appearance across platforms
- Updated app configuration for enhanced splash screen and adaptive icons

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Icon System and Asset Management
7. Dependency Analysis
8. Performance Considerations
9. Troubleshooting Guide
10. Conclusion
11. Appendices

## Introduction
This document describes DermSight's reusable UI component library built with React Native, NativeWind, and Tailwind CSS. It covers each component's visual appearance, behavior, props, customization options, styling guidelines, theme configuration, responsive design principles, states, animations/transitions, accessibility, composition patterns, prop validation, error handling, cross-platform considerations, performance optimization, testing approaches, and guidance for extending or creating new components. The library now features a comprehensive PNG icon system replacing emoji-based icons for better visual consistency and platform compatibility.

## Project Structure
The UI library is organized under src/components/ui for base primitives and feature-specific components under src/components/assessment, src/components/patient, and src/components/sync. Styling is centralized via Tailwind configuration and global CSS, while shared tokens live in constants. The icon system has been enhanced with dedicated PNG assets in the assets/icons directory and bottom-tab-icons for optimized tab navigation.

```mermaid
graph TB
subgraph "UI Primitives"
B["Button.tsx"]
I["Input.tsx"]
C["Card.tsx"]
BD["Badge.tsx"]
ES["EmptyState.tsx"]
CB["ConnectivityBanner.tsx"]
end
subgraph "Feature Components"
ABCD["ABCDPanel.tsx"]
CPL["ClassProbabilityList.tsx"]
RTB["RiskTierBadge.tsx"]
PLI["PatientListItem.tsx"]
SQI["SyncQueueItem.tsx"]
FC["FeatureCard.tsx"]
PR["PermissionRow.tsx"]
end
subgraph "Icon System"
TI["Tab Icons"]
FI["Feature Icons"]
SI["Splash Icons"]
end
subgraph "Styling & Tokens"
TW["tailwind.config.js"]
GCSS["global.css"]
TH["theme.ts"]
RL["riskLevels.ts"]
end
subgraph "Hooks & Types"
UC["useConnectivity.ts"]
TYP["types/index.ts"]
end
B --> TW
I --> TW
C --> TW
BD --> RL
ES --> TW
CB --> UC
ABCD --> RL
CPL --> RL
RTB --> RL
PLI --> BD
SQI --> TYP
CB --> GCSS
TW --> GCSS
TI --> FC
FI --> PR
SI --> ES
```

**Diagram sources**
- [Button.tsx:1-101](file://src/components/ui/Button.tsx#L1-L101)
- [Input.tsx:1-90](file://src/components/ui/Input.tsx#L1-L90)
- [Card.tsx:1-30](file://src/components/ui/Card.tsx#L1-L30)
- [Badge.tsx:1-71](file://src/components/ui/Badge.tsx#L1-L71)
- [EmptyState.tsx:1-36](file://src/components/ui/EmptyState.tsx#L1-L36)
- [ConnectivityBanner.tsx:1-30](file://src/components/ui/ConnectivityBanner.tsx#L1-L30)
- [ABCDPanel.tsx:1-68](file://src/components/assessment/ABCDPanel.tsx#L1-L68)
- [ClassProbabilityList.tsx:1-83](file://src/components/assessment/ClassProbabilityList.tsx#L1-L83)
- [RiskTierBadge.tsx:1-40](file://src/components/assessment/RiskTierBadge.tsx#L1-L40)
- [PatientListItem.tsx:1-52](file://src/components/patient/PatientListItem.tsx#L1-L52)
- [SyncQueueItem.tsx:1-55](file://src/components/sync/SyncQueueItem.tsx#L1-L55)
- [_layout.tsx:11-34](file://src/app/(app)/_layout.tsx#L11-L34)
- [index.tsx:197-248](file://src/app/index.tsx#L197-L248)
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [global.css:1-4](file://global.css#L1-L4)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [useConnectivity.ts:1-18](file://src/hooks/useConnectivity.ts#L1-L18)
- [index.ts:1-98](file://src/types/index.ts#L1-L98)

**Section sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [global.css:1-4](file://global.css#L1-L4)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)

## Core Components
This section documents the base UI primitives used across the app.

- Button
  - Visuals: Rounded container with primary, secondary, outline, and danger variants; sizes sm/md/lg; optional leading/trailing icons; full-width mode; loading state shows spinner.
  - Behavior: Pressable with disabled/loading states; text color adapts to variant; spinner color adapts to variant.
  - Props: title, onPress, variant, size, disabled, loading, icon, iconRight, style, fullWidth.
  - Customization: Use variant and size for quick styles; pass style for overrides; use fullWidth for layout control.
  - Accessibility: Uses native Pressable semantics; ensure accessible labels when using custom icons.
  - Example usage pattern: See [Button.tsx:14-101](file://src/components/ui/Button.tsx#L14-L101).

- Input
  - Visuals: Label above a bordered container with optional left/right icons; focus border uses primary; error state uses red border and message below.
  - Behavior: Controlled value via value/onChangeText; optional secure text toggle; supports keyboard types and auto capitalize; multiline support with min height.
  - Props: label, placeholder, value, onChangeText, icon, error, secureTextEntry, keyboardType, autoCapitalize, multiline, numberOfLines, editable, rightIcon.
  - Customization: Compose with icons; adjust colors via theme; extend with additional input modes if needed.
  - Accessibility: Provide label; ensure error messages are announced by screen readers (native TextInput handles this).
  - Example usage pattern: See [Input.tsx:8-90](file://src/components/ui/Input.tsx#L8-L90).

- Card
  - Visuals: White rounded container with subtle shadow and border; optional padding.
  - Behavior: Simple container; accepts className and style for further customization.
  - Props: children, style, className, padded.
  - Customization: Override className/style; remove padding by setting padded false.
  - Example usage pattern: See [Card.tsx:8-30](file://src/components/ui/Card.tsx#L8-L30).

- Badge
  - Risk tier badge: Color-coded pill based on risk level configuration; sizes sm/md/lg.
  - Status badge: Small pill indicating synced/pending/failed with distinct colors.
  - Props: riskTier + size; status + size.
  - Customization: Extend RISK_TIER_CONFIG or status config to add new tiers/statuses.
  - Example usage pattern: See [Badge.tsx:9-71](file://src/components/ui/Badge.tsx#L9-L71).

- EmptyState
  - Visuals: Centered content area with optional icon, title, description, and action slot.
  - Behavior: Displays empty list/message; action slot allows embedding buttons or links.
  - Props: icon, title, description, action.
  - Example usage pattern: See [EmptyState.tsx:8-36](file://src/components/ui/EmptyState.tsx#L8-L36).

- ConnectivityBanner
  - Visuals: Amber banner shown when offline; includes icon, short message, and explanatory text.
  - Behavior: Subscribes to connectivity hook; renders only when offline.
  - Props: None (uses internal hook).
  - Example usage pattern: See [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30).

**Section sources**
- [Button.tsx:14-101](file://src/components/ui/Button.tsx#L14-L101)
- [Input.tsx:8-90](file://src/components/ui/Input.tsx#L8-L90)
- [Card.tsx:8-30](file://src/components/ui/Card.tsx#L8-L30)
- [Badge.tsx:9-71](file://src/components/ui/Badge.tsx#L9-L71)
- [EmptyState.tsx:8-36](file://src/components/ui/EmptyState.tsx#L8-L36)
- [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30)

## Architecture Overview
The UI layer composes primitives into feature components. Styling is driven by Tailwind classes configured in tailwind.config.js and extended via global CSS. Shared tokens (colors, fonts, spacing) are defined in theme.ts and consumed by both Tailwind and components. Data-driven components like badges and panels rely on constants from riskLevels.ts and types from index.ts. The architecture now includes a robust icon system with dedicated PNG assets for tabs, features, and splash screens.

```mermaid
graph LR
TW["Tailwind Config"] --> UI["NativeWind Classes"]
GCSS["Global CSS"] --> UI
TH["Theme Tokens"] --> TW
RL["Risk Levels Config"] --> BADGE["Badge / RiskTierBadge"]
TYP["Types"] --> FEAT["Feature Components"]
ICON["PNG Icon System"] --> TAB["Tab Navigation"]
ICON --> FEATURE["Feature Cards"]
ICON --> SPLASH["Splash Screen"]
UI --> PRIMS["Primitives (Button, Input, Card, etc.)"]
PRIMS --> FEAT
FEAT --> APP["App Screens"]
TAB --> APP
FEATURE --> APP
SPLASH --> APP
```

**Diagram sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [global.css:1-4](file://global.css#L1-L4)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [index.ts:1-98](file://src/types/index.ts#L1-L98)
- [_layout.tsx:55-102](file://src/app/(app)/_layout.tsx#L55-L102)
- [index.tsx:107-121](file://src/app/index.tsx#L107-L121)

## Detailed Component Analysis

### Button
- Appearance: Rounded button with four variants and three sizes; supports full width; displays spinner when loading.
- Behavior: Disables interaction when disabled or loading; toggles between icon/text and spinner.
- Props: title, onPress, variant, size, disabled, loading, icon, iconRight, style, fullWidth.
- States: default, hover/press (via Pressable), disabled, loading.
- Animations/Transitions: None explicitly; relies on platform defaults.
- Accessibility: Uses native Pressable; ensure meaningful titles and avoid redundant aria-labels.
- Composition: Wrap icons inside icon/iconRight slots; combine with Card for grouped actions.
- Example usage pattern: See [Button.tsx:14-101](file://src/components/ui/Button.tsx#L14-L101).

```mermaid
flowchart TD
Start(["Render Button"]) --> CheckLoad{"loading?"}
CheckLoad --> |Yes| ShowSpinner["Show ActivityIndicator"]
CheckLoad --> |No| ShowContent["Render icon + Text + iconRight"]
ShowContent --> Interaction{"Pressable pressed?"}
Interaction --> |Yes| CallOnPress["Invoke onPress"]
Interaction --> |No| End(["Idle"])
ShowSpinner --> End
```

**Diagram sources**
- [Button.tsx:27-101](file://src/components/ui/Button.tsx#L27-L101)

**Section sources**
- [Button.tsx:14-101](file://src/components/ui/Button.tsx#L14-L101)

### Input
- Appearance: Labeled text input with optional left/right icons; dynamic border color based on focus/error; password visibility toggle.
- Behavior: Controlled input; supports multiple keyboard types; multiline mode with minimum height; editable flag.
- Props: label, placeholder, value, onChangeText, icon, error, secureTextEntry, keyboardType, autoCapitalize, multiline, numberOfLines, editable, rightIcon.
- States: default, focused, error, disabled (editable=false).
- Animations/Transitions: None explicit; focus changes border color.
- Accessibility: Label provided; error text displayed; secure text toggle has visible label.
- Composition: Combine with Card for form sections; use EmptyState for no-data scenarios.
- Example usage pattern: See [Input.tsx:8-90](file://src/components/ui/Input.tsx#L8-L90).

```mermaid
sequenceDiagram
participant U as "User"
participant I as "Input"
U->>I : Focus/Type
I->>I : Update isFocused/showPassword
I-->>U : Render updated border/value
U->>I : Blur/Submit
I-->>U : Final value via onChangeText
```

**Diagram sources**
- [Input.tsx:24-90](file://src/components/ui/Input.tsx#L24-L90)

**Section sources**
- [Input.tsx:8-90](file://src/components/ui/Input.tsx#L8-L90)

### Card
- Appearance: White card with rounded corners, subtle shadow, and border; optional padding.
- Behavior: Container that passes through className/style; flexible for any content.
- Props: children, style, className, padded.
- Example usage pattern: See [Card.tsx:8-30](file://src/components/ui/Card.tsx#L8-L30).

**Section sources**
- [Card.tsx:8-30](file://src/components/ui/Card.tsx#L8-L30)

### Badge
- Risk Tier Badge
  - Appearance: Pill with background and text color derived from risk level configuration.
  - Props: riskTier, size.
  - Example usage pattern: See [Badge.tsx:9-42](file://src/components/ui/Badge.tsx#L9-L42).
- Status Badge
  - Appearance: Small pill for sync statuses (synced/pending/failed).
  - Props: status, size.
  - Example usage pattern: See [Badge.tsx:44-71](file://src/components/ui/Badge.tsx#L44-L71).

```mermaid
classDiagram
class Badge {
+riskTier
+size
}
class StatusBadge {
+status
+size
}
class RiskTierConfig {
+label
+color
+bgColor
}
Badge --> RiskTierConfig : "reads"
```

**Diagram sources**
- [Badge.tsx:9-71](file://src/components/ui/Badge.tsx#L9-L71)
- [riskLevels.ts:19-49](file://src/constants/riskLevels.ts#L19-L49)

**Section sources**
- [Badge.tsx:9-71](file://src/components/ui/Badge.tsx#L9-L71)
- [riskLevels.ts:19-49](file://src/constants/riskLevels.ts#L19-L49)

### EmptyState
- Appearance: Centered layout with optional icon, title, description, and action slot.
- Props: icon, title, description, action.
- Example usage pattern: See [EmptyState.tsx:8-36](file://src/components/ui/EmptyState.tsx#L8-L36).

**Section sources**
- [EmptyState.tsx:8-36](file://src/components/ui/EmptyState.tsx#L8-L36)

### ConnectivityBanner
- Appearance: Amber banner with icon and two-line message.
- Behavior: Renders only when offline; uses connectivity hook.
- Props: None.
- Example usage pattern: See [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30).

```mermaid
sequenceDiagram
participant App as "App"
participant CB as "ConnectivityBanner"
participant Hook as "useConnectivity"
App->>CB : Mount
CB->>Hook : Subscribe to connectivity
Hook-->>CB : isOffline = true/false
CB-->>App : Render banner only when offline
```

**Diagram sources**
- [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30)
- [useConnectivity.ts:8-17](file://src/hooks/useConnectivity.ts#L8-L17)

**Section sources**
- [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30)
- [useConnectivity.ts:8-17](file://src/hooks/useConnectivity.ts#L8-L17)

### Feature Components

#### ABCDPanel
- Purpose: Displays four clinical indicators (Asymmetry, Border, Color, Diameter) as progress bars with percentage values and threshold-based colors.
- Props: scores object with asymmetry, border, color, diameter numbers.
- Behavior: Maps scores to percentages; colors change based on thresholds.
- Example usage pattern: See [ABCDPanel.tsx:10-68](file://src/components/assessment/ABCDPanel.tsx#L10-L68).

```mermaid
flowchart TD
S["Start"] --> Map["Map scores to percentages"]
Map --> Color{"Value >= 0.7?"}
Color --> |Yes| Red["Use urgent color"]
Color --> |No| CheckMid{"Value >= 0.4?"}
CheckMid --> |Yes| Orange["Use warning color"]
CheckMid --> |No| Green["Use success color"]
Red --> Render["Render bar"]
Orange --> Render
Green --> Render
Render --> End(["End"])
```

**Diagram sources**
- [ABCDPanel.tsx:19-68](file://src/components/assessment/ABCDPanel.tsx#L19-L68)

**Section sources**
- [ABCDPanel.tsx:10-68](file://src/components/assessment/ABCDPanel.tsx#L10-L68)

#### ClassProbabilityList
- Purpose: Collapsible list showing probabilities across all diagnostic classes, highlighting the predicted class.
- Props: classProbabilities map and predictedClass.
- Behavior: Sorts classes by probability; toggles expanded view; highlights predicted class.
- Example usage pattern: See [ClassProbabilityList.tsx:10-83](file://src/components/assessment/ClassProbabilityList.tsx#L10-L83).

**Section sources**
- [ClassProbabilityList.tsx:10-83](file://src/components/assessment/ClassProbabilityList.tsx#L10-L83)

#### RiskTierBadge
- Purpose: Prominent display of risk tier with optional action text.
- Props: riskTier, showAction.
- Behavior: Reads configuration for label, colors, and optional action text.
- Example usage pattern: See [RiskTierBadge.tsx:10-40](file://src/components/assessment/RiskTierBadge.tsx#L10-L40).

**Section sources**
- [RiskTierBadge.tsx:10-40](file://src/components/assessment/RiskTierBadge.tsx#L10-L40)

#### PatientListItem
- Purpose: Row representing a patient with avatar, name, metadata, and sync status badge.
- Props: patient, lastAssessmentDate, onPress.
- Behavior: Computes initials, age, sex label; formats date; renders StatusBadge.
- Example usage pattern: See [PatientListItem.tsx:11-52](file://src/components/patient/PatientListItem.tsx#L11-L52).

**Section sources**
- [PatientListItem.tsx:11-52](file://src/components/patient/PatientListItem.tsx#L11-L52)

#### SyncQueueItem
- Purpose: Displays a single sync queue entry with status and retry action when failed.
- Props: item, onRetry.
- Behavior: Maps status to color/background/label; conditionally shows retry.
- Example usage pattern: See [SyncQueueItem.tsx:10-55](file://src/components/sync/SyncQueueItem.tsx#L10-L55).

**Section sources**
- [SyncQueueItem.tsx:10-55](file://src/components/sync/SyncQueueItem.tsx#L10-L55)

## Icon System and Asset Management

### Tab Navigation Icons
The tab navigation system has been enhanced with dedicated PNG icons for each tab, providing consistent visual appearance across iOS and Android platforms. Each tab now uses a custom TabIcon component that renders PNG images with opacity-based focus states.

- Tab Icons: Home, Patients, Assessments, Settings
- Implementation: Custom TabIcon component with Image component from expo-image
- Styling: Opacity transitions for focused/unfocused states with consistent sizing
- Assets: Located in assets/icons/tab-*.png format

### Feature Card Icons
Feature cards in the onboarding flow now use high-quality PNG icons instead of emojis, providing better visual consistency and brand alignment.

- Feature Icons: AI chip, offline cloud, upload cloud
- Implementation: FeatureCard component with proper image rendering
- Styling: Consistent 24x24 sizing with contentFit="contain"
- Assets: Located in assets/icons/ directory

### Permission Row Icons
Permission rows utilize dedicated PNG icons for camera, photos/storage, and location permissions, improving clarity and professionalism.

- Permission Icons: Camera, image, location pin
- Implementation: PermissionRow component with proper image handling
- Styling: Gray background containers with centered icon placement
- Assets: Located in assets/icons/ directory

### Splash Screen Enhancements
The splash screen configuration has been updated with improved image handling and adaptive icon support for both iOS and Android platforms.

- Configuration: Enhanced app.json with proper splash screen settings
- Adaptive Icons: Separate foreground, background, and monochrome images for Android
- iOS Support: Proper icon configuration for iOS devices
- Web Support: Favicon configuration for web builds

```mermaid
flowchart TD
A["App Launch"] --> B["Splash Screen"]
B --> C["Auth State Check"]
C --> D{"Authenticated?"}
D --> |Yes| E["Home Tab"]
D --> |No| F{"PIN Set?"}
F --> |Yes| G["Login Screen"]
F --> |No| H["Onboarding Flow"]
H --> I["Feature Cards with PNG Icons"]
I --> J["Permission Rows with PNG Icons"]
E --> K["Tab Navigation with PNG Icons"]
```

**Diagram sources**
- [index.tsx:22-49](file://src/app/index.tsx#L22-L49)
- [_layout.tsx:55-102](file://src/app/(app)/_layout.tsx#L55-L102)
- [index.tsx:107-154](file://src/app/index.tsx#L107-L154)

**Section sources**
- [_layout.tsx:11-34](file://src/app/(app)/_layout.tsx#L11-L34)
- [_layout.tsx:55-102](file://src/app/(app)/_layout.tsx#L55-L102)
- [index.tsx:197-248](file://src/app/index.tsx#L197-L248)
- [app.json:10-27](file://app.json#L10-L27)

## Dependency Analysis
- Styling dependencies: All components use Tailwind classes compiled via NativeWind; theme colors and fonts are extended in tailwind.config.js and referenced globally via global.css.
- Token dependencies: Badges and risk-related components depend on riskLevels.ts for consistent labeling and colors.
- Hook dependencies: ConnectivityBanner depends on useConnectivity for real-time network state.
- Type dependencies: Feature components consume shared types from index.ts for consistency across screens.
- Icon dependencies: Tab navigation and feature components depend on PNG assets in assets/icons directory for consistent visual presentation.

```mermaid
graph LR
TW["tailwind.config.js"] --> CN["Components (className)"]
TH["theme.ts"] --> TW
RL["riskLevels.ts"] --> BADGE["Badge / RiskTierBadge"]
TYP["types/index.ts"] --> FEAT["Feature Components"]
UC["useConnectivity.ts"] --> CB["ConnectivityBanner"]
ICON["PNG Assets"] --> TAB["Tab Navigation"]
ICON --> FEATURE["Feature Cards"]
ICON --> PERMISSION["Permission Rows"]
```

**Diagram sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [index.ts:1-98](file://src/types/index.ts#L1-L98)
- [useConnectivity.ts:1-18](file://src/hooks/useConnectivity.ts#L1-L18)
- [_layout.tsx:55-102](file://src/app/(app)/_layout.tsx#L55-L102)
- [index.tsx:107-154](file://src/app/index.tsx#L107-L154)

**Section sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
- [index.ts:1-98](file://src/types/index.ts#L1-L98)
- [useConnectivity.ts:1-18](file://src/hooks/useConnectivity.ts#L1-L18)

## Performance Considerations
- Prefer functional components and memoization where lists render frequently (e.g., ClassProbabilityList items).
- Avoid unnecessary re-renders by keeping state local to components and lifting minimal state up.
- Use Tailwind utility classes to minimize custom style computations.
- For long lists, consider virtualization at the screen level; keep components lightweight.
- Defer heavy operations off the main thread; use hooks like useDebounce for search inputs if added later.
- **Icon Optimization**: PNG icons are pre-optimized for mobile display; use contentFit="contain" for proper scaling without distortion.
- **Asset Loading**: Leverage expo-image for efficient image loading and caching across the application.

## Troubleshooting Guide
- Connectivity issues: ConnectivityBanner will appear when offline; verify useConnectivity subscription and netinfo integration.
- Input errors: Ensure error prop is set and onChangeText updates value; confirm keyboard type matches expected input.
- Badge misconfiguration: Verify riskTier/status values match configured keys; extend configs if adding new states.
- Loading states: Button disables interactions during loading; ensure async handlers resolve to clear loading state.
- **Icon Display Issues**: Ensure PNG files are properly sized (24x24 recommended) and located in correct asset directories; verify file paths in require statements.
- **Tab Navigation Problems**: Check that tab icon files exist and are properly referenced; verify TabIcon component receives correct props.
- **Splash Screen Issues**: Verify app.json configuration matches actual asset locations; ensure splash images are properly formatted.

**Section sources**
- [ConnectivityBanner.tsx:9-30](file://src/components/ui/ConnectivityBanner.tsx#L9-L30)
- [useConnectivity.ts:8-17](file://src/hooks/useConnectivity.ts#L8-L17)
- [Input.tsx:8-90](file://src/components/ui/Input.tsx#L8-L90)
- [Badge.tsx:9-71](file://src/components/ui/Badge.tsx#L9-L71)
- [Button.tsx:14-101](file://src/components/ui/Button.tsx#L14-L101)
- [_layout.tsx:55-102](file://src/app/(app)/_layout.tsx#L55-L102)
- [index.tsx:107-154](file://src/app/index.tsx#L107-L154)
- [app.json:10-27](file://app.json#L10-L27)

## Conclusion
DermSight's UI component library provides a cohesive set of primitives and feature components styled with NativeWind and Tailwind CSS. The enhanced icon system with PNG assets ensures consistent visual presentation across platforms, while the improved splash screen and tab navigation provide a polished user experience. The design system leverages shared tokens and configuration for consistency across platforms. Components are accessible, composable, and extensible, enabling rapid development of robust mobile interfaces.

## Appendices

### Styling Guidelines and Theme Customization
- Colors and tokens: Extend or override colors in tailwind.config.js; reference theme tokens from theme.ts for platform-specific fonts and spacing.
- Global styles: Import global.css to enable Tailwind directives.
- Consistency: Use predefined variants and sizes for Buttons and Badges; prefer className over inline styles for maintainability.
- **Icon Guidelines**: Use PNG icons sized at 24x24 pixels for optimal display; maintain consistent visual weight and style across all icons.

**Section sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [global.css:1-4](file://global.css#L1-L4)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)

### Responsive Design Principles
- Use Tailwind utilities for spacing and sizing; components adapt to different screen sizes via relative units and flex layouts.
- Keep critical information within safe areas; consider platform insets from theme.ts for bottom tabs on iOS vs Android.
- **Icon Responsiveness**: PNG icons scale appropriately across different screen densities using contentFit="contain" property.

**Section sources**
- [theme.ts:62-74](file://src/constants/theme.ts#L62-L74)

### Accessibility Features
- Keyboard navigation: Native components handle focus and activation; ensure logical tab order in composed screens.
- Screen reader support: Provide descriptive labels and error messages; avoid relying solely on color for meaning (complement with text/icons).
- **Icon Accessibility**: Ensure icons have appropriate alt text or labels when used in interactive contexts; maintain sufficient contrast ratios for icon visibility.

**Section sources**
- [Input.tsx:24-90](file://src/components/ui/Input.tsx#L24-L90)
- [Button.tsx:27-101](file://src/components/ui/Button.tsx#L27-L101)

### Cross-Platform Compatibility
- Fonts and spacing: Platform.select in theme.ts ensures appropriate defaults on iOS, Android, and web.
- Inset handling: BottomTabInset accounts for platform differences in tab bar spacing.
- **Icon Compatibility**: PNG icons provide consistent appearance across iOS, Android, and web platforms; adaptive icons configured separately for Android.
- **Splash Screen**: Enhanced configuration supports platform-specific splash screen behaviors and adaptive icon rendering.

**Section sources**
- [theme.ts:41-74](file://src/constants/theme.ts#L41-L74)
- [app.json:10-27](file://app.json#L10-L27)

### Testing Approaches
- Unit tests: Assert component rendering and prop behaviors (e.g., Button loading/disabled states, Input focus/error visuals).
- Integration tests: Validate flows like ConnectivityBanner visibility based on network state.
- Snapshot tests: Capture UI structure for primitives and feature components to detect regressions.
- **Icon Testing**: Verify icon rendering across different screen sizes and orientations; test icon loading performance and error handling.

### Extending and Creating New Components
- Follow established patterns: Define TypeScript interfaces for props; use Tailwind classes for styling; compose primitives to build complex UI.
- Centralize tokens: Add new colors or sizes to tailwind.config.js and theme.ts; update riskLevels.ts for domain-specific configurations.
- Maintain consistency: Reuse existing components (Button, Input, Card, Badge) to ensure uniform behavior and appearance.
- **Icon Integration**: Create new PNG icons following established naming conventions (tab-*, feature-*); integrate with existing components using Image component from expo-image.
- **Asset Management**: Organize icons in appropriate directories (assets/icons/, assets/bottom-tab-icons/) with consistent naming and sizing standards.

**Section sources**
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [riskLevels.ts:1-121](file://src/constants/riskLevels.ts#L1-L121)
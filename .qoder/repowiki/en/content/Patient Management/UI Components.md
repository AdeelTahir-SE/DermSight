# UI Components

<cite>
**Referenced Files in This Document**
- [PatientHeader.tsx](file://src/components/patient/PatientHeader.tsx)
- [PatientListItem.tsx](file://src/components/patient/PatientListItem.tsx)
- [Badge.tsx](file://src/components/ui/Badge.tsx)
- [index.ts (types)](file://src/types/index.ts)
- [date.ts](file://src/utils/date.ts)
- [theme.ts](file://src/constants/theme.ts)
- [tailwind.config.js](file://tailwind.config.js)
- [patients/index.tsx](file://src/app/(app)/patients/index.tsx)
- [patients/[patientId]/index.tsx](file://src/app/(app)/patients/[patientId]/index.tsx)
- [patients/_layout.tsx](file://src/app/(app)/patients/_layout.tsx)
- [patients/[patientId]/_layout.tsx](file://src/app/(app)/patients/[patientId]/_layout.tsx)
- [repository.ts](file://src/features/patients/repository.ts)
- [store.ts](file://src/features/patients/store.ts)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion
10. Appendices

## Introduction
This document provides comprehensive documentation for patient-related UI components in DermSight, focusing on the PatientHeader and PatientListItem components. It covers their props, styling options, integration with patient data display, composition patterns, accessibility considerations, responsive design, theme customization, usage examples across screen layouts, performance optimizations for large lists, and guidelines for extending and customizing behavior.

## Project Structure
The patient UI is implemented as reusable React Native components under src/components/patient and consumed by screens in src/app/(app)/patients. Data flows from a local repository into Zustand store state and then into screens that render the components.

```mermaid
graph TB
subgraph "Screens"
PL["Patients List<br/>src/app/(app)/patients/index.tsx"]
PD["Patient Detail<br/>src/app/(app)/patients/[patientId]/index.tsx"]
end
subgraph "Components"
PHI["PatientHeader<br/>src/components/patient/PatientHeader.tsx"]
PLI["PatientListItem<br/>src/components/patient/PatientListItem.tsx"]
SB["StatusBadge<br/>src/components/ui/Badge.tsx"]
end
subgraph "Data Layer"
ST["Zustand Store<br/>src/features/patients/store.ts"]
RP["Repository<br/>src/features/patients/repository.ts"]
DB["SQLite Client<br/>src/db/client.ts"]
end
subgraph "Shared"
TY["Types<br/>src/types/index.ts"]
DT["Date Utils<br/>src/utils/date.ts"]
TH["Theme & Tailwind<br/>src/constants/theme.ts<br/>tailwind.config.js"]
end
PL --> PLI
PD --> PHI
PLI --> SB
PL --> ST
PD --> RP
ST --> RP
RP --> DB
PHI --> DT
PLI --> DT
PHI --> TY
PLI --> TY
PHI --> TH
PLI --> TH
```

**Diagram sources**
- [patients/index.tsx:1-132](file://src/app/(app)/patients/index.tsx#L1-L132)
- [patients/[patientId]/index.tsx:1-211](file://src/app/(app)/patients/[patientId]/index.tsx#L1-L211)
- [PatientHeader.tsx:1-68](file://src/components/patient/PatientHeader.tsx#L1-L68)
- [PatientListItem.tsx:1-52](file://src/components/patient/PatientListItem.tsx#L1-L52)
- [Badge.tsx:1-71](file://src/components/ui/Badge.tsx#L1-L71)
- [store.ts:1-67](file://src/features/patients/store.ts#L1-L67)
- [repository.ts:1-128](file://src/features/patients/repository.ts#L1-L128)
- [index.ts (types):1-98](file://src/types/index.ts#L1-L98)
- [date.ts:1-72](file://src/utils/date.ts#L1-L72)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)

**Section sources**
- [patients/index.tsx:1-132](file://src/app/(app)/patients/index.tsx#L1-L132)
- [patients/[patientId]/index.tsx:1-211](file://src/app/(app)/patients/[patientId]/index.tsx#L1-L211)
- [PatientHeader.tsx:1-68](file://src/components/patient/PatientHeader.tsx#L1-L68)
- [PatientListItem.tsx:1-52](file://src/components/patient/PatientListItem.tsx#L1-L52)
- [Badge.tsx:1-71](file://src/components/ui/Badge.tsx#L1-L71)
- [store.ts:1-67](file://src/features/patients/store.ts#L1-L67)
- [repository.ts:1-128](file://src/features/patients/repository.ts#L1-L128)
- [index.ts (types):1-98](file://src/types/index.ts#L1-L98)
- [date.ts:1-72](file://src/utils/date.ts#L1-L72)
- [theme.ts:1-74](file://src/constants/theme.ts#L1-L74)
- [tailwind.config.js:1-45](file://tailwind.config.js#L1-L45)

## Core Components
- PatientHeader: Displays a patient’s avatar initials, name, status indicator, ID snippet, sex, age, registration date, and quick action buttons. Uses shared date utilities and theme colors.
- PatientListItem: Renders a single row with avatar initials, name, ID snippet, sex, age, optional last assessment date, and a sync status badge.

Key shared dependencies:
- Types: Patient interface defines all fields used by both components.
- Date utilities: calculateAge and formatDate are used to compute and present age and dates.
- Theme: Tailwind classes reference primary, navy, and surface tokens defined in tailwind.config.js and theme constants.

**Section sources**
- [PatientHeader.tsx:10-55](file://src/components/patient/PatientHeader.tsx#L10-L55)
- [PatientListItem.tsx:11-49](file://src/components/patient/PatientListItem.tsx#L11-L49)
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)

## Architecture Overview
The patient screens consume data via a Zustand store and repository layer. The list screen renders PatientListItem rows inside a FlatList. The detail screen renders PatientHeader at the top of the profile view. Both components are pure presentational layers that rely on props and shared utilities.

```mermaid
sequenceDiagram
participant Screen as "Screen"
participant Store as "Zustand Store"
participant Repo as "Repository"
participant DB as "SQLite"
participant Comp as "UI Components"
Screen->>Store : loadPatients()
Store->>Repo : getAllPatients()
Repo->>DB : select patients
DB-->>Repo : rows
Repo-->>Store : mapped Patient[]
Store-->>Screen : patients
Screen->>Comp : render PatientListItem[]
Note over Screen,Comp : Each item receives patient + onPress
Screen->>Repo : getPatientById(id)
Repo->>DB : select by id
DB-->>Repo : Patient
Repo-->>Screen : Patient
Screen->>Comp : render PatientHeader(patient)
```

**Diagram sources**
- [patients/index.tsx:16-29](file://src/app/(app)/patients/index.tsx#L16-L29)
- [store.ts:26-67](file://src/features/patients/store.ts#L26-L67)
- [repository.ts:13-42](file://src/features/patients/repository.ts#L13-L42)
- [patients/[patientId]/index.tsx:15-26](file://src/app/(app)/patients/[patientId]/index.tsx#L15-L26)

## Detailed Component Analysis

### PatientHeader
- Purpose: Top section of the patient detail screen showing identity, demographics, and quick actions.
- Props:
  - patient: Patient object containing firstName, lastName, dateOfBirth, sex, id, createdAt, and other metadata.
- Styling:
  - Uses Tailwind classes for layout, spacing, typography, and color tokens (primary, navy, gray).
  - Avatar background uses primary-50; text uses primary and navy tokens.
- Data presentation:
  - Computes initials from first and last names.
  - Calculates age using date utility.
  - Displays formatted registration date and short ID snippet.
  - Shows an “Active” indicator.
- Integration:
  - Consumed by the patient detail screen to render the header above additional sections.
- Accessibility:
  - Text elements provide readable content; consider adding accessible labels for quick actions if they trigger navigation or actions.
- Responsiveness:
  - Flexbox-based layout adapts to screen width; avatar and info stack horizontally with flex-row.
- Extensibility:
  - QuickAction is a small internal component; can be extended to accept icon, label, and onPress to wire real actions.

```mermaid
flowchart TD
Start(["Render PatientHeader"]) --> Compute["Compute initials and age"]
Compute --> Layout["Build header layout<br/>avatar + name + status"]
Layout --> Meta["Display ID snippet, sex, age, registered date"]
Meta --> Actions["Render quick actions row"]
Actions --> End(["Component rendered"])
```

**Diagram sources**
- [PatientHeader.tsx:14-55](file://src/components/patient/PatientHeader.tsx#L14-L55)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)

**Section sources**
- [PatientHeader.tsx:10-67](file://src/components/patient/PatientHeader.tsx#L10-L67)
- [patients/[patientId]/index.tsx:41-55](file://src/app/(app)/patients/[patientId]/index.tsx#L41-L55)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)

### PatientListItem
- Purpose: Individual row in the patient list displaying key patient information and sync status.
- Props:
  - patient: Patient object.
  - lastAssessmentDate?: Optional string to show last assessment date.
  - onPress: Callback invoked when the row is pressed.
- Styling:
  - Pressable container with white background and subtle border.
  - Avatar uses primary-50 background and primary text.
  - StatusBadge shows sync status with color-coded backgrounds and text.
- Touch interactions:
  - Entire row is pressable; navigation handled by the parent screen.
- Visual presentation:
  - Shows initials, full name, ID snippet, sex, age, optional last assessment date, and sync status badge.
- Integration:
  - Rendered by the patient list screen within a FlatList.
- Accessibility:
  - Row is interactive; ensure focus and announcements are appropriate for screen readers.
- Responsiveness:
  - Horizontal layout with flexible space allocation; scales well on different widths.

```mermaid
classDiagram
class PatientListItem {
+props.patient : Patient
+props.lastAssessmentDate? : string
+props.onPress() : void
}
class Patient {
+id : string
+firstName : string
+lastName : string
+dateOfBirth : string
+sex : "male"|"female"|"other"
+syncStatus : SyncStatus
}
class StatusBadge {
+props.status : "synced"|"pending"|"failed"
+props.size? : "sm"|"md"
}
PatientListItem --> Patient : "reads"
PatientListItem --> StatusBadge : "renders"
```

**Diagram sources**
- [PatientListItem.tsx:11-49](file://src/components/patient/PatientListItem.tsx#L11-L49)
- [Badge.tsx:44-70](file://src/components/ui/Badge.tsx#L44-L70)
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)

**Section sources**
- [PatientListItem.tsx:11-49](file://src/components/patient/PatientListItem.tsx#L11-L49)
- [patients/index.tsx:109-119](file://src/app/(app)/patients/index.tsx#L109-L119)
- [Badge.tsx:44-70](file://src/components/ui/Badge.tsx#L44-L70)
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)

### Component Composition Patterns and Reusability
- Composition:
  - PatientHeader composes smaller visual blocks (avatar, name block, meta lines, quick actions).
  - PatientListItem composes avatar, info block, and StatusBadge.
- Reusability:
  - Both components are pure presentational functions taking typed props, enabling reuse across screens without business logic coupling.
  - Shared utilities (date formatting, types) and theme tokens promote consistency.
- Extensibility:
  - Add new props to components to support optional features (e.g., extra metadata, variant styles).
  - Encapsulate complex behaviors in small internal components (like QuickAction) for clarity.

**Section sources**
- [PatientHeader.tsx:14-67](file://src/components/patient/PatientHeader.tsx#L14-L67)
- [PatientListItem.tsx:17-49](file://src/components/patient/PatientListItem.tsx#L17-L49)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)

## Architecture Overview
The screens orchestrate data fetching and rendering:
- Patient List screen loads patients via store, filters them locally, and renders PatientListItem rows.
- Patient Detail screen fetches a specific patient and assessments, then renders PatientHeader and related sections.

```mermaid
sequenceDiagram
participant List as "Patient List Screen"
participant Store as "usePatientsStore"
participant Repo as "Repository"
participant Detail as "Patient Detail Screen"
participant Header as "PatientHeader"
participant Item as "PatientListItem"
List->>Store : loadPatients()
Store->>Repo : getAllPatients()
Repo-->>Store : Patient[]
Store-->>List : patients
List->>Item : map patients -> renderItem
Detail->>Repo : getPatientById(id)
Repo-->>Detail : Patient
Detail->>Header : render(patient)
```

**Diagram sources**
- [patients/index.tsx:16-29](file://src/app/(app)/patients/index.tsx#L16-L29)
- [store.ts:26-67](file://src/features/patients/store.ts#L26-L67)
- [repository.ts:13-42](file://src/features/patients/repository.ts#L13-L42)
- [patients/[patientId]/index.tsx:15-26](file://src/app/(app)/patients/[patientId]/index.tsx#L15-L26)
- [PatientHeader.tsx:14-55](file://src/components/patient/PatientHeader.tsx#L14-L55)
- [PatientListItem.tsx:17-49](file://src/components/patient/PatientListItem.tsx#L17-L49)

## Detailed Component Analysis

### PatientHeader Usage in Detail Screen
- The detail screen imports and renders PatientHeader after loading patient data.
- It also displays additional sections like patient information and assessment summaries.

```mermaid
sequenceDiagram
participant Detail as "Patient Detail Screen"
participant Repo as "Repository"
participant Header as "PatientHeader"
Detail->>Repo : getPatientById(patientId)
Repo-->>Detail : Patient
Detail->>Header : <PatientHeader patient={patient} />
Note over Detail,Header : Header computes initials, age, formats dates
```

**Diagram sources**
- [patients/[patientId]/index.tsx:15-26](file://src/app/(app)/patients/[patientId]/index.tsx#L15-L26)
- [patients/[patientId]/index.tsx:41-55](file://src/app/(app)/patients/[patientId]/index.tsx#L41-L55)
- [PatientHeader.tsx:14-55](file://src/components/patient/PatientHeader.tsx#L14-L55)

**Section sources**
- [patients/[patientId]/index.tsx:15-55](file://src/app/(app)/patients/[patientId]/index.tsx#L15-L55)
- [PatientHeader.tsx:14-55](file://src/components/patient/PatientHeader.tsx#L14-L55)

### PatientListItem Usage in List Screen
- The list screen maps filtered patients to PatientListItem rows inside a FlatList.
- Navigation to patient detail is handled via router.push with the patient id.

```mermaid
sequenceDiagram
participant List as "Patient List Screen"
participant Store as "usePatientsStore"
participant Item as "PatientListItem"
List->>Store : loadPatients()
Store-->>List : patients
List->>List : filter by activeFilter
List->>Item : renderItem({ item }) => <PatientListItem patient={item} onPress={...} />
```

**Diagram sources**
- [patients/index.tsx:16-36](file://src/app/(app)/patients/index.tsx#L16-L36)
- [patients/index.tsx:109-119](file://src/app/(app)/patients/index.tsx#L109-L119)
- [PatientListItem.tsx:17-49](file://src/components/patient/PatientListItem.tsx#L17-L49)

**Section sources**
- [patients/index.tsx:16-119](file://src/app/(app)/patients/index.tsx#L16-L119)
- [PatientListItem.tsx:17-49](file://src/components/patient/PatientListItem.tsx#L17-L49)

## Dependency Analysis
- PatientHeader depends on:
  - Patient type for props.
  - Date utilities for age and formatted dates.
  - Tailwind theme tokens for colors and typography.
- PatientListItem depends on:
  - Patient type for props.
  - StatusBadge for sync status visualization.
  - Date utilities for age and optional last assessment date.
  - Tailwind theme tokens for consistent styling.

```mermaid
graph LR
PH["PatientHeader"] --> TY["Patient Type"]
PH --> DT["Date Utils"]
PH --> TH["Tailwind Theme"]
PLI["PatientListItem"] --> TY
PLI --> SB["StatusBadge"]
PLI --> DT
PLI --> TH
```

**Diagram sources**
- [PatientHeader.tsx:5-8](file://src/components/patient/PatientHeader.tsx#L5-L8)
- [PatientListItem.tsx:5-9](file://src/components/patient/PatientListItem.tsx#L5-L9)
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [Badge.tsx:44-70](file://src/components/ui/Badge.tsx#L44-L70)
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)

**Section sources**
- [PatientHeader.tsx:5-8](file://src/components/patient/PatientHeader.tsx#L5-L8)
- [PatientListItem.tsx:5-9](file://src/components/patient/PatientListItem.tsx#L5-L9)
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [Badge.tsx:44-70](file://src/components/ui/Badge.tsx#L44-L70)
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)

## Performance Considerations
- Virtualization:
  - The patient list uses FlatList, which virtualizes items for efficient rendering of large datasets. Ensure keyExtractor uses stable unique keys (patient.id).
- Debounced search:
  - Search input is debounced to reduce frequent store updates and repository calls.
- Filtering:
  - Local filtering by sync status is applied in-memory; for very large lists, consider server-side filtering or pagination.
- Lazy loading:
  - For heavy detail views, consider lazy-loading assessments or images only when needed.
- Memoization:
  - If components receive expensive computations, wrap with React.memo and useMemo for derived values like initials and age.
- Batch updates:
  - Keep store actions minimal and batched to avoid excessive re-renders.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing patient data:
  - Verify repository returns mapped Patient objects and that screens handle null cases gracefully.
- Incorrect age or date display:
  - Check date parsing and formatting utilities; ensure ISO strings are passed.
- Status badge not updating:
  - Confirm syncStatus field exists on Patient and is updated in store/repository operations.
- Navigation issues:
  - Ensure router paths match route definitions in layout files.

**Section sources**
- [repository.ts:108-127](file://src/features/patients/repository.ts#L108-L127)
- [date.ts:20-26](file://src/utils/date.ts#L20-L26)
- [date.ts:57-66](file://src/utils/date.ts#L57-L66)
- [patients/_layout.tsx:7-14](file://src/app/(app)/patients/_layout.tsx#L7-L14)
- [patients/[patientId]/_layout.tsx:7-16](file://src/app/(app)/patients/[patientId]/_layout.tsx#L7-L16)

## Conclusion
PatientHeader and PatientListItem are focused, reusable UI components that integrate cleanly with DermSight’s data layer and theme system. They follow clear composition patterns, leverage shared utilities, and support responsive layouts. With FlatList virtualization and debounced search, the patient list performs well for moderate datasets. For larger datasets, consider pagination, server-side filtering, and memoization. Extend components by adding optional props and encapsulating new behaviors in small internal components.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Props Reference
- PatientHeader
  - patient: Patient object (required)
- PatientListItem
  - patient: Patient object (required)
  - lastAssessmentDate?: string (optional)
  - onPress: () => void (required)

**Section sources**
- [PatientHeader.tsx:10-12](file://src/components/patient/PatientHeader.tsx#L10-L12)
- [PatientListItem.tsx:11-15](file://src/components/patient/PatientListItem.tsx#L11-L15)

### Styling and Theme Customization
- Colors and tokens:
  - Primary palette and navy tones are defined in tailwind.config.js and referenced via className.
  - Theme constants in theme.ts define light/dark palettes and fonts.
- Customization:
  - Adjust token values in tailwind.config.js to change brand colors.
  - Use theme constants for platform-specific font selection.

**Section sources**
- [tailwind.config.js:7-37](file://tailwind.config.js#L7-L37)
- [theme.ts:8-37](file://src/constants/theme.ts#L8-L37)
- [theme.ts:41-60](file://src/constants/theme.ts#L41-L60)

### Usage Examples Across Screens
- Patient List:
  - Renders PatientListItem rows inside FlatList with search and filter tabs.
- Patient Detail:
  - Renders PatientHeader at the top of the profile view, followed by information and assessment sections.

**Section sources**
- [patients/index.tsx:109-119](file://src/app/(app)/patients/index.tsx#L109-L119)
- [patients/[patientId]/index.tsx:41-55](file://src/app/(app)/patients/[patientId]/index.tsx#L41-L55)

### Guidelines for Extending and Customizing Behavior
- Add optional props for variants (e.g., size, alignment).
- Extract complex logic into small internal components (like QuickAction).
- Use TypeScript interfaces to enforce prop contracts.
- Leverage shared utilities and theme tokens to maintain consistency.
- Wrap expensive computations with memoization to optimize re-renders.

[No sources needed since this section provides general guidance]
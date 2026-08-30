# Patient Management

<cite>
**Referenced Files in This Document**
- [types.ts](file://src/features/patients/types.ts)
- [repository.ts](file://src/features/patients/repository.ts)
- [store.ts](file://src/features/patients/store.ts)
- [validation.ts](file://src/features/patients/validation.ts)
- [PatientHeader.tsx](file://src/components/patient/PatientHeader.tsx)
- [PatientListItem.tsx](file://src/components/patient/PatientListItem.tsx)
- [PatientListSkeleton.tsx](file://src/components/patient/PatientListSkeleton.tsx)
- [schema.ts](file://src/db/schema.ts)
- [index.ts](file://src/types/index.ts)
- [new.tsx](file://src/app/(app)/patients/new.tsx)
- [edit.tsx](file://src/app/(app)/patients/[patientId]/edit.tsx)
- [index.tsx (patient list)](file://src/app/(app)/patients/index.tsx)
- [index.tsx (patient detail)](file://src/app/(app)/patients/[patientId]/index.tsx)
- [syncEngine.ts](file://src/features/sync/syncEngine.ts)
- [assessments repository.ts](file://src/features/assessments/repository.ts)
- [date.ts](file://src/utils/date.ts)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive edit functionality for patient records with full CRUD operations
- Implemented skeleton loading states for improved user experience in patient list views
- Enhanced data synchronization with backend including better error handling and retry mechanisms
- Added comprehensive error handling for file system operations and database queries
- Improved sync queue management with duplicate prevention and status tracking

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
This document explains the patient management module in DermSight, covering the complete lifecycle of patient records: creation, retrieval, editing, search, filtering, and deletion. It details the data model for patients, including demographic fields, optional location tracking, and medical history relationships to assessments. It also documents validation rules, UI components for patient lists and headers, offline persistence via SQLite with an outbox sync pattern, conflict resolution strategies, and performance considerations for large datasets.

## Project Structure
The patient feature is organized into a layered structure:
- Feature layer: types, repository (SQLite CRUD), store (Zustand state), and validation schemas
- UI layer: screens for listing, creating, editing, and viewing patient details; reusable components for header and list items
- Data layer: Drizzle ORM schema and client
- Sync layer: background sync engine using an outbox queue

```mermaid
graph TB
subgraph "UI"
List["Patient List Screen"]
New["New Patient Screen"]
Edit["Edit Patient Screen"]
Detail["Patient Detail Screen"]
Header["PatientHeader"]
ListItem["PatientListItem"]
Skeleton["PatientListSkeleton"]
end
subgraph "Feature"
Store["usePatientsStore"]
Repo["Patient Repository"]
Types["Patient Types & Filters"]
Validation["Form Validation"]
end
subgraph "Data"
DB["SQLite (Drizzle)"]
Schema["Schema: patients, assessments, sync_queue"]
end
subgraph "Sync"
Engine["Sync Engine"]
end
List --> Store
New --> Repo
Edit --> Repo
Detail --> Repo
Store --> Repo
Repo --> DB
DB --> Schema
Repo --> Engine
Engine --> DB
Header --> Detail
ListItem --> List
Skeleton --> List
```

**Diagram sources**
- [index.tsx (patient list):1-156](file://src/app/(app)/patients/index.tsx#L1-L156)
- [new.tsx:1-192](file://src/app/(app)/patients/new.tsx#L1-L192)
- [edit.tsx:1-321](file://src/app/(app)/patients/[patientId]/edit.tsx#L1-L321)
- [index.tsx (patient detail):1-257](file://src/app/(app)/patients/[patientId]/index.tsx#L1-L257)
- [store.ts:1-76](file://src/features/patients/store.ts#L1-L76)
- [repository.ts:1-222](file://src/features/patients/repository.ts#L1-L222)
- [schema.ts:1-102](file://src/db/schema.ts#L1-L102)
- [syncEngine.ts:1-503](file://src/features/sync/syncEngine.ts#L1-L503)

**Section sources**
- [index.tsx (patient list):1-156](file://src/app/(app)/patients/index.tsx#L1-L156)
- [new.tsx:1-192](file://src/app/(app)/patients/new.tsx#L1-L192)
- [edit.tsx:1-321](file://src/app/(app)/patients/[patientId]/edit.tsx#L1-L321)
- [index.tsx (patient detail):1-257](file://src/app/(app)/patients/[patientId]/index.tsx#L1-L257)
- [store.ts:1-76](file://src/features/patients/store.ts#L1-L76)
- [repository.ts:1-222](file://src/features/patients/repository.ts#L1-L222)
- [schema.ts:1-102](file://src/db/schema.ts#L1-L102)
- [syncEngine.ts:1-503](file://src/features/sync/syncEngine.ts#L1-L503)

## Core Components
- Patient data model: defined in shared types and enforced by the database schema
- Repository: local SQLite operations for patients and assessments, plus enqueueing sync tasks
- Store: Zustand-based state for loading, searching, filtering, and active patient selection
- Validation: Zod schema for form inputs ensuring required fields and formats
- UI: PatientHeader, PatientListItem, and PatientListSkeleton for consistent presentation and interaction

Key responsibilities:
- Create: new patient registration screen validates input and persists locally, then enqueues sync
- Read: list screen loads all patients with skeleton loading states; detail screen loads a specific patient and their assessments
- Edit: dedicated edit screen for modifying existing patient records with real-time validation
- Search: debounced text search across name and ID
- Filter: tabs to show all, synced, or pending-sync patients
- Delete: repository supports deletion by ID
- Relationship: assessments are linked to patients via patientId and displayed in the detail view

**Section sources**
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)
- [schema.ts:18-40](file://src/db/schema.ts#L18-L40)
- [repository.ts:13-222](file://src/features/patients/repository.ts#L13-L222)
- [store.ts:10-76](file://src/features/patients/store.ts#L10-L76)
- [validation.ts:7-20](file://src/features/patients/validation.ts#L7-L20)
- [PatientHeader.tsx:10-67](file://src/components/patient/PatientHeader.tsx#L10-L67)
- [PatientListItem.tsx:11-51](file://src/components/patient/PatientListItem.tsx#L11-L51)
- [PatientListSkeleton.tsx:1-33](file://src/components/patient/PatientListSkeleton.tsx#L1-L33)

## Architecture Overview
DermSight uses an offline-first architecture with SQLite as the single source of truth. All writes are persisted locally first and then queued for background synchronization to a remote backend using an outbox pattern. The UI never blocks on network calls and provides immediate feedback through skeleton loading states and toast notifications.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Edit Patient Screen"
participant S as "usePatientsStore"
participant R as "Patient Repository"
participant D as "SQLite"
participant Q as "Sync Queue"
participant E as "Sync Engine"
U->>UI : Submit edited patient form
UI->>R : updatePatient(id, data)
R->>D : UPDATE patients
R->>Q : INSERT/UPDATE sync_queue (update)
R-->>UI : return updated Patient
UI->>S : updatePatientInStore(patient)
Note over E,Q : Background sync runs when online
E->>Q : getPendingSyncItems()
E->>D : update status to in_progress/done/failed
E-->>UI : updates reflected via store/list
```

**Diagram sources**
- [edit.tsx:89-110](file://src/app/(app)/patients/[patientId]/edit.tsx#L89-L110)
- [repository.ts:120-196](file://src/features/patients/repository.ts#L120-L196)
- [store.ts:69-74](file://src/features/patients/store.ts#L69-L74)
- [syncEngine.ts:60-176](file://src/features/sync/syncEngine.ts#L60-L176)

## Detailed Component Analysis

### Patient Data Model
- Demographics: first name, last name, date of birth, sex (male/female/other)
- Contact: phone, address (optional)
- Notes: free-text field (optional)
- Location: latitude, longitude (optional)
- Audit: capturedAt, createdBy, createdAt, updatedAt
- Sync metadata: syncStatus (pending/synced/failed), remoteId (optional)

Validation rules:
- Required: firstName, lastName, dateOfBirth (YYYY-MM-DD), sex
- Optional: phone, address, notes
- Enforced at UI level via Zod schema and inline validation in both new and edit patient screens

Relationships:
- Assessments reference a patient via patientId
- Assessments include image URI, predicted class, probabilities, ABCD scores, risk tier, confidence score, model version, body location, capture time, creator, sync metadata

**Section sources**
- [index.ts (types):19-36](file://src/types/index.ts#L19-L36)
- [schema.ts:18-40](file://src/db/schema.ts#L18-L40)
- [validation.ts:7-20](file://src/features/patients/validation.ts#L7-L20)
- [index.ts (types):42-64](file://src/types/index.ts#L42-L64)
- [schema.ts:42-75](file://src/db/schema.ts#L42-L75)

### Patient Creation Flow
- User fills the new patient form with required fields
- Form validation checks presence and format
- On save, repository creates a patient record locally and enqueues a sync task
- Store adds the new patient to the list immediately for responsive UI
- Navigation returns to previous screen

```mermaid
flowchart TD
Start(["Open New Patient"]) --> Validate["Validate Inputs"]
Validate --> Valid{"Valid?"}
Valid --> |No| ShowErrors["Show Field Errors"]
Valid --> |Yes| Persist["Persist to SQLite"]
Persist --> Enqueue["Enqueue Sync Task"]
Enqueue --> UpdateList["Update Local List"]
UpdateList --> NavigateBack["Navigate Back"]
ShowErrors --> End(["End"])
NavigateBack --> End
```

**Diagram sources**
- [new.tsx:34-67](file://src/app/(app)/patients/new.tsx#L34-L67)
- [repository.ts:59-118](file://src/features/patients/repository.ts#L59-L118)

**Section sources**
- [new.tsx:34-67](file://src/app/(app)/patients/new.tsx#L34-L67)
- [repository.ts:59-118](file://src/features/patients/repository.ts#L59-L118)

### Patient Editing Flow
- User navigates to edit screen from patient detail view
- Screen loads existing patient data and displays it in editable form
- Real-time validation ensures data integrity during editing
- Changes are saved locally and enqueued for synchronization
- Store updates immediately to reflect changes in the UI

```mermaid
flowchart TD
Start(["Open Edit Screen"]) --> LoadData["Load Existing Patient Data"]
LoadData --> DisplayForm["Display Editable Form"]
DisplayForm --> UserInput["User Makes Changes"]
UserInput --> Validate["Real-time Validation"]
Validate --> Valid{"Valid?"}
Valid --> |No| ShowErrors["Show Field Errors"]
Valid --> |Yes| SaveChanges["Save to SQLite"]
SaveChanges --> EnqueueSync["Enqueue Sync Task"]
EnqueueSync --> UpdateStore["Update Store"]
UpdateStore --> NavigateBack["Navigate Back"]
ShowErrors --> DisplayForm
```

**Diagram sources**
- [edit.tsx:44-64](file://src/app/(app)/patients/[patientId]/edit.tsx#L44-L64)
- [edit.tsx:89-110](file://src/app/(app)/patients/[patientId]/edit.tsx#L89-L110)
- [repository.ts:120-196](file://src/features/patients/repository.ts#L120-L196)

**Section sources**
- [edit.tsx:44-110](file://src/app/(app)/patients/[patientId]/edit.tsx#L44-L110)
- [repository.ts:120-196](file://src/features/patients/repository.ts#L120-L196)

### Patient Retrieval, Search, and Filtering
- Load all patients ordered by creation date with skeleton loading states
- Debounced search queries match first name, last name, or patient ID
- Filter tabs restrict results by sync status: all, synced, pending
- FlatList renders the filtered list efficiently with proper loading states

```mermaid
sequenceDiagram
participant L as "Patient List Screen"
participant S as "usePatientsStore"
participant R as "Patient Repository"
L->>S : loadPatients()
S->>R : getAllPatients()
R-->>S : Patient[]
S-->>L : set patients + isLoading
L->>L : show PatientListSkeleton while loading
L->>L : debounce(searchQuery)
L->>S : searchPatients(query)
S->>R : searchPatients(query)
R-->>S : Patient[]
S-->>L : set patients
L->>L : apply filter tabs
```

**Diagram sources**
- [index.tsx (patient list):21-27](file://src/app/(app)/patients/index.tsx#L21-L27)
- [store.ts:34-57](file://src/features/patients/store.ts#L34-L57)
- [repository.ts:13-37](file://src/features/patients/repository.ts#L13-L37)
- [PatientListSkeleton.tsx:9-32](file://src/components/patient/PatientListSkeleton.tsx#L9-L32)

**Section sources**
- [index.tsx (patient list):21-27](file://src/app/(app)/patients/index.tsx#L21-L27)
- [store.ts:34-57](file://src/features/patients/store.ts#L34-L57)
- [repository.ts:13-37](file://src/features/patients/repository.ts#L13-L37)
- [PatientListSkeleton.tsx:9-32](file://src/components/patient/PatientListSkeleton.tsx#L9-L32)

### Patient Deletion
- Delete by ID removes the patient from SQLite
- No explicit sync enqueue for delete is shown in the repository snippet; consider adding a delete operation to the outbox if server-side consistency is required

**Section sources**
- [repository.ts:198-200](file://src/features/patients/repository.ts#L198-L200)

### Patient Detail and Medical History
- Loads a specific patient by ID with fallback parameter support
- Retrieves assessments for that patient, ordered by creation date
- Displays summary counts (total, high risk, low risk)
- Shows recent assessments with links to full result view
- Provides navigation to edit screen for patient information modification

```mermaid
sequenceDiagram
participant D as "Patient Detail Screen"
participant R as "Patient Repository"
participant AR as "Assessment Repository"
D->>R : getPatientById(id)
R-->>D : Patient
D->>AR : getAssessmentsByPatient(id)
AR-->>D : Assessment[]
D->>D : compute risk counts
D-->>D : render summaries and recent assessments
D->>D : navigate to edit screen
```

**Diagram sources**
- [index.tsx (patient detail):27-32](file://src/app/(app)/patients/[patientId]/index.tsx#L27-L32)
- [index.tsx (patient detail):56-61](file://src/app/(app)/patients/[patientId]/index.tsx#L56-L61)
- [assessments repository.ts:11-21](file://src/features/assessments/repository.ts#L11-L21)

**Section sources**
- [index.tsx (patient detail):27-61](file://src/app/(app)/patients/[patientId]/index.tsx#L27-L61)
- [assessments repository.ts:11-21](file://src/features/assessments/repository.ts#L11-L21)

### Patient Header Component
- Props: patient object
- Displays initials avatar, full name, active status indicator, short ID, gender, age, registration date
- Quick action buttons for call, message, and location (placeholder actions)

Customization options:
- Replace quick actions with navigation or deep links
- Adjust styling via className props or theme tokens
- Extend with additional metadata like location coordinates if available

**Section sources**
- [PatientHeader.tsx:10-67](file://src/components/patient/PatientHeader.tsx#L10-L67)

### Patient List Item Component
- Props: patient, optional lastAssessmentDate, onPress handler
- Renders avatar, name, short ID, gender, age, last assessment date (if provided), and sync status badge
- Supports navigation to patient detail

Optimization tips:
- Use stable keys (patient.id) for FlatList
- Avoid heavy computations inside renderItem; precompute derived values where possible

**Section sources**
- [PatientListItem.tsx:11-51](file://src/components/patient/PatientListItem.tsx#L11-L51)

### Patient List Skeleton Component
- Props: count (default 4) for number of skeleton items to display
- Renders placeholder UI with skeleton animations for avatar, name, and status badge
- Improves perceived performance during data loading

Usage:
- Displayed when isLoading is true and no patients are loaded yet
- Provides visual feedback to users during asynchronous operations

**Section sources**
- [PatientListSkeleton.tsx:9-32](file://src/components/patient/PatientListSkeleton.tsx#L9-L32)

### Offline Persistence and Sync
- Local SQLite is the source of truth; UI reads/writes directly to it
- Outbox pattern: every create/update enqueues a sync task with entity type, id, operation, payload, attempt count, and status
- Sync engine processes pending items when online, marking them in_progress, done, or failed with exponential backoff
- Retry mechanism allows manual retry of failed items
- Duplicate sync prevention: checks for existing pending syncs before creating new ones

Conflict resolution strategy:
- Current implementation marks sync attempts and statuses; actual conflict handling logic is marked as TODO in the sync flow
- Recommended approach: implement server-side conflict detection and client-side merge policies based on timestamps or operational semantics

```mermaid
flowchart TD
A["Create/Update Entity"] --> B["Insert into SQLite"]
B --> C["Check for existing pending sync"]
C --> D{"Existing pending sync?"}
D --> |Yes| E["Update existing sync payload"]
D --> |No| F["Create new sync item"]
E --> G{"Online?"}
F --> G
G --> |No| H["Wait until online"]
G --> |Yes| I["Sync Engine picks pending items"]
I --> J["Mark in_progress"]
J --> K{"Upload success?"}
K --> |Yes| L["Mark done"]
K --> |No| M["Increment attemptCount"]
M --> N{"Max retries reached?"}
N --> |Yes| O["Mark failed"]
N --> |No| P["Re-enqueue with delay"]
```

**Diagram sources**
- [repository.ts:160-193](file://src/features/patients/repository.ts#L160-L193)
- [syncEngine.ts:60-176](file://src/features/sync/syncEngine.ts#L60-L176)

**Section sources**
- [repository.ts:160-193](file://src/features/patients/repository.ts#L160-L193)
- [syncEngine.ts:60-176](file://src/features/sync/syncEngine.ts#L60-L176)

## Dependency Analysis
- UI depends on features store for state and repository for data access
- Repository depends on Drizzle ORM and schema definitions
- Store depends on repository and exposes actions for UI
- Sync engine depends on schema and network connectivity utilities
- Assessments repository provides related medical history for patients

```mermaid
graph LR
UI["Screens"] --> Store["usePatientsStore"]
Store --> Repo["Patient Repository"]
Repo --> DB["SQLite"]
Repo --> Sync["Sync Engine"]
Detail["Patient Detail"] --> AssRepo["Assessment Repository"]
AssRepo --> DB
Skeleton["PatientListSkeleton"] --> UI
```

**Diagram sources**
- [index.tsx (patient list):1-156](file://src/app/(app)/patients/index.tsx#L1-L156)
- [store.ts:1-76](file://src/features/patients/store.ts#L1-L76)
- [repository.ts:1-222](file://src/features/patients/repository.ts#L1-L222)
- [assessments repository.ts:11-21](file://src/features/assessments/repository.ts#L11-L21)
- [syncEngine.ts:1-503](file://src/features/sync/syncEngine.ts#L1-L503)
- [PatientListSkeleton.tsx:1-33](file://src/components/patient/PatientListSkeleton.tsx#L1-L33)

**Section sources**
- [index.tsx (patient list):1-156](file://src/app/(app)/patients/index.tsx#L1-L156)
- [store.ts:1-76](file://src/features/patients/store.ts#L1-L76)
- [repository.ts:1-222](file://src/features/patients/repository.ts#L1-L222)
- [assessments repository.ts:11-21](file://src/features/assessments/repository.ts#L11-L21)
- [syncEngine.ts:1-503](file://src/features/sync/syncEngine.ts#L1-L503)
- [PatientListSkeleton.tsx:1-33](file://src/components/patient/PatientListSkeleton.tsx#L1-L33)

## Performance Considerations
- Debounced search reduces query frequency during typing
- FlatList with stable keys optimizes rendering for large lists
- Ordering by creation date ensures predictable list behavior
- Offload sync to background; UI remains responsive
- Skeleton loading states improve perceived performance during data loading
- Consider pagination or virtualization for very large patient sets
- Precompute derived values (age, labels) in list items to avoid repeated calculations
- Duplicate sync prevention reduces unnecessary network requests

## Troubleshooting Guide
Common issues and resolutions:
- Form validation errors: ensure required fields are filled and date format matches YYYY-MM/DD
- Search not returning results: verify search patterns and that data exists in SQLite
- Sync stuck in pending: check network connectivity and sync engine logs; retry failed items manually
- Missing assessments in detail view: confirm patientId linkage and that assessments were created and saved
- Edit screen not loading: verify patientId parameter is correctly passed and patient exists in database
- Skeleton loading indefinitely: check for unhandled errors in data loading functions

Operational checks:
- Verify sync queue status transitions (pending → in_progress → done/failed)
- Confirm patient IDs and assessment IDs are unique and correctly referenced
- Check for duplicate sync entries for the same patient
- Monitor file system operations for image uploads and storage access

**Section sources**
- [validation.ts:7-20](file://src/features/patients/validation.ts#L7-L20)
- [store.ts:34-57](file://src/features/patients/store.ts#L34-L57)
- [syncEngine.ts:60-176](file://src/features/sync/syncEngine.ts#L60-L176)
- [edit.tsx:44-64](file://src/app/(app)/patients/[patientId]/edit.tsx#L44-L64)

## Conclusion
The patient management module in DermSight provides a robust, offline-first workflow for managing patient records and associated assessments. With the addition of comprehensive edit capabilities, skeleton loading states, enhanced synchronization, and improved error handling, the module offers a complete CRUD experience. It combines clear data models, strict validation, efficient UI components, and a reliable sync engine to ensure data integrity and responsiveness. For production readiness, implement server-side conflict resolution and expand delete/update operations in the outbox to maintain full consistency between local and remote states.

## Appendices

### API Definitions (Local Operations)
- Create patient: accepts form data and user ID; returns persisted patient
- Get all patients: returns list ordered by creation date
- Search patients: returns matching patients by name or ID
- Get patient by ID: returns a single patient
- Update patient: accepts patient ID and updated form data; returns updated patient
- Delete patient: removes by ID

**Section sources**
- [repository.ts:13-222](file://src/features/patients/repository.ts#L13-L222)

### Data Models Summary
- Patient: demographics, contact, notes, optional location, audit fields, sync metadata
- Assessment: patient link, image references, ML outputs, ABCD scores, risk tier, capture metadata, sync metadata

**Section sources**
- [index.ts (types):19-64](file://src/types/index.ts#L19-L64)
- [schema.ts:18-75](file://src/db/schema.ts#L18-L75)

### Edit Screen Features
- Real-time form validation with inline error messages
- Date formatting helper for user-friendly input (DD / MM / YYYY)
- Haptic feedback for interactive elements
- Toast notifications for success/error states
- Loading states during data persistence
- Comprehensive error handling for file system and database operations

**Section sources**
- [edit.tsx:12-117](file://src/app/(app)/patients/[patientId]/edit.tsx#L12-L117)

### Skeleton Loading Implementation
- Configurable skeleton count for different loading scenarios
- Consistent styling with main application theme
- Smooth animations during data loading
- Integration with loading state management in store

**Section sources**
- [PatientListSkeleton.tsx:9-32](file://src/components/patient/PatientListSkeleton.tsx#L9-L32)
- [index.tsx (patient list):116-117](file://src/app/(app)/patients/index.tsx#L116-L117)
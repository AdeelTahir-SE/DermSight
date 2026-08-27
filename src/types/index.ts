/**
 * Shared cross-feature types for DermSight.
 */

export type SyncStatus = 'pending' | 'synced' | 'failed';
export type OperationType = 'create' | 'update';
export type EntityType = 'patient' | 'assessment';
export type SyncQueueStatus = 'pending' | 'in_progress' | 'failed' | 'done';

export interface User {
  id: string;
  fullName: string;
  region: string;
  pinHash: string;
  supabaseUserId: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'other';
  phone: string | null;
  address: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  remoteId: string | null;
}

export type DiagnosisClass = 'mel' | 'bcc' | 'akiec' | 'bkl' | 'df' | 'vasc' | 'nv';
export type RiskTier = 'low' | 'medium' | 'high' | 'urgent_referral';

export interface Assessment {
  id: string;
  patientId: string;
  imageLocalUri: string;
  imageRemoteUrl: string | null;
  predictedClass: DiagnosisClass;
  classProbabilities: Record<DiagnosisClass, number>;
  abcdAsymmetry: number;
  abcdBorder: number;
  abcdColor: number;
  abcdDiameter: number;
  riskTier: RiskTier;
  confidenceScore: number;
  modelVersion: string;
  bodyLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  createdBy: string;
  syncStatus: SyncStatus;
  remoteId: string | null;
  createdAt: string;
}

export interface SyncQueueItem {
  id: number;
  entityType: EntityType;
  entityId: string;
  operation: OperationType;
  payload: string; // JSON
  attemptCount: number;
  lastAttemptedAt: string | null;
  status: SyncQueueStatus;
  createdAt: string;
}

export interface ModelVersion {
  id: string;
  versionTag: string;
  fileUri: string;
  downloadedAt: string;
  isActive: boolean;
}

export interface InferenceResult {
  classProbabilities: Record<DiagnosisClass, number>;
  predictedClass: DiagnosisClass;
  confidenceScore: number;
  abcdScores: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
  };
  riskTier: RiskTier;
}

/**
 * Patients feature types.
 */

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: "male" | "female" | "other";
  phone?: string;
  address?: string;
  notes?: string;
}

export type PatientListFilter = "all" | "synced" | "pending";

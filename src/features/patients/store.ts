/**
 * Patients Zustand store — manages active patient and list filters.
 */

import type { Patient } from "@/types";
import { create } from "zustand";
import * as repo from "./repository";
import type { PatientListFilter } from "./types";

interface PatientsState {
  patients: Patient[];
  activePatient: Patient | null;
  filter: PatientListFilter;
  searchQuery: string;
  isLoading: boolean;

  // Actions
  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  setActivePatient: (patient: Patient | null) => void;
  setFilter: (filter: PatientListFilter) => void;
  setSearchQuery: (query: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatientInStore: (patient: Patient) => void;
  removePatientFromStore: (patientId: string) => void;
}

export const usePatientsStore = create<PatientsState>((set, get) => ({
  patients: [],
  activePatient: null,
  filter: "all",
  searchQuery: "",
  isLoading: false,

  loadPatients: async () => {
    set({ isLoading: true });
    try {
      const all = await repo.getAllPatients();
      set({ patients: all, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  searchPatients: async (query: string) => {
    set({ searchQuery: query, isLoading: true });
    try {
      if (!query.trim()) {
        const all = await repo.getAllPatients();
        set({ patients: all, isLoading: false });
      } else {
        const results = await repo.searchPatients(query);
        set({ patients: results, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setActivePatient: (patient) => set({ activePatient: patient }),

  setFilter: (filter) => set({ filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addPatient: (patient) => {
    set((state) => ({ patients: [patient, ...state.patients] }));
  },

  updatePatientInStore: (patient) => {
    set((state) => ({
      patients: state.patients.map((p) => (p.id === patient.id ? patient : p)),
      activePatient: state.activePatient?.id === patient.id ? patient : state.activePatient,
    }));
  },

  removePatientFromStore: (patientId) => {
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== patientId),
      activePatient: state.activePatient?.id === patientId ? null : state.activePatient,
    }));
  },
}));

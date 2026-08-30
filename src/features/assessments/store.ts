/**
 * Assessments Zustand store.
 */

import type { Assessment, InferenceResult } from "@/types";
import { create } from "zustand";
import * as repo from "./repository";

interface AssessmentsState {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  capturedImageUri: string | null;
  totalCount: number;
  pendingSyncCount: number;
  isLoading: boolean;

  // Actions
  loadByPatient: (patientId: string) => Promise<void>;
  loadAll: () => Promise<void>;
  loadCounts: () => Promise<void>;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  setCapturedImageUri: (uri: string | null) => void;
  saveAssessment: (
    patientId: string,
    imageUri: string,
    result: InferenceResult,
    userId: string,
  ) => Promise<Assessment>;
}

export const useAssessmentsStore = create<AssessmentsState>((set) => ({
  assessments: [],
  currentAssessment: null,
  capturedImageUri: null,
  totalCount: 0,
  pendingSyncCount: 0,
  isLoading: false,

  setCapturedImageUri: (uri) => set({ capturedImageUri: uri }),

  loadByPatient: async (patientId: string) => {
    set({ isLoading: true });
    try {
      const list = await repo.getAssessmentsByPatient(patientId);
      set({ assessments: list, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const list = await repo.getAllAssessments();
      set({ assessments: list, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadCounts: async () => {
    try {
      const total = await repo.getAssessmentCount();
      const pending = await repo.getPendingSyncCount();
      set({ totalCount: total, pendingSyncCount: pending });
    } catch {
      // silent
    }
  },

  setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),

  saveAssessment: async (patientId, imageUri, result, userId) => {
    const assessment = await repo.createAssessment(
      patientId,
      imageUri,
      result,
      userId,
    );
    set((state) => ({
      assessments: [assessment, ...state.assessments],
      currentAssessment: assessment,
    }));
    return assessment;
  },
}));

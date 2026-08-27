/**
 * Auth Zustand store — manages session and worker profile.
 */

import * as SecureStorage from "@/lib/secureStorage";
import { create } from "zustand";
import { hashPin, isPinSet, verifyPin } from "./pin";
import type { AuthSession } from "./types";

interface AuthState extends AuthSession {
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loginWithPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string, workerName: string) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: "",
  workerName: "",
  isAuthenticated: false,
  pinSet: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const userId = await SecureStorage.getUserId();
      const workerName = await SecureStorage.getWorkerName();
      const pinSet = await isPinSet();

      set({
        userId: userId || "",
        workerName: workerName || "",
        pinSet,
        isAuthenticated: false,
        isInitialized: true,
      });
    } catch {
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithPin: async (pin: string) => {
    set({ isLoading: true });
    try {
      const storedHash = await SecureStorage.getPinHash();
      if (!storedHash) {
        set({ isLoading: false });
        return false;
      }
      const isValid = await verifyPin(pin, storedHash);
      if (isValid) {
        const workerName =
          (await SecureStorage.getWorkerName()) || "Health Worker";
        const userId = (await SecureStorage.getUserId()) || "local-user";
        set({
          isAuthenticated: true,
          workerName,
          userId,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  setupPin: async (pin: string, workerName: string) => {
    set({ isLoading: true });
    try {
      const pinHashVal = await hashPin(pin);
      await SecureStorage.savePinHash(pinHashVal);
      await SecureStorage.saveWorkerName(workerName);
      const userId = `local-${Date.now().toString(36)}`;
      await SecureStorage.saveUserId(userId);

      set({
        userId,
        workerName,
        pinSet: true,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStorage.clearAllSecureData();
    set({
      userId: "",
      workerName: "",
      isAuthenticated: false,
      pinSet: false,
    });
  },

  reset: () => {
    set({
      userId: "",
      workerName: "",
      isAuthenticated: false,
      pinSet: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import * as SecureStorage from "@/lib/secureStorage";
import { eq } from "drizzle-orm";
import { create } from "zustand";
import { hashPin, isPinSet, verifyPin } from "./pin";
import type { AuthSession } from "./types";

interface AuthState extends AuthSession {
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loginWithPin: (pin: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
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

  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        set({ isLoading: false });
        return false;
      }

      // 2. Fetch the health worker profile from Supabase
      const { data: worker, error: workerError } = await supabase
        .from("health_workers")
        .select("*")
        .eq("supabase_user_id", data.user.id)
        .single();

      if (workerError || !worker) {
        console.warn("No health worker profile found for user:", data.user.id);
        set({ isLoading: false });
        return false;
      }

      // 3. Save details to SecureStorage
      await SecureStorage.saveUserId(worker.id);
      await SecureStorage.saveWorkerName(worker.full_name);
      const pinSet = await isPinSet();

      // 4. Save to local SQLite users table to satisfy foreign key relationships
      const existingUser = db.select().from(users).where(eq(users.id, worker.id)).get();
      if (existingUser) {
        db.update(users)
          .set({
            fullName: worker.full_name,
            region: worker.region,
            supabaseUserId: data.user.id,
          })
          .where(eq(users.id, worker.id))
          .run();
      } else {
        db.insert(users)
          .values({
            id: worker.id,
            fullName: worker.full_name,
            region: worker.region,
            pinHash: "", // Not set yet, will be populated on PIN setup
            supabaseUserId: data.user.id,
            createdAt: worker.created_at || new Date().toISOString(),
          })
          .run();
      }

      set({
        userId: worker.id,
        workerName: worker.full_name,
        pinSet,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (e) {
      console.error("Email login failed:", e);
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

      const existingUserId = get().userId;
      const userId = existingUserId || `local-${Date.now().toString(36)}`;
      
      if (!existingUserId) {
        await SecureStorage.saveUserId(userId);
      }

      // Update or Insert in local SQLite database
      const existingUser = db.select().from(users).where(eq(users.id, userId)).get();
      if (existingUser) {
        db.update(users)
          .set({
            pinHash: pinHashVal,
            fullName: workerName,
          })
          .where(eq(users.id, userId))
          .run();
      } else {
        db.insert(users)
          .values({
            id: userId,
            fullName: workerName,
            region: "Local",
            pinHash: pinHashVal,
            supabaseUserId: "local",
            createdAt: new Date().toISOString(),
          })
          .run();
      }

      set({
        userId,
        workerName,
        pinSet: true,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      console.error("Setup PIN failed:", e);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStorage.clearAllSecureData();
    try {
      await supabase.auth.signOut();
    } catch {
      // silent
    }
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

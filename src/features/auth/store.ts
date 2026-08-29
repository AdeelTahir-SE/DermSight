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
  signUp: (email: string, password: string, fullName: string, region: string) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: "",
  workerName: "",
  email: "",
  isAuthenticated: false,
  pinSet: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const userId = await SecureStorage.getUserId();
      const workerName = await SecureStorage.getWorkerName();
      const email = await SecureStorage.getUserEmail();
      const pinSet = await isPinSet();

      set({
        userId: userId || "",
        workerName: workerName || "",
        email: email || "",
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
        const email = (await SecureStorage.getUserEmail()) || "";
        set({
          isAuthenticated: true,
          workerName,
          userId,
          email,
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
      let worker = null;
      const { data: existingWorker, error: workerError } = await supabase
        .from("health_workers")
        .select("*")
        .eq("supabase_user_id", data.user.id)
        .maybeSingle();

      if (existingWorker) {
        worker = existingWorker;
      } else {
        // Fallback: If no profile exists (e.g. database trigger wasn't applied yet),
        // create one dynamically using the user metadata populated on signup.
        const fullName = data.user.user_metadata?.full_name || "Health Worker";
        const region = data.user.user_metadata?.region || "Local";

        console.warn("No health worker profile found. Creating fallback profile for user:", data.user.id);
        const { data: newWorker, error: createError } = await supabase
          .from("health_workers")
          .insert({
            supabase_user_id: data.user.id,
            full_name: fullName,
            region: region,
          })
          .select()
          .single();

        if (createError || !newWorker) {
          console.error("Failed to create fallback profile on login:", createError);
          set({ isLoading: false });
          return false;
        }
        worker = newWorker;
      }

      // 3. Save details to SecureStorage
      await SecureStorage.saveUserId(worker.id);
      await SecureStorage.saveWorkerName(worker.full_name);
      await SecureStorage.saveUserEmail(email);
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

      // Set auth state first so that get_worker_id() resolves correctly if called
      set({
        userId: worker.id,
        workerName: worker.full_name,
        email,
        pinSet,
        isAuthenticated: true,
      });

      // 5. Trigger remote data pull to download patients and assessments for this worker
      try {
        const { pullRemoteData } = await import("@/features/sync/syncEngine");
        await pullRemoteData();
      } catch (pullError) {
        console.error("Failed to pull remote data on login:", pullError);
      }

      set({ isLoading: false });
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

      const email = get().email || (await SecureStorage.getUserEmail()) || "";

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
        email,
        pinSet: true,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      console.error("Setup PIN failed:", e);
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string, region: string) => {
    set({ isLoading: true });
    try {
      // 1. Authenticate / Create user with Supabase Auth with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            region: region,
          }
        }
      });

      if (error || !data.user) {
        set({ isLoading: false });
        return { success: false, error: error?.message || "Supabase Auth signup failed" };
      }

      // If email confirmation is enabled, session will be null
      const session = data.session;
      if (!session) {
        set({ isLoading: false });
        return { success: true, needsConfirmation: true };
      }

      // 2. Retrieve or Create the health worker profile in the remote database
      let worker = null;
      const { data: existingWorker } = await supabase
        .from("health_workers")
        .select("*")
        .eq("supabase_user_id", data.user.id)
        .maybeSingle();

      if (existingWorker) {
        worker = existingWorker;
      } else {
        const { data: newWorker, error: workerError } = await supabase
          .from("health_workers")
          .insert({
            supabase_user_id: data.user.id,
            full_name: fullName,
            region: region,
          })
          .select()
          .single();

        if (workerError || !newWorker) {
          console.error("Failed to create health worker profile:", workerError);
          set({ isLoading: false });
          return { success: false, error: workerError?.message || "Failed to create health worker profile." };
        }
        worker = newWorker;
      }

      // 3. Save details to SecureStorage
      await SecureStorage.saveUserId(worker.id);
      await SecureStorage.saveWorkerName(worker.full_name);
      await SecureStorage.saveUserEmail(email);
      const pinSet = false;

      // 4. Save to local SQLite users table to satisfy foreign key relationships
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

      set({
        userId: worker.id,
        workerName: worker.full_name,
        email,
        pinSet,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, needsConfirmation: false };
    } catch (e: any) {
      console.error("Email signup failed:", e);
      set({ isLoading: false });
      return { success: false, error: e?.message || "Email signup failed" };
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
      email: "",
      isAuthenticated: false,
      pinSet: false,
    });
  },

  reset: () => {
    set({
      userId: "",
      workerName: "",
      email: "",
      isAuthenticated: false,
      pinSet: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));

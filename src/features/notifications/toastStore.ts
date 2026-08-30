import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { id, message, type };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Quick access helpers
export const toast = {
  success: (msg: string) => useToastStore.getState().showToast(msg, "success"),
  error: (msg: string) => useToastStore.getState().showToast(msg, "error"),
  warning: (msg: string) => useToastStore.getState().showToast(msg, "warning"),
  info: (msg: string) => useToastStore.getState().showToast(msg, "info"),
};

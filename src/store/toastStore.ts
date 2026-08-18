import { create } from "zustand";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export type ToastActionOptions = {
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

function makeId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ToastState {
  items: ToastItem[];
  add: (type: ToastType, message: string, options?: ToastActionOptions) => string;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  items: [],
  add: (type, message, options) => {
    const id = makeId();
    set((s) => ({
      items: [
        ...s.items,
        {
          id,
          type,
          message,
          actionLabel: options?.actionLabel,
          actionHref: options?.actionHref,
          onAction: options?.onAction,
        },
      ],
    }));
    return id;
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Show a success toast. */
export function toastSuccess(message: string, options?: ToastActionOptions): string {
  return useToastStore.getState().add("success", message, options);
}

/** Show an error toast. */
export function toastError(message: string): string {
  return useToastStore.getState().add("error", message);
}

/** Show a warning toast. */
export function toastWarning(message: string): string {
  return useToastStore.getState().add("warning", message);
}

/** Show an info toast. */
export function toastInfo(message: string, options?: ToastActionOptions): string {
  return useToastStore.getState().add("info", message, options);
}

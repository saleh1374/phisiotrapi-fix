"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Tokens, User } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  /** True once the persisted session has been rehydrated from storage. */
  hasHydrated: boolean;
  setAuth: (tokens: Tokens, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
}

/** SSR-safe fallback storage: never touches the DOM. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Client-side auth store, persisted to localStorage.
 * SSR-safe: on the server the storage is a no-op, so tokens never leak.
 */
const storage = createJSONStorage(() =>
  typeof window !== "undefined" ? localStorage : noopStorage
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setAuth: (tokens, user) =>
        set({ accessToken: tokens.access, refreshToken: tokens.refresh, user }),
      setUser: (user) => set({ user }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "physio-auth",
      storage,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
      onRehydrateStorage: () => (state) => {
        // Guard effects must wait for this before redirecting, otherwise a
        // hard refresh on a protected page kicks the user to /login.
        state?.setHydrated(true);
      },
    }
  )
);
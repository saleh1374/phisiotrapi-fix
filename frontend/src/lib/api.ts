"use client";

import { useAuthStore } from "@/stores/auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const detail =
      (data as { detail?: string })?.detail ??
      "مشکلی در ارتباط با سرور رخ داد. لطفاً دوباره تلاش کنید.";
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Extract a human-readable message from a DRF error payload. */
export function errorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  const firstKey = Object.keys(d)[0];
  if (firstKey) {
    const val = d[firstKey];
    if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    if (typeof val === "string") return val;
  }
  return fallback;
}

async function rawFetch(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (withAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = (await res.json()) as { access: string };
    useAuthStore.setState({ accessToken: data.access });
    return data.access;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch with automatic one-shot token refresh.
 * Throws ApiError on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  let res = await rawFetch(path, options, withAuth);

  // One-shot refresh on 401, then retry the original request.
  // rawFetch re-reads the fresh token from the store and re-applies the
  // same headers (Content-Type, Accept, ...) as the first attempt.
  if (res.status === 401 && withAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawFetch(path, options, withAuth);
    }
  }

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, data);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
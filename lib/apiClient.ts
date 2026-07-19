const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

type FetchOptions = RequestInit & { requiresAuth?: boolean; token?: string; suppressGlobalLoading?: boolean };

// Centralized fetch wrapper that conditionally attaches Authorization header.
export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {},
  // allow token override; otherwise read from localStorage when requiresAuth is true
): Promise<Response> {
  const { requiresAuth = false, token, headers: optHeaders, suppressGlobalLoading = false, ...rest } = options as any;

  // If body is FormData, do not set Content-Type so browser sets the correct boundary
  const isFormData = (options as any).body instanceof FormData;
  // Use a plain object so we can index into it safely in TypeScript
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((optHeaders as Record<string, string>) || {}),
  };

  let authToken = token;
  if (requiresAuth && !authToken) {
    try {
      if (typeof window !== "undefined") {
        authToken = localStorage.getItem("auth_token") || undefined;
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  // notify global loader if available
  if (!suppressGlobalLoading && typeof window !== "undefined") {
    try {
      (window as any).__api_loader_inc?.();
    } catch (e) {
      // ignore
    }
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers,
    });
    return res;
  } finally {
    if (!suppressGlobalLoading && typeof window !== "undefined") {
      try {
        (window as any).__api_loader_dec?.();
      } catch (e) {
        // ignore
      }
    }
  }
}

export default apiFetch;

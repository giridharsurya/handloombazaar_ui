const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

type FetchOptions = RequestInit & { requiresAuth?: boolean; token?: string };

// Centralized fetch wrapper that conditionally attaches Authorization header.
export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {},
  // allow token override; otherwise read from localStorage when requiresAuth is true
): Promise<Response> {
  const { requiresAuth = false, token, headers: optHeaders, ...rest } = options;

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

  return fetch(url, {
    ...rest,
    headers,
  });
}

export default apiFetch;

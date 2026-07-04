// Normalize image sources for dev and production.
export default function resolveImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  const s = String(src).trim();
  if (!s) return undefined;

  // Absolute URLs (http(s) or data URIs) are returned as-is
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;

  // If it's a root-relative path (e.g. /static/...), prefix with API base URL for dev
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  // Handle missing leading slash for stored paths like "static/uploads/..."
  if (s.startsWith("/")) return `${apiBase}${s}`;
  if (s.startsWith("static/") || s.includes("/static/")) {
    const path = s.startsWith("/") ? s : `/${s}`;
    return `${apiBase}${path}`;
  }

  // Otherwise return as-is (could be already suitable for <img src>)
  return s;
}

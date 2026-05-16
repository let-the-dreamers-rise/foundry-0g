const configuredApiBase = import.meta.env.VITE_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export const API_BASE_URL = configuredApiBase;

export function apiUrl(path: string) {
  if (!configuredApiBase) return path;
  return `${configuredApiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

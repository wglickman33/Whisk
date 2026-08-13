const DEFAULT_TORI_URL = "https://torihome.netlify.app";

export function getToriUrl(): string {
  const fromEnv = import.meta.env.VITE_TORI_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return DEFAULT_TORI_URL;
}

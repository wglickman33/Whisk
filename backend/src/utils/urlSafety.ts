export class UrlSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlSafetyError";
  }
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0") return true;
  if (host === "::1" || host === "[::1]") return true;
  if (host.startsWith("127.")) return true;
  if (host.includes(":")) return true;
  return isPrivateIpv4(host);
}

/** Validates a URL for server-side fetch (blocks SSRF targets). */
export function assertSafeFetchUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UrlSafetyError("Invalid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlSafetyError("Only http and https URLs are allowed.");
  }

  if (url.username || url.password) {
    throw new UrlSafetyError("URLs with credentials are not allowed.");
  }

  if (isBlockedHostname(url.hostname)) {
    throw new UrlSafetyError("That URL is not allowed.");
  }

  return url;
}

/** Resolve a redirect Location header against a base URL, re-validating for SSRF. */
export function resolveRedirectUrl(location: string, base: URL): URL {
  return assertSafeFetchUrl(new URL(location, base).toString());
}

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

/** Fetch with manual redirect handling so each hop is SSRF-checked. */
export async function safeFetch(
  raw: string,
  init: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  let url = assertSafeFetchUrl(raw);
  const { signal: callerSignal, redirect: _redirect, ...rest } = init;
  const timeoutSignal = AbortSignal.timeout(DEFAULT_FETCH_TIMEOUT_MS);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;

  let response = await fetch(url.toString(), { ...rest, redirect: "manual", signal });

  for (let i = 0; i < maxRedirects; i++) {
    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new UrlSafetyError("Redirect response missing Location header.");
    }

    url = resolveRedirectUrl(location, url);
    response = await fetch(url.toString(), { ...rest, redirect: "manual", signal });
  }

  throw new UrlSafetyError("Too many redirects.");
}

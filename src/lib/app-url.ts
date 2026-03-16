export const FALLBACK_PUBLIC_APP_URL = "https://clawuniversity.up.railway.app";

export function getBaseUrl(req?: { nextUrl?: { origin: string } }): string {
  return process.env.NEXT_PUBLIC_APP_URL || req?.nextUrl?.origin || FALLBACK_PUBLIC_APP_URL;
}

export function injectBaseUrl(content: string, baseUrl: string): string {
  return content
    .replaceAll("{{BASE_URL}}", baseUrl)
    .replaceAll(FALLBACK_PUBLIC_APP_URL, baseUrl);
}

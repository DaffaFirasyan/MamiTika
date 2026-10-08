const localOrigin = "http://localhost:3000";

export function getSiteOrigin(): URL {
  const previewOrigin = process.env.CONTEXT === "deploy-preview" ? process.env.DEPLOY_PRIME_URL : undefined;
  const value = previewOrigin ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? localOrigin;
  const url = new URL(value);
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) {
    throw new Error("Public site URL must be HTTPS outside local development and must not contain credentials.");
  }
  return new URL(url.origin);
}

export function canonicalUrl(path: string): string {
  const url = getSiteOrigin();
  url.pathname = path.startsWith("/") ? path : `/${path}`;
  return url.href;
}

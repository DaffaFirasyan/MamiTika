import type { NextConfig } from "next";

function supabaseImagePattern() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return [];
  try {
    const url = new URL(value);
    const remoteProject = url.protocol === "https:" && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname);
    const localProject = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!remoteProject && !localProject) return [];
    return [{
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/catalog-images/**",
      search: "",
    }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: { remotePatterns: supabaseImagePattern() },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/gallery", destination: "/galeri", permanent: true },
    ];
  },
};

export default nextConfig;

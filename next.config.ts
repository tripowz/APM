import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  }
};

if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  const { initOpenNextCloudflareForDev } = await import(
    "@opennextjs/cloudflare"
  );

  initOpenNextCloudflareForDev();
}

export default nextConfig;

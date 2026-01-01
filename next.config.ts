import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const isDev = process.env.NODE_ENV !== "production";

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "baawa.ng",
    port: "",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "bhwywfigcyotkxbujivm.supabase.co",
    port: "",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "euzanxxdjyfbhzxlepkc.supabase.co",
    port: "",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "pos.baawa.ng",
    port: "",
    pathname: "/**",
  },
];

if (isDev) {
  remotePatterns.push(
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "picsum.photos",
      port: "",
      pathname: "/**",
    },
  );
}

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // PWA Configuration
  experimental: {
    webVitalsAttribution: ["CLS", "LCP"],
  },
  // Service Worker Support
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
              "frame-src 'self' https://vercel.live",
            ].join("; "),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 31, // 31 days to stretch optimizer cache
    formats: ["image/webp"],
    remotePatterns,
    unoptimized: true,
  },
};

export default nextConfig;

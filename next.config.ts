import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Every image here is already served from an external CDN (Supabase
    // Storage or Picsum), so Next's own optimization proxy would just be
    // re-fetching and re-resizing an already-optimized remote image on
    // every request — the thing that was timing out (500 on /_next/image).
    // Skipping it removes that proxy hop entirely; browsers still get a
    // real image, just without Next's additional resize/reformat pass.
    unoptimized: true,
  },
};

export default nextConfig;

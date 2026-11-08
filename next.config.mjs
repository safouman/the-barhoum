import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    const longCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    const authHeaders = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];

    return [
      ...(process.env.VERCEL_ENV === "preview"
        ? [
            { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
            { source: "/:auth(login|register|forgot-password|reset-password|verify-email|confirm-email|account)", headers: authHeaders },
            { source: "/admin/:path*", headers: authHeaders },
          ]
        : []),
      {
        source: "/fonts/:path*",
        headers: longCache,
      },
      {
        source: "/images/:path*",
        headers: longCache,
      },
      {
        source: "/audio/:path*",
        headers: longCache,
      },
      {
        source: "/docs/:path*",
        headers: longCache,
      },
    ];
  },
};

export default withPayload(nextConfig);

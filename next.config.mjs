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

    return [
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

export default nextConfig;

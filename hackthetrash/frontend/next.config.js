/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    // App Router: avoid bundling undici (private #fields) pulled in by @vercel/blob 2.x.
    serverComponentsExternalPackages: ["pg", "@vercel/blob", "undici"]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const ext = config.externals ?? [];
      config.externals = [
        ...(Array.isArray(ext) ? ext : [ext]),
        "@vercel/blob",
        "undici"
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  }
};
module.exports = nextConfig;

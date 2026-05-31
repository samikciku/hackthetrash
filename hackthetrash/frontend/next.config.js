/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    serverComponentsExternalPackages: ["pg"]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  }
};
module.exports = nextConfig;

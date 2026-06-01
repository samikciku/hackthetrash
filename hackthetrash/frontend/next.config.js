/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    instrumentationHook: true,
    // App Router: avoid bundling undici (private #fields) pulled in by @vercel/blob 2.x.
    serverComponentsExternalPackages: ["pg", "@vercel/blob", "undici"]
  },
  async headers() {
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc
    ].join("; ");
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Content-Security-Policy", value: csp }
    ];
    if (isProd) {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=15552000; includeSubDomains"
      });
    }
    return [{ source: "/:path*", headers: security }];
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

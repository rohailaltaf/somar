import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared package so Next.js resolves its imports from web's node_modules
  transpilePackages: ["@somar/shared"],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      // Force shared package imports to resolve from web's node_modules
      "@tanstack/react-query": "./node_modules/@tanstack/react-query",
      "react": "./node_modules/react",
    },
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plaid.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.plaid.com https://api.openai.com https://accounts.google.com; frame-src 'self' https://cdn.plaid.com https://accounts.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

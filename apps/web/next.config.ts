import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared package so Next.js resolves its imports from web's node_modules
  transpilePackages: ["@somar/shared"],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      // Stub out Node.js modules that sql.js conditionally requires
      fs: { browser: "./src/lib/stubs/empty.js" },
      path: { browser: "./src/lib/stubs/empty.js" },
      // Force shared package imports to resolve from web's node_modules
      "@tanstack/react-query": "./node_modules/@tanstack/react-query",
      "react": "./node_modules/react",
    },
  },
};

export default nextConfig;

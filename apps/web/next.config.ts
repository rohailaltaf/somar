import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+ default bundler)
  // sql.js has conditional requires for 'fs' that should be stubbed in browser
  turbopack: {
    resolveAlias: {
      // Stub out Node.js modules that sql.js conditionally requires
      fs: { browser: "./src/lib/stubs/empty.js" },
      path: { browser: "./src/lib/stubs/empty.js" },
    },
  },
};

export default nextConfig;

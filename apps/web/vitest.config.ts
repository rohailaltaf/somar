import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

// Load .env.development for tests
config({ path: ".env.development" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    // Increase timeout for tests that call OpenAI API
    testTimeout: 60000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

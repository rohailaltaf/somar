/**
 * Generate theme CSS for both web and mobile platforms.
 *
 * This is the single command to update themes across the entire monorepo.
 * Run: pnpm generate:theme
 *
 * What it does:
 * 1. Generates apps/web/src/app/globals.css (oklch values for web)
 * 2. Generates apps/mobile/global.css (RGB triplets for NativeWind)
 */

import { execSync } from "child_process";

console.log("🎨 Generating theme for all platforms...\n");

try {
  console.log("📦 Web (globals.css)...");
  execSync("pnpm --filter @somar/web generate:theme", {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  console.log("\n📱 Mobile (global.css)...");
  execSync("pnpm --filter @somar/mobile generate:theme", {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  console.log("\n✅ Theme generation complete!");
  console.log("   Both platforms are now in sync with @somar/shared/theme");
} catch (error) {
  console.error("\n❌ Theme generation failed:", error);
  process.exit(1);
}

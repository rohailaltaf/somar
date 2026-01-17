import { useAuth } from "../providers";
import { DemoBanner } from "./demo-banner";
import { usePathname, useRouter } from "expo-router";

// Don't show demo banner on these routes
const excludedRoutes = ["/(auth)", "(waitlist)"];

export function DemoBannerWrapper() {
  const { isDemoMode, exitDemoMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleExit = async () => {
    await exitDemoMode();
    router.replace("/(waitlist)");
  };

  // Don't render on excluded routes or if not in demo mode
  if (!isDemoMode || excludedRoutes.some((route) => pathname.includes(route))) {
    return null;
  }

  return <DemoBanner onExit={handleExit} />;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DemoBanner } from "./demo-banner";

// Don't show demo banner on these routes
const excludedRoutes = ["/login", "/signout", "/waitlist"];

export function DemoBannerWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check cookie on client
    const cookies = document.cookie.split(";");
    const demoCookie = cookies.find((c) => c.trim().startsWith("demo_mode="));
    setIsDemo(demoCookie?.includes("true") ?? false);
  }, [pathname]);

  const handleExit = async () => {
    try {
      const response = await fetch("/api/demo/exit", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        // Clear local state and redirect to waitlist
        setIsDemo(false);
        router.push("/waitlist");
      }
    } catch (error) {
      console.error("Failed to exit demo mode:", error);
    }
  };

  // Don't render on excluded routes or if not in demo mode
  if (!isDemo || excludedRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return <DemoBanner onExit={handleExit} />;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hexColors, shadows, spring } from "@somar/shared/theme";
import { House, Activity, Wallet } from "lucide-react";

// Mobile nav - simplified hierarchy
const mobileNavItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/transactions", label: "Activity", icon: Activity, matchPaths: ["/transactions", "/reports"] },
  { href: "/accounts", label: "Wallet", icon: Wallet, matchPaths: ["/accounts", "/categories", "/upload"] },
];

/**
 * Floating tab bar for mobile web viewport.
 * Matches the mobile app's FloatingTabBar exactly.
 */
export function FloatingTabBar() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      {/* Floating dock */}
      <div
        className="relative mx-auto max-w-[280px] bg-nav-dock rounded-2xl p-1.5"
        style={{ boxShadow: shadows.css.dock }}
      >
        {/* Outer border highlight */}
        <div className="absolute inset-0 rounded-2xl border border-white/[0.04] pointer-events-none" />

        {/* Inner container */}
        <div className="relative flex items-center">
          {/* Sliding indicator - the hero */}
          {mobileNavItems.map((item, index) => {
            const isActive = item.matchPaths
              ? item.matchPaths.some(path => pathname.startsWith(path)) || pathname === item.href
              : pathname === item.href;

            return isActive ? (
              <motion.div
                key="indicator"
                className="absolute inset-y-0 bg-nav-indicator rounded-xl"
                layoutId="nav-indicator-mobile"
                style={{
                  width: `${100 / mobileNavItems.length}%`,
                  left: `${(index * 100) / mobileNavItems.length}%`,
                  boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.06)'
                }}
                transition={{ type: "spring", ...spring.snappy }}
              />
            ) : null;
          })}

          {/* Nav items */}
          {mobileNavItems.map((item) => {
            const isActive = item.matchPaths
              ? item.matchPaths.some(path => pathname.startsWith(path)) || pathname === item.href
              : pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 z-10"
              >
                <motion.div
                  className="flex flex-col items-center justify-center py-2.5 gap-1"
                  whileTap={{ scale: 0.92 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon
                    className="w-5 h-5 transition-colors duration-200"
                    color={isActive ? undefined : hexColors.navInactiveIcon}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide transition-colors duration-200",
                      isActive ? "text-foreground" : "text-nav-inactive-label"
                    )}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

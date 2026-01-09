"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { hexColors } from "@somar/shared/theme";
import {
  LayoutDashboard,
  CreditCard,
  Tags,
  Receipt,
  Zap,
  Upload,
  BarChart3,
  LogOut,
  Sparkles,
  House,
  Activity,
  Wallet,
} from "lucide-react";

// Hex colors for Lucide icon color prop (doesn't support className)
const NAV_COLORS = hexColors;

// Desktop nav - all items
const desktopNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/tagger", label: "Tagger", icon: Zap, highlight: true },
  { href: "/upload", label: "Upload", icon: Upload },
];

// Mobile nav - simplified hierarchy
const mobileNavItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/transactions", label: "Activity", icon: Activity, matchPaths: ["/transactions", "/reports"] },
  { href: "/accounts", label: "Wallet", icon: Wallet, matchPaths: ["/accounts", "/categories", "/upload"] },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* ===== TOP HEADER ===== */}
      <nav className="sticky top-0 z-50 w-full">
        {/* Gradient line accent at top */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Main nav container with glass effect */}
        <div className="bg-surface/80 backdrop-blur-xl border-b border-border-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Brand */}
              <div className="flex items-center gap-10">
                <Link href="/" className="group flex items-center gap-3">
                  {/* Logo mark */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                  {/* Brand name */}
                  <span className="font-[family-name:var(--font-serif)] text-xl text-foreground tracking-tight">
                    Somar
                  </span>
                </Link>

                {/* Desktop Navigation Items */}
                <div className="hidden lg:flex items-center gap-1">
                  {desktopNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative group"
                      >
                        <motion.div
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground-secondary"
                          )}
                          whileHover={{ y: -1 }}
                          whileTap={{ y: 0 }}
                        >
                          <Icon className={cn(
                            "w-4 h-4 transition-colors",
                            item.highlight && !isActive && "text-primary"
                          )} />
                          <span>{item.label}</span>

                          {/* Highlight dot for tagger when it has items */}
                          {item.highlight && !isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </motion.div>

                        {/* Active indicator - glowing underline */}
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute -bottom-[1px] left-2 right-2 h-[2px]"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          >
                            <div className="w-full h-full bg-gradient-to-r from-primary via-primary/80 to-primary" />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary blur-sm" />
                          </motion.div>
                        )}

                        {/* Hover background */}
                        <div className={cn(
                          "absolute inset-0 rounded-lg transition-colors duration-200",
                          isActive
                            ? "bg-muted/50"
                            : "group-hover:bg-surface-elevated/50"
                        )} style={{ zIndex: -1 }} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right side - Sign out */}
              <div className="flex items-center gap-4">
                {/* Divider */}
                <div className="hidden lg:block w-[1px] h-6 bg-border" />

                {/* Sign out button */}
                <Link href="/signout">
                  <motion.button
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground-secondary transition-colors"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    <span className="hidden sm:inline">Sign out</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom shadow/glow for depth */}
        <div className="h-8 bg-gradient-to-b from-surface-deep/50 to-transparent pointer-events-none -mt-8 relative z-[-1]" />
      </nav>

      {/* ===== MOBILE BOTTOM NAV - Sculptural Float ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {/* Floating dock */}
        <div
          className="relative mx-auto max-w-[280px] bg-nav-dock rounded-2xl p-1.5"
          style={{
            boxShadow: `
              0 0 0 1px oklch(1 0 0 / 0.04),
              0 2px 4px -1px oklch(0 0 0 / 0.3),
              0 8px 20px -4px oklch(0 0 0 / 0.4),
              0 20px 40px -8px oklch(0 0 0 / 0.3)
            `
          }}
        >
          {/* Inner container with subtle top highlight */}
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
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
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
                      color={isActive ? undefined : NAV_COLORS.navInactiveIcon}
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

    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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

      {/* ===== MOBILE BOTTOM DOCK ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {/* Dock container */}
        <motion.div
          className="relative mx-auto max-w-xs"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.1 }}
        >
          {/* Glow effect behind dock */}
          <div className="absolute -inset-3 bg-gradient-to-t from-primary/25 via-primary/8 to-transparent rounded-[32px] blur-2xl opacity-70" />

          {/* Main dock */}
          <div className="relative bg-surface-elevated/95 backdrop-blur-2xl border border-border-subtle/60 rounded-2xl shadow-2xl shadow-black/50">
            {/* Inner highlight */}
            <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

            {/* Navigation items */}
            <div className="relative flex items-center justify-around px-2 py-2">
              {mobileNavItems.map((item) => {
                const isActive = item.matchPaths
                  ? item.matchPaths.some(path => pathname.startsWith(path)) || pathname === item.href
                  : pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex-1"
                  >
                    <motion.div
                      className={cn(
                        "relative flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {/* Active background pill */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="mobile-nav-pill"
                            className="absolute inset-1 bg-primary/12 rounded-xl"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Icon container */}
                      <motion.div
                        className="relative z-10"
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          y: isActive ? -2 : 0
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Icon
                          className="w-6 h-6 transition-colors duration-200"
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </motion.div>

                      {/* Label */}
                      <motion.span
                        className={cn(
                          "relative z-10 text-xs font-medium mt-1.5 transition-colors duration-200",
                          isActive ? "text-primary" : "text-foreground-muted"
                        )}
                        animate={{
                          opacity: isActive ? 1 : 0.6
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        {item.label}
                      </motion.span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

    </>
  );
}

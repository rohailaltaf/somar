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

      {/* ===== MOBILE BOTTOM DOCK - Liquid Crystal Design ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Ambient glow layer */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="relative px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pointer-events-auto">
          <motion.nav
            className="relative mx-auto max-w-[320px]"
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.15,
              mass: 0.8
            }}
          >
            {/* Outer glow - golden ambient */}
            <div className="absolute -inset-4 bg-gradient-to-t from-gold/20 via-primary/10 to-transparent rounded-[40px] blur-3xl opacity-60" />

            {/* Crystal shadow stack - creates depth */}
            <div className="absolute inset-0 rounded-[22px] bg-black/40 blur-xl translate-y-4" />
            <div className="absolute inset-0 rounded-[22px] bg-black/30 blur-md translate-y-2" />

            {/* Main crystal container */}
            <div className="relative bg-gradient-to-b from-surface-elevated/98 to-surface/95 backdrop-blur-3xl rounded-[20px] border border-white/[0.08] overflow-hidden">
              {/* Prismatic top edge highlight */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              {/* Inner crystalline reflection */}
              <div className="absolute inset-[1px] rounded-[19px] bg-gradient-to-br from-white/[0.07] via-transparent to-white/[0.02] pointer-events-none" />

              {/* Subtle noise texture for glass feel */}
              <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Navigation items container */}
              <div className="relative flex items-center px-3 py-3">
                {mobileNavItems.map((item, index) => {
                  const isActive = item.matchPaths
                    ? item.matchPaths.some(path => pathname.startsWith(path)) || pathname === item.href
                    : pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex-1 group"
                    >
                      <motion.div
                        className="relative flex flex-col items-center justify-center py-2.5 px-3"
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {/* Active indicator - crystalline light beam */}
                        <AnimatePresence mode="wait">
                          {isActive && (
                            <motion.div
                              layoutId="crystal-indicator"
                              className="absolute inset-x-2 -top-3 bottom-0"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            >
                              {/* Vertical light beam */}
                              <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-gold/25 via-gold/10 to-transparent rounded-t-full" />

                              {/* Top accent line - gold */}
                              <motion.div
                                className="absolute -top-0 inset-x-3 h-[2px] rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, transparent, oklch(0.78 0.12 75), transparent)',
                                  boxShadow: '0 0 12px 2px oklch(0.78 0.12 75 / 0.5)'
                                }}
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                              />

                              {/* Ambient glow behind icon */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gold/15 rounded-full blur-xl" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Icon with crystal effect */}
                        <motion.div
                          className="relative z-10"
                          animate={{
                            scale: isActive ? 1.12 : 1,
                            y: isActive ? -1 : 0
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {/* Icon glow when active */}
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 blur-md"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{ color: 'oklch(0.78 0.12 75)' }}
                            >
                              <Icon className="w-6 h-6" strokeWidth={2.5} />
                            </motion.div>
                          )}

                          <Icon
                            className={cn(
                              "w-6 h-6 transition-all duration-300 relative z-10",
                              isActive
                                ? "text-gold drop-shadow-[0_0_8px_oklch(0.78_0.12_75_/_0.5)]"
                                : "text-foreground-muted group-hover:text-foreground-secondary"
                            )}
                            strokeWidth={isActive ? 2.5 : 1.75}
                          />
                        </motion.div>

                        {/* Label with refined typography */}
                        <motion.span
                          className={cn(
                            "relative z-10 text-[11px] font-medium mt-1.5 tracking-wide transition-all duration-300",
                            isActive
                              ? "text-gold"
                              : "text-foreground-dim group-hover:text-foreground-muted"
                          )}
                          animate={{
                            y: isActive ? 0 : 1,
                            opacity: isActive ? 1 : 0.7
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {item.label}
                        </motion.span>

                        {/* Subtle divider between items (not on last) */}
                        {index < mobileNavItems.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom edge subtle shadow */}
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/20" />
            </div>

            {/* Reflection underneath - luxury mirror effect */}
            <div
              className="absolute inset-x-4 -bottom-3 h-6 rounded-[16px] opacity-20"
              style={{
                background: 'linear-gradient(to bottom, oklch(0.16 0.02 260 / 0.8), transparent)',
                filter: 'blur(4px)',
                transform: 'scaleY(-0.4) translateY(-100%)'
              }}
            />
          </motion.nav>
        </div>
      </div>

    </>
  );
}

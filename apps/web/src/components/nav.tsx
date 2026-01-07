"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/tagger", label: "Tagger", icon: Zap, highlight: true },
  { href: "/upload", label: "Upload", icon: Upload },
];

export function Nav() {
  const pathname = usePathname();

  return (
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
                <span className="font-[family-name:var(--font-serif)] text-xl text-foreground hidden sm:inline tracking-tight">
                  Somar
                </span>
              </Link>

              {/* Navigation Items */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
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

            {/* Right side - Mobile menu & Sign out */}
            <div className="flex items-center gap-4">
              {/* Mobile navigation */}
              <div className="flex lg:hidden items-center gap-1 overflow-x-auto scrollbar-none -mx-2 px-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-all shrink-0",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground-secondary hover:bg-surface-elevated/50"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-[1px] h-6 bg-border" />

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
  );
}

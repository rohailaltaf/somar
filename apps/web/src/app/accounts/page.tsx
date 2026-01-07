"use client";

import { useAccounts } from "@somar/shared/hooks";
import { usePlaidItems } from "@/hooks/use-plaid-items";
import { Nav } from "@/components/nav";
import { AccountsInterface } from "./accounts-interface";
import { motion } from "framer-motion";

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-surface-deep overflow-hidden">
      <Nav />
      <main className="relative">
        {/* Deep Space Background - decorative gradients stay inline */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-[oklch(0.25_0.15_280_/_0.12)] rounded-full blur-[150px] animate-breathe" />
          <div className="absolute top-[20%] right-[-15%] w-[50vw] h-[60vh] bg-[oklch(0.35_0.12_200_/_0.08)] rounded-full blur-[120px] animate-breathe delay-300" />
          <div className="absolute top-[10%] right-[15%] w-[35vw] h-[35vh] bg-[oklch(0.5_0.1_75_/_0.06)] rounded-full blur-[100px] animate-breathe delay-200" />
          <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vh] bg-[oklch(0.45_0.18_260_/_0.06)] rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(var(--muted-foreground) 1px, transparent 1px),
                               linear-gradient(90deg, var(--muted-foreground) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Accounts
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Connect banks for automatic syncing or add manual accounts for CSV imports
            </p>
          </motion.div>

          <AccountsContent />
        </div>
      </main>
    </div>
  );
}

function AccountsContent() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: plaidItems = [], isLoading: loadingPlaidItems } = usePlaidItems();

  if (loadingAccounts || loadingPlaidItems) {
    return <AccountsSkeleton />;
  }

  return <AccountsInterface accounts={accounts} plaidItems={plaidItems} />;
}

function AccountsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-11 w-44 rounded-xl bg-surface animate-pulse" />
        <div className="h-11 w-36 rounded-xl bg-surface-elevated animate-pulse" />
      </div>

      {/* Connected Institutions skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-surface rounded animate-pulse" />
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface p-6 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-surface-elevated" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-surface-elevated rounded" />
                  <div className="h-3 w-20 bg-surface rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-7 w-24 bg-surface-elevated rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Accounts skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-surface rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-surface animate-pulse"
              style={{ animationDelay: `${(i + 2) * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

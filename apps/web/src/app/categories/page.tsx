"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories, useCategoriesWithBudgets } from "@somar/shared/hooks";
import { Nav } from "@/components/nav";
import { CategoriesList } from "./categories-list";
import { CreateCategoryDialog } from "./create-category-dialog";
import { getCurrentMonth, type Category } from "@somar/shared";
import { spring } from "@somar/shared/theme";
import {
  Wallet,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";

const tabs = [
  { id: "spending", label: "Spending", icon: Wallet },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "transfer", label: "Transfers", icon: ArrowLeftRight },
] as const;

type TabId = typeof tabs[number]["id"];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("spending");
  const currentMonth = useMemo(() => getCurrentMonth(), []);

  const { data: spendingCategories = [], isLoading: loadingSpending } = useCategoriesWithBudgets(currentMonth);
  const { categories: incomeCategories = [], isLoading: loadingIncome } = useCategories("income");
  const { categories: transferCategories = [], isLoading: loadingTransfer } = useCategories("transfer");

  const isLoading = loadingSpending || loadingIncome || loadingTransfer;

  // Convert income and transfer categories to match the expected format
  const incomeCategoriesWithBudgets = incomeCategories.map((cat: Category) => ({
    ...cat,
    currentBudget: null,
    allBudgets: [],
  }));

  const transferCategoriesWithBudgets = transferCategories.map((cat: Category) => ({
    ...cat,
    currentBudget: null,
    allBudgets: [],
  }));

  const getCategoriesForTab = (tab: TabId) => {
    switch (tab) {
      case "spending": return spendingCategories;
      case "income": return incomeCategoriesWithBudgets;
      case "transfer": return transferCategoriesWithBudgets;
    }
  };

  const getCountForTab = (tab: TabId) => {
    switch (tab) {
      case "spending": return spendingCategories.length;
      case "income": return incomeCategories.length;
      case "transfer": return transferCategories.length;
    }
  };

  return (
    <div className="min-h-screen bg-surface-deep overflow-hidden">
      <Nav />
      <main className="relative">
        {/* Deep Space Background - decorative gradients stay inline */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] right-[-10%] w-[60vw] h-[60vh] bg-[oklch(0.28_0.12_310_/_0.15)] rounded-full blur-[150px] animate-breathe" />
          <div className="absolute top-[40%] left-[-15%] w-[45vw] h-[55vh] bg-[oklch(0.3_0.1_220_/_0.1)] rounded-full blur-[120px] animate-breathe delay-500" />
          <div className="absolute bottom-[-15%] right-[15%] w-[50vw] h-[45vh] bg-[oklch(0.35_0.1_50_/_0.08)] rounded-full blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(var(--muted-foreground) 1px, transparent 1px),
                               linear-gradient(90deg, var(--muted-foreground) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Categories
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Organize your spending, income, and transfers
                </p>
              </div>
              <CreateCategoryDialog />
            </div>
          </motion.div>

          {/* Premium Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="relative inline-flex p-1 rounded-2xl bg-surface border border-border-subtle">
              {/* Animated background pill */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-surface-elevated to-surface-overlay"
                layoutId="activeTab"
                style={{
                  left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`,
                  width: `${100 / tabs.length}%`,
                }}
                transition={{ type: "spring", ...spring.snappy }}
              />

              {/* Glow effect for active tab */}
              <motion.div
                className="absolute top-0 bottom-0 rounded-2xl pointer-events-none"
                style={{
                  left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`,
                  width: `${100 / tabs.length}%`,
                  boxShadow: "0 0 30px var(--primary)",
                  opacity: 0.15,
                }}
                layoutId="activeTabGlow"
                transition={{ type: "spring", ...spring.snappy }}
              />

              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = getCountForTab(tab.id);

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-colors duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground-secondary"
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? "text-primary" : ""
                    }`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Categories Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {isLoading ? (
                <CategoriesSkeleton />
              ) : (
                <CategoriesList
                  categories={getCategoriesForTab(activeTab)}
                  categoryType={activeTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="h-[140px] rounded-2xl bg-surface border border-border-subtle animate-pulse"
        />
      ))}
    </div>
  );
}

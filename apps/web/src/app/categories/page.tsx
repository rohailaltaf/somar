"use client";

import { useMemo } from "react";
import { useCategories, useCategoriesWithBudgets } from "@/hooks";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { CategoriesList } from "./categories-list";
import { CreateCategoryDialog } from "./create-category-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { getCurrentMonth } from "@/lib/utils";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Categories"
          description="Manage spending, income, and transfer categories"
          action={<CreateCategoryDialog />}
        />
        <div className="mt-8">
          <CategoriesContent />
        </div>
      </main>
    </div>
  );
}

function CategoriesContent() {
  const currentMonth = useMemo(() => getCurrentMonth(), []);

  const { data: spendingCategories = [], isLoading: loadingSpending } = useCategoriesWithBudgets(currentMonth);
  const { categories: incomeCategories = [], isLoading: loadingIncome } = useCategories("income");
  const { categories: transferCategories = [], isLoading: loadingTransfer } = useCategories("transfer");

  if (loadingSpending || loadingIncome || loadingTransfer) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Convert income and transfer categories to match the expected format
  const incomeCategoriesWithBudgets = incomeCategories.map(cat => ({
    ...cat,
    currentBudget: null,
    allBudgets: [],
  }));
  
  const transferCategoriesWithBudgets = transferCategories.map(cat => ({
    ...cat,
    currentBudget: null,
    allBudgets: [],
  }));

  return (
    <Tabs defaultValue="spending">
      <TabsList>
        <TabsTrigger value="spending">Spending ({spendingCategories.length})</TabsTrigger>
        <TabsTrigger value="income">Income ({incomeCategories.length})</TabsTrigger>
        <TabsTrigger value="transfer">Transfers ({transferCategories.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="spending" className="mt-6">
        <CategoriesList categories={spendingCategories} />
      </TabsContent>
      <TabsContent value="income" className="mt-6">
        <CategoriesList categories={incomeCategoriesWithBudgets} />
      </TabsContent>
      <TabsContent value="transfer" className="mt-6">
        <CategoriesList categories={transferCategoriesWithBudgets} />
      </TabsContent>
    </Tabs>
  );
}

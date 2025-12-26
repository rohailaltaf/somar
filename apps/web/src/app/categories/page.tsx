import { Suspense } from "react";
import { getCategoriesWithBudgets, getCategories } from "@/actions/categories";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { CategoriesList } from "./categories-list";
import { CreateCategoryDialog } from "./create-category-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CategoriesPage() {
  const [spendingCategories, incomeCategories, transferCategories] = await Promise.all([
    getCategoriesWithBudgets(),
    getCategories("income"),
    getCategories("transfer"),
  ]);

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
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Categories"
          description="Manage spending, income, and transfer categories"
          action={<CreateCategoryDialog />}
        />
        <div className="mt-8">
          <Tabs defaultValue="spending">
            <TabsList>
              <TabsTrigger value="spending">Spending ({spendingCategories.length})</TabsTrigger>
              <TabsTrigger value="income">Income ({incomeCategories.length})</TabsTrigger>
              <TabsTrigger value="transfer">Transfers ({transferCategories.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="spending" className="mt-6">
              <Suspense fallback={<div>Loading...</div>}>
                <CategoriesList categories={spendingCategories} />
              </Suspense>
            </TabsContent>
            <TabsContent value="income" className="mt-6">
              <Suspense fallback={<div>Loading...</div>}>
                <CategoriesList categories={incomeCategoriesWithBudgets} />
              </Suspense>
            </TabsContent>
            <TabsContent value="transfer" className="mt-6">
              <Suspense fallback={<div>Loading...</div>}>
                <CategoriesList categories={transferCategoriesWithBudgets} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}


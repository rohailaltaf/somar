"use client";

import { useAccounts, useCategories } from "@somar/shared/hooks";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { TransactionsClient } from "./transactions-client";
import { Loader2 } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Transactions"
          description="View and manage all your transactions"
        />
        <div className="mt-6">
          <TransactionsContent />
        </div>
      </main>
    </div>
  );
}

function TransactionsContent() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { categories = [], isLoading: loadingCategories } = useCategories();

  if (loadingAccounts || loadingCategories) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TransactionsClient
      accounts={accounts}
      categories={categories}
    />
  );
}

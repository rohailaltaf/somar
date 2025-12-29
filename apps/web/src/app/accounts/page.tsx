"use client";

import { useAccounts, usePlaidItems } from "@/hooks";
import { useDatabase } from "@/hooks/use-database";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { AccountsInterface } from "./accounts-interface";
import { Loader2 } from "lucide-react";

export default function AccountsPage() {
  const { isReady, isLoading: dbLoading } = useDatabase();
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: plaidItems = [], isLoading: loadingPlaidItems } = usePlaidItems();

  const isLoading = dbLoading || !isReady || loadingAccounts || loadingPlaidItems;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Accounts"
            description="Manage your bank accounts and credit cards. Connect your bank for automatic syncing or add manual accounts for CSV imports."
          />
          <div className="mt-8 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Accounts"
          description="Manage your bank accounts and credit cards. Connect your bank for automatic syncing or add manual accounts for CSV imports."
        />
        <div className="mt-8">
          <AccountsInterface accounts={accounts} plaidItems={plaidItems} />
        </div>
      </main>
    </div>
  );
}

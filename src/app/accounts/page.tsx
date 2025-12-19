import { Suspense } from "react";
import { getAccountsWithPlaidInfo } from "@/actions/accounts";
import { getPlaidItems } from "@/actions/plaid";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { AccountsInterface } from "./accounts-interface";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AccountsPage() {
  const [accounts, plaidItems] = await Promise.all([
    getAccountsWithPlaidInfo(),
    getPlaidItems(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Accounts"
          description="Manage your bank accounts and credit cards. Connect your bank for automatic syncing or add manual accounts for CSV imports."
        />
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <AccountsInterface accounts={accounts} plaidItems={plaidItems} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

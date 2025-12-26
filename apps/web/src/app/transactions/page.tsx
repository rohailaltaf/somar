import { getAccounts } from "@/actions/accounts";
import { getCategories } from "@/actions/categories";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { TransactionsClient } from "./transactions-client";

export default async function TransactionsPage() {
  // Only load metadata - transactions will be loaded client-side for fast initial render
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Transactions"
          description="View and manage all your transactions"
        />
        <div className="mt-6">
          <TransactionsClient
            accounts={accounts}
            categories={categories}
          />
        </div>
      </main>
    </div>
  );
}


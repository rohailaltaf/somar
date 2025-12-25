import { getAccounts } from "@/actions/accounts";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { UploadInterface } from "./upload-interface";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UploadPage() {
  const accounts = await getAccounts();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Upload Transactions"
          description="Import transactions from a CSV file"
        />
        <div className="mt-8">
          {accounts.length > 0 ? (
            <UploadInterface accounts={accounts} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No accounts yet</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  Create an account first to upload transactions
                </p>
                <Link href="/accounts" className="mt-6">
                  <Button>Create Account</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}








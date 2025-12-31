"use client";

import { useCategories, useUnconfirmedTransactions } from "@/hooks";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { TaggerInterface } from "./tagger-interface";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TaggerPage() {
  const { categories = [], isLoading: loadingCategories } = useCategories();
  const { data: transactions = [], isLoading: loadingTransactions } = useUnconfirmedTransactions();

  const isLoading = loadingCategories || loadingTransactions;
  const unconfirmedCount = transactions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Transaction Tagger"
          description={
            unconfirmedCount > 0
              ? `${unconfirmedCount} transaction${unconfirmedCount !== 1 ? "s" : ""} need${unconfirmedCount === 1 ? "s" : ""} review`
              : "All caught up!"
          }
        />
        <div className="mt-8">
          {transactions.length > 0 ? (
            <TaggerInterface
              initialTransactions={transactions}
              categories={categories}
              totalCount={unconfirmedCount}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-medium">All transactions reviewed!</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  You&apos;ve categorized all your transactions. Upload more to continue.
                </p>
                <Link href="/upload" className="mt-6">
                  <Button>Upload Transactions</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useAccounts } from "@/hooks";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { UploadInterface } from "./upload-interface";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Upload Transactions"
          description="Import transactions from a CSV file"
        />
        <div className="mt-8">
          <UploadContent />
        </div>
      </main>
    </div>
  );
}

function UploadContent() {
  const { data: accounts = [], isLoading } = useAccounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
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
    );
  }

  return <UploadInterface accounts={accounts} />;
}

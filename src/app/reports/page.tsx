import Link from "next/link";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Reports"
          description="Analyze your spending patterns and trends"
        />
        <div className="mt-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/reports/spending-overview">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Spending Overview</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View your total spending this month vs last month with a daily burn-up chart and category budget breakdown
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports/income-overview">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <TrendingDown className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Income Overview</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Track your total income by period with monthly breakdown and category analysis
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

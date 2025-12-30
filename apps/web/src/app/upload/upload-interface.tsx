"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTransactionMutations, useTransactions } from "@/hooks";
import {
  runTier1Dedup,
  chunkArray,
  LLM_API_BATCH_LIMIT,
  type TransactionForDedup,
  type DuplicateMatch,
  type UncertainPair,
} from "@somar/shared/dedup";
import {
  parseCSV,
  transformToTransactions,
  ColumnMapping,
  ParsedTransaction,
} from "@/lib/csv-parser";
import type { Account } from "@somar/shared";

// Simplified transaction type for post-dedup (no rawRow needed)
interface SimpleTransaction {
  date: string;
  description: string;
  amount: number;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

type Step = "select-account" | "upload" | "map-columns" | "confirm-signs" | "review-duplicates" | "preview" | "complete";

interface FlaggedTransaction {
  transaction: SimpleTransaction;
  reason: "already-exists";
  selected: boolean;
  originalIndex: number;
  confidence?: number;
  matchTier?: "deterministic" | "llm";
  matchedDescription?: string;
}

interface UniqueTransaction {
  transaction: SimpleTransaction;
  selected: boolean;
}

interface UploadInterfaceProps {
  accounts: Account[];
}

export function UploadInterface({ accounts }: UploadInterfaceProps) {
  const router = useRouter();
  const { createManyTransactions } = useTransactionMutations();

  const [step, setStep] = useState<Step>("select-account");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
  });
  const [uniqueTransactions, setUniqueTransactions] = useState<UniqueTransaction[]>([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState<FlaggedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [flipAmountSign, setFlipAmountSign] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<ParsedTransaction[]>([]);
  const [dedupStats, setDedupStats] = useState<{
    total: number;
    unique: number;
    duplicates: number;
    tier1Matches: number;
    tier2Matches: number;
    processingTimeMs: number;
  } | null>(null);

  // Fetch existing transactions for dedup (only for selected account)
  const { data: existingTransactions = [] } = useTransactions({
    accountId: selectedAccountId || undefined,
  });

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;

        // Parse CSV
        const result = parseCSV(content);
        setHeaders(result.headers);
        setRows(result.rows);
        setMapping(result.inferredMapping);
        setStep("map-columns");
      };
      reader.readAsText(file);
    },
    []
  );

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === "none" ? null : value,
    }));
  };

  const handleProceedToSignConfirmation = useCallback(() => {
    const transformed = transformToTransactions(rows, mapping);
    setPreviewTransactions(transformed);
    setStep("confirm-signs");
  }, [rows, mapping]);

  const handleAnalyzeDuplicates = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Analyzing transactions for duplicates...");
    const startTime = Date.now();

    let transformed = transformToTransactions(rows, mapping);

    // Apply sign flip if needed
    if (flipAmountSign) {
      transformed = transformed.map(t => ({
        ...t,
        amount: -t.amount,
      }));
    }

    try {
      // Prepare data for dedup
      const newForDedup: TransactionForDedup[] = transformed.map(t => ({
        description: t.description,
        amount: t.amount,
        date: t.date,
      }));

      const existingForDedup: TransactionForDedup[] = existingTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        date: t.date,
        plaidAuthorizedDate: t.plaidAuthorizedDate,
        plaidPostedDate: t.plaidPostedDate,
        plaidMerchantName: t.plaidMerchantName,
      }));

      // Step 1: Run Tier 1 (deterministic) matching locally
      const tier1Result = runTier1Dedup(newForDedup, existingForDedup);

      // Step 2: If uncertain pairs exist, call API for LLM verification (with batching)
      let finalDuplicates: DuplicateMatch[] = [...tier1Result.definiteMatches];
      let finalUnique: TransactionForDedup[] = [...tier1Result.unique];
      let tier2Matches = 0;

      if (tier1Result.uncertainPairs.length > 0) {
        setLoadingMessage("Verifying uncertain matches with AI...");

        // Batch API calls to respect the 100 pair limit
        const batches = chunkArray(tier1Result.uncertainPairs, LLM_API_BATCH_LIMIT);
        const processedNewTxs = new Set<string>();

        for (const batch of batches) {
          try {
            const response = await fetch("/api/dedup/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uncertainPairs: batch }),
            });

            const llmResult = await response.json();

            if (llmResult.success && llmResult.data) {
              // Add LLM-confirmed matches to duplicates
              for (const match of llmResult.data.matches) {
                const pair = batch.find(
                  (p: UncertainPair) =>
                    p.newTransaction.description === match.newTransactionDescription &&
                    p.candidate.id === match.candidateId
                );
                if (pair && !processedNewTxs.has(pair.newTransaction.description)) {
                  finalDuplicates.push({
                    transaction: pair.newTransaction,
                    matchedWith: pair.candidate,
                    confidence: match.confidence,
                    matchTier: "llm",
                  });
                  tier2Matches++;
                  processedNewTxs.add(pair.newTransaction.description);
                }
              }
            }
          } catch (error) {
            console.error("[CSV Upload] LLM verification batch failed:", error);
            // Continue with remaining batches
          }
        }

        // Add non-matches to unique (transactions that didn't match any candidate)
        const matchedDescriptions = new Set(
          finalDuplicates.map(d => d.transaction.description)
        );
        for (const pair of tier1Result.uncertainPairs) {
          if (!matchedDescriptions.has(pair.newTransaction.description)) {
            // Only add if not already in unique
            const alreadyInUnique = finalUnique.some(
              u => u.description === pair.newTransaction.description
            );
            if (!alreadyInUnique) {
              finalUnique.push(pair.newTransaction);
            }
          }
        }
      }

      // Convert results to component format
      const unique: UniqueTransaction[] = finalUnique.map(t => ({
        transaction: {
          description: t.description,
          amount: t.amount,
          date: t.date,
        },
        selected: true, // Default to import
      }));

      const flagged: FlaggedTransaction[] = finalDuplicates.map((d, index) => ({
        transaction: {
          description: d.transaction.description,
          amount: d.transaction.amount,
          date: d.transaction.date,
        },
        reason: "already-exists" as const,
        selected: false,
        originalIndex: index,
        confidence: d.confidence,
        matchTier: d.matchTier,
        matchedDescription: d.matchedWith.description,
      }));

      setUniqueTransactions(unique);
      setFlaggedTransactions(flagged);
      setDedupStats({
        total: newForDedup.length,
        unique: unique.length,
        duplicates: flagged.length,
        tier1Matches: tier1Result.definiteMatches.length,
        tier2Matches,
        processingTimeMs: Date.now() - startTime,
      });

      if (flagged.length > 0) {
        setStep("review-duplicates");
      } else {
        setStep("preview");
      }
    } catch (error) {
      console.error("Deduplication error:", error);
      toast.error("Error analyzing duplicates. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [rows, mapping, flipAmountSign, existingTransactions]);

  const toggleFlagged = (index: number) => {
    setFlaggedTransactions(prev => {
      const newFlagged = [...prev];
      newFlagged[index] = { ...newFlagged[index], selected: !newFlagged[index].selected };
      return newFlagged;
    });
  };

  const selectAllFlagged = (selected: boolean) => {
    setFlaggedTransactions(prev => prev.map(f => ({ ...f, selected })));
  };

  const toggleUnique = (index: number) => {
    setUniqueTransactions(prev => {
      const newUnique = [...prev];
      newUnique[index] = { ...newUnique[index], selected: !newUnique[index].selected };
      return newUnique;
    });
  };

  const selectAllUnique = (selected: boolean) => {
    setUniqueTransactions(prev => prev.map(u => ({ ...u, selected })));
  };

  const getTransactionsToImport = () => {
    const selectedUnique = uniqueTransactions
      .filter(u => u.selected)
      .map(u => u.transaction);
    const selectedFlagged = flaggedTransactions
      .filter(f => f.selected)
      .map(f => f.transaction);
    return [...selectedUnique, ...selectedFlagged];
  };

  const handleImport = () => {
    const toImport = getTransactionsToImport();

    if (toImport.length === 0) {
      toast.error("No transactions to import");
      return;
    }

    createManyTransactions.mutate(
      toImport.map((t) => ({
        accountId: selectedAccountId,
        description: t.description,
        amount: t.amount,
        date: t.date,
      })),
      {
        onSuccess: () => {
          setImportedCount(toImport.length);
          setStep("complete");
          toast.success(`Imported ${toImport.length} transactions`);
        },
        onError: () => {
          toast.error("Failed to import transactions");
        },
      }
    );
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedUniqueCount = uniqueTransactions.filter(u => u.selected).length;
  const selectedFlaggedCount = flaggedTransactions.filter(f => f.selected).length;

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {[
          { key: "select-account", label: "1" },
          { key: "upload", label: "2" },
          { key: "map-columns", label: "3" },
          { key: "confirm-signs", label: "4" },
          ...(flaggedTransactions.length > 0 || step === "review-duplicates" 
            ? [{ key: "review-duplicates", label: "5" }] 
            : []),
          { key: "preview", label: flaggedTransactions.length > 0 ? "6" : "5" },
          { key: "complete", label: flaggedTransactions.length > 0 ? "7" : "6" },
        ].map((s, i, arr) => {
          const steps = arr.map(x => x.key);
          const currentIdx = steps.indexOf(step);
          const stepIdx = i;
          const isCompleted = currentIdx > stepIdx;
          const isCurrent = step === s.key;
          
          return (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.label}
              </div>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    isCompleted ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Account */}
      {step === "select-account" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Account</CardTitle>
            <CardDescription>
              Choose which account to import transactions into
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {account.type === "credit_card" ? "Credit Card" : "Checking"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setStep("upload")}
              disabled={!selectedAccountId}
              className="w-full"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload CSV */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file exported from your bank
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Click to upload CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Or drag and drop your file here
                  </p>
                </div>
              </label>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                <span>{fileName}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select-account")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Map Columns */}
      {step === "map-columns" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              We&apos;ve detected the column mappings below. Adjust if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Column</Label>
                <Select
                  value={mapping.date || "none"}
                  onValueChange={(v) => handleMappingChange("date", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not mapped</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Column</Label>
                <Select
                  value={mapping.description || "none"}
                  onValueChange={(v) => handleMappingChange("description", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not mapped</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Column</Label>
                <Select
                  value={mapping.amount || "none"}
                  onValueChange={(v) => handleMappingChange("amount", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not mapped</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Debit Column (optional)</Label>
                <Select
                  value={mapping.debit || "none"}
                  onValueChange={(v) => handleMappingChange("debit", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not mapped</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Credit Column (optional)</Label>
                <Select
                  value={mapping.credit || "none"}
                  onValueChange={(v) => handleMappingChange("credit", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not mapped</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview of raw data */}
            <div className="space-y-2">
              <Label>Data Preview (first 3 rows)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>
                        {headers.map((h) => (
                          <TableCell key={h} className="whitespace-nowrap">{row[h]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleProceedToSignConfirmation}
                disabled={!mapping.date || !mapping.description || (!mapping.amount && !mapping.debit)}
                className="flex-1"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm Sign Convention */}
      {step === "confirm-signs" && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Amount Signs</CardTitle>
            <CardDescription>
              Different banks use different conventions for expense signs. Verify that expenses show as negative (red) and income shows as positive (green).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Expected convention:</strong> Expenses (money out) should be negative (red), income/credits (money in) should be positive (green).
                If your preview shows the opposite, toggle the &quot;Flip all amount signs&quot; option below.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <Checkbox
                id="flip-signs"
                checked={flipAmountSign}
                onCheckedChange={(checked) => setFlipAmountSign(checked as boolean)}
              />
              <div className="flex-1">
                <label
                  htmlFor="flip-signs"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Flip all amount signs
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Check this if expenses appear as positive numbers in the preview below
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview (first 10 transactions)</Label>
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewTransactions.slice(0, 10).map((t, i) => {
                      const displayAmount = flipAmountSign ? -t.amount : t.amount;
                      const isExpense = displayAmount < 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <span
                              className={cn(
                                "font-medium",
                                isExpense ? "text-red-600" : "text-emerald-600"
                              )}
                            >
                              {isExpense ? "-" : "+"}
                              {formatCurrency(Math.abs(displayAmount), true)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={isExpense ? "destructive" : "default"}>
                              {isExpense ? "Expense" : "Income"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map-columns")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleAnalyzeDuplicates}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {loadingMessage || "Analyzing..."}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review Duplicates */}
      {step === "review-duplicates" && (
        <Card>
          <CardHeader>
            <CardTitle>Review Potential Duplicates</CardTitle>
            <CardDescription>
              {flaggedTransactions.length} transaction{flaggedTransactions.length !== 1 ? "s" : ""} detected as duplicates.
              They won&apos;t be imported unless you check them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dedupStats && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Analysis: {dedupStats.processingTimeMs}ms</span>
                {dedupStats.tier1Matches > 0 && (
                  <Badge variant="outline">Tier 1: {dedupStats.tier1Matches}</Badge>
                )}
                {dedupStats.tier2Matches > 0 && (
                  <Badge variant="outline">Tier 2 (LLM): {dedupStats.tier2Matches}</Badge>
                )}
              </div>
            )}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                These transactions match existing records. Check any that you want to import anyway.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFlaggedCount} of {flaggedTransactions.length} selected to import
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectAllFlagged(false)}>
                  Select None
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectAllFlagged(true)}>
                  Select All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Import</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>New Description</TableHead>
                    <TableHead>Matched With</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedTransactions.map((item, idx) => (
                    <TableRow
                      key={idx}
                      className={cn(item.selected && "bg-emerald-50 dark:bg-emerald-950/30")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => toggleFlagged(idx)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.transaction.date}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.transaction.description}>
                        {item.transaction.description}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.matchedDescription}>
                        {item.matchedDescription || "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "font-medium",
                            item.transaction.amount < 0 ? "text-red-600" : "text-emerald-600"
                          )}
                        >
                          {item.transaction.amount < 0 ? "-" : "+"}
                          {formatCurrency(Math.abs(item.transaction.amount), true)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            variant={
                              (item.confidence ?? 0) >= 0.9 ? "default" : 
                              (item.confidence ?? 0) >= 0.8 ? "secondary" : "outline"
                            }
                          >
                            {item.confidence ? `${Math.round(item.confidence * 100)}%` : "—"}
                          </Badge>
                          {item.matchTier && (
                            <span className="text-xs text-muted-foreground">
                              {item.matchTier === "deterministic" ? "T1" : "T2"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm">
                <span className="font-medium">{uniqueTransactions.length + selectedFlaggedCount}</span>
                <span className="text-muted-foreground"> transactions will be imported</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("confirm-signs")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep("preview")}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Review New Transactions</CardTitle>
            <CardDescription>
              {uniqueTransactions.length} transaction{uniqueTransactions.length !== 1 ? "s" : ""} not found in existing records.
              Uncheck any you don&apos;t want to import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uniqueTransactions.length === 0 ? (
              <Alert>
                <Check className="w-4 h-4" />
                <AlertDescription>
                  All transactions matched existing records. Nothing new to import.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedUniqueCount} of {uniqueTransactions.length} selected to import
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => selectAllUnique(false)}>
                      Select None
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectAllUnique(true)}>
                      Select All
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Import</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueTransactions.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className={cn(item.selected && "bg-emerald-50 dark:bg-emerald-950/30")}
                        >
                          <TableCell>
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => toggleUnique(idx)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.transaction.date}</TableCell>
                          <TableCell>{item.transaction.description}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <span
                              className={cn(
                                "font-medium",
                                item.transaction.amount < 0 ? "text-red-600" : "text-emerald-600"
                              )}
                            >
                              {item.transaction.amount < 0 ? "-" : "+"}
                              {formatCurrency(Math.abs(item.transaction.amount), true)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm">
                <span className="font-medium">{selectedUniqueCount + selectedFlaggedCount}</span>
                <span className="text-muted-foreground"> transactions will be imported</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => flaggedTransactions.length > 0 ? setStep("review-duplicates") : setStep("confirm-signs")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={createManyTransactions.isPending || getTransactionsToImport().length === 0}
                >
                  {createManyTransactions.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {getTransactionsToImport().length} Transactions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 7: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium">Import Complete!</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Successfully imported {importedCount} transactions into {selectedAccount?.name}
            </p>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => router.push("/transactions")}>
                View Transactions
              </Button>
              <Button onClick={() => router.push("/tagger")}>
                Review & Categorize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

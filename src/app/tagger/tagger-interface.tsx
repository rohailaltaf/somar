"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Transaction, Category } from "@prisma/client";
import { confirmTransaction, toggleExcluded, uncategorizeTransaction } from "@/actions/transactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Keyboard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define account type with Plaid fields (optional since they may be null)
interface AccountForTagger {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  plaidItemId?: string | null;
  plaidAccountId?: string | null;
}

interface TransactionWithRelations extends Omit<Transaction, 'plaidTransactionId'> {
  category: Category | null;
  account: AccountForTagger;
  plaidTransactionId?: string | null;
}

interface TaggerInterfaceProps {
  initialTransactions: TransactionWithRelations[];
  categories: Category[];
  totalCount: number;
}

export function TaggerInterface({
  initialTransactions,
  categories,
  totalCount,
}: TaggerInterfaceProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ transaction: TransactionWithRelations; index: number }>>([]);

  const currentTransaction = transactions[currentIndex];
  const progress = ((totalCount - transactions.length + currentIndex) / totalCount) * 100;
  const remaining = transactions.length - currentIndex;

  // Generate keyboard shortcuts for categories (1-9, then A-Z)
  const categoryShortcuts = categories.reduce((acc, category, index) => {
    let key: string;
    if (index < 9) {
      key = (index + 1).toString(); // 1-9
    } else {
      key = String.fromCharCode(65 + (index - 9)); // A-Z
    }
    acc[key.toLowerCase()] = category.id;
    return acc;
  }, {} as Record<string, string>);

  const getCategoryShortcut = (categoryId: string) => {
    return Object.keys(categoryShortcuts).find(key => categoryShortcuts[key] === categoryId)?.toUpperCase();
  };

  // Set initial category suggestion
  useEffect(() => {
    if (currentTransaction?.categoryId) {
      setSelectedCategory(currentTransaction.categoryId);
    } else {
      setSelectedCategory(null);
    }
  }, [currentTransaction]);

  const handleConfirm = useCallback(async (categoryId?: string) => {
    const categoryToConfirm = categoryId || selectedCategory;
    if (!currentTransaction || !categoryToConfirm || isAnimating) return;

    setIsAnimating(true);
    setDirection("right");

    // Add to undo stack
    setUndoStack((prev) => [...prev, { transaction: currentTransaction, index: currentIndex }]);

    // Pass visible transaction IDs for immediate recategorization
    // Background job will handle the rest after response
    const visibleIds = transactions.map(t => t.id);
    const result = await confirmTransaction(currentTransaction.id, categoryToConfirm, visibleIds);
    
    // Update other transactions that were auto-categorized (but not confirmed)
    if (result?.updatedTransactions && result.updatedTransactions.length > 0) {
      setTransactions((prev) => {
        return prev.map((txn) => {
          const update = result.updatedTransactions.find((u) => u.id === txn.id);
          if (update) {
            // Find the category object
            const category = categories.find((c) => c.id === update.categoryId);
            return {
              ...txn,
              categoryId: update.categoryId,
              category: category || txn.category,
            };
          }
          return txn;
        });
      });
    }

    // Show feedback about auto-tagging
    const autoTaggedCount = result?.updatedTransactions?.length || 0;
    if (autoTaggedCount > 0) {
      toast.success(`Transaction categorized. ${autoTaggedCount} similar transaction${autoTaggedCount > 1 ? 's' : ''} auto-tagged.`);
    } else {
      toast.success("Transaction categorized");
    }

    setTimeout(() => {
      if (currentIndex < transactions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Remove the confirmed transaction and stay at current index
        setTransactions((prev) => prev.filter((_, i) => i !== currentIndex));
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
      setDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [currentTransaction, selectedCategory, currentIndex, transactions, isAnimating, categories]);

  const handleSkip = useCallback(() => {
    if (isAnimating || currentIndex >= transactions.length - 1) return;

    setIsAnimating(true);
    setDirection("left");

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [currentIndex, transactions.length, isAnimating]);

  const handleExclude = useCallback(async () => {
    if (!currentTransaction || isAnimating) return;

    setIsAnimating(true);
    setDirection("left");

    await toggleExcluded(currentTransaction.id);
    await confirmTransaction(currentTransaction.id, currentTransaction.categoryId || categories[0]?.id || "");

    setTimeout(() => {
      setTransactions((prev) => prev.filter((_, i) => i !== currentIndex));
      if (currentIndex > 0 && currentIndex >= transactions.length - 1) {
        setCurrentIndex((prev) => prev - 1);
      }
      setDirection(null);
      setIsAnimating(false);
    }, 300);

    toast.success("Transaction excluded");
  }, [currentTransaction, currentIndex, transactions.length, categories, isAnimating]);

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0 || isAnimating) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setIsAnimating(true);
    setDirection("left");

    await uncategorizeTransaction(lastAction.transaction.id);

    // Add the transaction back to the list at its original position
    setTimeout(() => {
      setTransactions((prev) => {
        const newTransactions = [...prev];
        newTransactions.splice(lastAction.index, 0, lastAction.transaction);
        return newTransactions;
      });
      setCurrentIndex(lastAction.index);
      setDirection(null);
      setIsAnimating(false);
    }, 300);

    toast.success("Undone");
  }, [undoStack, isAnimating]);

  const handleCategoryPillClick = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-confirm after a brief delay to show the selection
    setTimeout(() => {
      handleConfirm(categoryId);
    }, 100);
  }, [handleConfirm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check if it's a category shortcut (1-9, a-z)
      if (categoryShortcuts[key]) {
        e.preventDefault();
        handleCategoryPillClick(categoryShortcuts[key]);
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "y":
        case "Y":
          e.preventDefault();
          handleConfirm();
          break;
        case "ArrowLeft":
        case "n":
        case "N":
          e.preventDefault();
          handleSkip();
          break;
        case "e":
        case "E":
          e.preventDefault();
          handleExclude();
          break;
        case "z":
        case "Z":
          e.preventDefault();
          handleUndo();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleConfirm, handleSkip, handleExclude, handleUndo, categoryShortcuts, handleCategoryPillClick]);

  // Swipe handlers
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleConfirm();
    } else if (info.offset.x < -threshold) {
      handleSkip();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD without timezone conversion
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!currentTransaction || transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{remaining} remaining</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Transaction Card */}
      <div className="relative h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTransaction.id}
            initial={{ opacity: 0, x: direction === "right" ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: direction === "right" ? 200 : -200,
              rotate: direction === "right" ? 10 : -10,
            }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{currentTransaction.account.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(currentTransaction.date)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="text-center py-4">
                  <span
                    className={cn(
                      "text-4xl font-bold",
                      currentTransaction.amount < 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    )}
                  >
                    {currentTransaction.amount < 0 ? "-" : "+"}
                    {formatCurrency(currentTransaction.amount)}
                  </span>
                </div>

                {/* Description */}
                <div className="text-center">
                  <p className="text-lg">{currentTransaction.description}</p>
                </div>

                {/* Suggestion Banner */}
                {currentTransaction.category && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentTransaction.category.color }}
                    />
                    <span className="text-sm">
                      Suggested: <span className="font-medium capitalize">{currentTransaction.category.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Press{" "}
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs font-mono">
                        {getCategoryShortcut(currentTransaction.category.id) || "→"}
                      </kbd>
                      {" "}or{" "}
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">→</kbd>
                      {" "}to confirm
                    </span>
                  </div>
                )}

                {/* Category Pills */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Click or press number/letter to confirm</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const shortcut = getCategoryShortcut(category.id);
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCategoryPillClick(category.id)}
                          disabled={isAnimating}
                          className={cn(
                            "text-xs capitalize",
                            selectedCategory === category.id && "ring-2 ring-offset-2 ring-primary"
                          )}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                          {shortcut && (
                            <kbd className="ml-2 px-1.5 py-0.5 bg-background/50 rounded border text-[10px] font-mono">
                              {shortcut}
                            </kbd>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
          disabled={isAnimating || currentIndex >= transactions.length - 1}
          className="w-32"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Skip
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleExclude}
          disabled={isAnimating}
          className="h-12 w-12 rounded-full"
        >
          <EyeOff className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          onClick={() => handleConfirm()}
          disabled={isAnimating || !selectedCategory}
          className="w-32"
        >
          Confirm
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Keyboard className="w-4 h-4 mr-2" />
              Keyboard shortcuts
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Select category</span>
                <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">1-9 / A-Z</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Skip transaction</span>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">←</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">N</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Confirm category</span>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">→</kbd>
                  <span className="text-xs text-muted-foreground">or</span>
                  <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">Y</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Exclude transaction</span>
                <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">E</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Undo last action</span>
                <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">Z</kbd>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


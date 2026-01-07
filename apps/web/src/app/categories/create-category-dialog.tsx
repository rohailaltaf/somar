"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useCategoryMutations, useCategories } from "@somar/shared/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Shuffle, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";
import type { CategoryType } from "@somar/shared";

/**
 * Extract hue from an OKLCH color string.
 * Returns null if not parseable.
 */
function extractHue(color: string): number | null {
  const match = color.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Find gaps in the hue wheel and return a hue from one of the larger gaps.
 * Randomly selects from top gaps for variety.
 */
function findOptimalHue(existingHues: number[]): number {
  if (existingHues.length === 0) {
    return Math.random() * 360;
  }

  // Sort hues
  const sorted = [...existingHues].sort((a, b) => a - b);

  // Find all gaps (including wrap-around)
  const gaps: { start: number; size: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[(i + 1) % sorted.length];
    const size = i === sorted.length - 1 ? (next + 360 - current) : (next - current);
    gaps.push({ start: current, size });
  }

  // Sort by size descending and take top 3 (or fewer if not enough)
  const topGaps = gaps
    .filter(g => g.size > 15) // Only consider gaps > 15 degrees
    .sort((a, b) => b.size - a.size)
    .slice(0, 3);

  if (topGaps.length === 0) {
    // Fallback: just pick random hue
    return Math.random() * 360;
  }

  // Randomly pick one of the top gaps
  const chosen = topGaps[Math.floor(Math.random() * topGaps.length)];

  // Place hue randomly within the middle 60% of the gap
  const margin = chosen.size * 0.2;
  const randomOffset = margin + Math.random() * (chosen.size - 2 * margin);

  return (chosen.start + randomOffset) % 360;
}

/**
 * Generate an OKLCH color with optimal hue distance from existing colors.
 */
function generateOptimalColor(existingColors: string[]): string {
  const existingHues = existingColors
    .map(extractHue)
    .filter((h): h is number => h !== null);

  const hue = findOptimalHue(existingHues);

  // Vary lightness and chroma for visual interest
  const lightness = 0.55 + Math.random() * 0.15;
  const chroma = 0.14 + Math.random() * 0.08;

  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${Math.round(hue)})`;
}

export function CreateCategoryDialog() {
  const { createCategory } = useCategoryMutations();
  const { categories = [] } = useCategories();

  // Get existing category colors for optimal color generation
  const existingColors = useMemo(
    () => categories.map((c: { color: string }) => c.color),
    [categories]
  );

  // Generate initial suggested color
  const initialSuggestedColor = useMemo(
    () => generateOptimalColor(existingColors),
    [existingColors]
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("spending");
  const [color, setColor] = useState<string | null>(null);
  const [suggestedColor, setSuggestedColor] = useState(initialSuggestedColor);

  // Reset suggested color when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSuggestedColor(generateOptimalColor(existingColors));
      setColor(null); // Reset to use suggested
    }
  };

  // Generate a new random color (with randomness)
  const handleShuffle = useCallback(() => {
    setSuggestedColor(generateOptimalColor(existingColors));
    setColor(null); // Switch back to suggested
  }, [existingColors]);

  // The actual color to use - suggested if nothing manually selected
  const activeColor = color ?? suggestedColor;

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    createCategory.mutate(
      { name: name.trim(), type, color: activeColor },
      {
        onSuccess: () => {
          toast.success("Category created");
          setOpen(false);
          setName("");
          setType("spending");
          setColor(null);
        },
        onError: () => {
          toast.error("Failed to create category");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </motion.button>
      </DialogTrigger>
      <DialogContent className="bg-surface border-border text-foreground sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Create Category
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new category to organize your transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground-secondary">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., utilities"
              className="bg-surface-elevated border-border text-foreground placeholder:text-foreground-dim focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Category Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-foreground-secondary">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as CategoryType)}>
              <SelectTrigger
                id="type"
                className="bg-surface-elevated border-border text-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-elevated border-border">
                <SelectItem value="spending" className="text-foreground-secondary focus:bg-muted focus:text-foreground">
                  Spending
                </SelectItem>
                <SelectItem value="income" className="text-foreground-secondary focus:bg-muted focus:text-foreground">
                  Income
                </SelectItem>
                <SelectItem value="transfer" className="text-foreground-secondary focus:bg-muted focus:text-foreground">
                  Transfer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-foreground-secondary flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color
            </Label>
            <div className="flex items-center gap-3">
              {/* Suggested color - large, prominent with glow */}
              <motion.button
                type="button"
                onClick={() => setColor(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-14 h-14 rounded-xl transition-all ${
                  color === null ? "ring-2 ring-offset-2 ring-offset-surface ring-primary" : ""
                }`}
                style={{
                  backgroundColor: suggestedColor,
                  boxShadow: color === null ? `0 0 30px ${suggestedColor}60` : `0 0 15px ${suggestedColor}30`,
                }}
                title="Suggested color (maximally different from existing)"
              >
                {color === null && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-white/90" />
                  </motion.div>
                )}
              </motion.button>

              {/* Shuffle button */}
              <motion.button
                type="button"
                onClick={handleShuffle}
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                transition={{ rotate: { duration: 0.3 } }}
                className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground-secondary hover:border-border-strong transition-colors"
                title="Generate another color"
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>

              {/* Manual color input */}
              <div className="flex-1 relative">
                <Input
                  value={color ?? ""}
                  onChange={(e) => setColor(e.target.value || null)}
                  placeholder="or enter custom..."
                  className="text-sm bg-surface-elevated border-border text-foreground placeholder:text-foreground-dim focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Custom color preview */}
            {color && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2"
              >
                <div
                  className="w-6 h-6 rounded-lg border border-border-strong"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 15px ${color}40`,
                  }}
                />
                <span className="text-xs text-muted-foreground">Custom color preview</span>
              </motion.div>
            )}

            <p className="text-xs text-foreground-dim">
              Suggested colors are automatically chosen to be visually distinct from your existing categories.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleCreate}
              disabled={createCategory.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createCategory.isPending ? "Creating..." : "Create Category"}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

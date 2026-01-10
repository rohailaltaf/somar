"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { EmptyStateProps } from "@somar/shared/components";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "ghost" | "outline";

/**
 * Resolve icon name to Lucide component.
 */
function resolveIcon(iconName: string): LucideIcons.LucideIcon {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
  return Icon || LucideIcons.HelpCircle;
}

/**
 * Map action variant to button variant.
 */
function getButtonVariant(variant?: string): ButtonVariant {
  if (variant === "ghost") return "ghost";
  if (variant === "outline") return "outline";
  return "default";
}

const sizeConfig = {
  compact: {
    container: "py-8",
    icon: "w-6 h-6",
    iconContainer: "w-14 h-14 rounded-2xl",
    title: "text-base",
    description: "text-sm",
  },
  default: {
    container: "py-12",
    icon: "w-6 h-6",
    iconContainer: "w-14 h-14 rounded-2xl",
    title: "text-base font-medium",
    description: "text-sm",
  },
  large: {
    container: "py-16",
    icon: "w-8 h-8",
    iconContainer: "w-20 h-20 rounded-2xl",
    title: "text-lg",
    description: "text-base",
  },
};

/**
 * Empty state component implementing the shared contract.
 *
 * @example
 * <EmptyState
 *   icon="Wallet"
 *   title="No accounts"
 *   description="Connect your bank to get started"
 *   action={{ href: "/accounts", label: "Connect Bank" }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
}: EmptyStateProps) {
  const Icon = resolveIcon(icon);
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", config.container)}>
      <div className={cn("bg-surface-elevated flex items-center justify-center mb-4", config.iconContainer)}>
        <Icon className={cn("text-foreground-dim", config.icon)} />
      </div>
      <p className={cn("text-foreground-secondary", config.title)}>{title}</p>
      <p className={cn("text-foreground-dim mt-1 max-w-[200px]", config.description)}>{description}</p>
      {action && action.href && (
        <Link href={action.href}>
          <Button variant={getButtonVariant(action.variant)} className="mt-4">
            {action.label}
          </Button>
        </Link>
      )}
      {action && !action.href && (
        <Button
          variant={getButtonVariant(action.variant)}
          className="mt-4"
          onClick={action.onPress}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

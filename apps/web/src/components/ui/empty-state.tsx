"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { EmptyStateProps } from "@somar/shared/components";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Resolve icon name to Lucide component.
 */
function resolveIcon(iconName: string) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
  return Icon || LucideIcons.HelpCircle;
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
      {action && action.href ? (
        <Link href={action.href}>
          <Button
            variant={action.variant === "ghost" ? "ghost" : action.variant === "outline" ? "outline" : "default"}
            className="mt-4"
          >
            {action.label}
          </Button>
        </Link>
      ) : action ? (
        <Button
          variant={action.variant === "ghost" ? "ghost" : action.variant === "outline" ? "outline" : "default"}
          className="mt-4"
          onClick={action.onPress}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

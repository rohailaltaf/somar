"use client";

import { ChevronRight } from "lucide-react";
import type { DashboardSectionHeaderProps } from "@somar/shared/components";
import { sectionHeaderStyles } from "@somar/shared/styles";

/**
 * Dashboard section header with title, subtitle, and action link.
 * Uses shared styles from @somar/shared/styles.
 */
export function DashboardSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: DashboardSectionHeaderProps) {
  const { dashboard } = sectionHeaderStyles;

  return (
    <div className={dashboard.container}>
      <div className={dashboard.titleContainer}>
        <h2 className={dashboard.title}>{title}</h2>
        <p className={dashboard.subtitle}>{subtitle}</p>
      </div>
      <button
        onClick={onAction}
        className={`${dashboard.actionContainer} hover:opacity-80 transition-opacity`}
      >
        <span className={dashboard.actionLabel}>{actionLabel}</span>
        <ChevronRight className={dashboard.actionChevron} />
      </button>
    </div>
  );
}

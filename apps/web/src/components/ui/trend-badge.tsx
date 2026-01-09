"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  trendBadgeStyles,
  getTrendVariant,
  getTrendBadgeContainerClass,
  getTrendBadgeTextClass,
  type TrendBadgeProps,
} from "@somar/shared/styles";

/**
 * Trend indicator badge showing percentage change.
 * For spending: up is bad (red), down is good (green).
 * Uses shared styles from @somar/shared/styles.
 */
export function TrendBadge({ change }: TrendBadgeProps) {
  if (change === null) return null;

  const direction = getTrendVariant(change);
  const containerClass = getTrendBadgeContainerClass(direction);
  const textClass = getTrendBadgeTextClass(direction);

  return (
    <div className={containerClass}>
      {direction === "up" ? (
        <ArrowUpRight className={`${trendBadgeStyles.icon} ${trendBadgeStyles.textColor[direction]}`} />
      ) : direction === "down" ? (
        <ArrowDownRight className={`${trendBadgeStyles.icon} ${trendBadgeStyles.textColor[direction]}`} />
      ) : null}
      <span className={textClass}>{Math.abs(change)}%</span>
      <span className={`${trendBadgeStyles.suffix} ${trendBadgeStyles.textColor[direction]}`}>vs last mo</span>
    </div>
  );
}

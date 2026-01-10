"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  trendBadgeStyles,
  getTrendVariant,
  getTrendBadgeContainerClass,
  getTrendBadgeTextClass,
  type TrendBadgeProps,
} from "@somar/shared/styles";

function TrendIcon({ direction }: { direction: "up" | "down" | "neutral" }): React.ReactNode {
  const iconClass = `${trendBadgeStyles.icon} ${trendBadgeStyles.textColor[direction]}`;

  switch (direction) {
    case "up":
      return <ArrowUpRight className={iconClass} />;
    case "down":
      return <ArrowDownRight className={iconClass} />;
    case "neutral":
      return null;
  }
}

/**
 * Trend indicator badge showing percentage change.
 * For spending: up is bad (red), down is good (green).
 * Uses shared styles from @somar/shared/styles.
 */
export function TrendBadge({ change }: TrendBadgeProps): React.ReactNode {
  if (change === null) return null;

  const direction = getTrendVariant(change);
  const containerClass = getTrendBadgeContainerClass(direction);
  const textClass = getTrendBadgeTextClass(direction);

  return (
    <div className={containerClass}>
      <TrendIcon direction={direction} />
      <span className={textClass}>{Math.abs(change)}%</span>
      <span className={`${trendBadgeStyles.suffix} ${trendBadgeStyles.textColor[direction]}`}>vs last mo</span>
    </div>
  );
}

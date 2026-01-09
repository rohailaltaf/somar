/**
 * Shared component styles.
 *
 * These className strings are used by both web and mobile platforms.
 * NativeWind supports the same Tailwind classes as web.
 *
 * Usage:
 * ```typescript
 * import { trendBadgeStyles, getTrendBadgeClassName } from "@somar/shared/styles";
 *
 * // Direct class usage
 * <div className={trendBadgeStyles.container}>
 *
 * // Helper function usage
 * <div className={getTrendBadgeClassName("up")}>
 * ```
 */

export {
  trendBadgeStyles,
  getTrendVariant,
  getTrendBadgeContainerClass,
  getTrendBadgeTextClass,
  type TrendDirection,
  type TrendBadgeProps,
} from "./trend-badge.styles";

export {
  quickActionStyles,
  getQuickActionContainerClass,
  getQuickActionIconContainerClass,
  getQuickActionIconClass,
  getQuickActionLabelClass,
} from "./quick-action.styles";

export {
  categoryRowStyles,
  getCategoryAmountClass,
  getCategoryStatusClass,
  type CategoryRowProps,
} from "./category-row.styles";

export {
  transactionRowStyles,
  transactionRowCompactStyles,
} from "./transaction-row.styles";

export { animatedCurrencyStyles } from "./animated-currency.styles";

export {
  progressBarStyles,
  progressBarThresholds,
  getProgressColorToken,
  getProgressBarColorClass,
  getProgressBarHexColor,
  type ProgressBarProps,
} from "./progress-bar.styles";

export {
  heroCardStyles,
  heroCardHexColors,
  getHeroGradientCSS,
  getHeroGlowCSS,
  type HeroCardProps,
} from "./hero-card.styles";

export {
  bentoCardStyles,
  bentoCardHexColors,
  getBentoValueClass,
  getBentoIconContainerClass,
} from "./bento-card.styles";

export {
  sectionHeaderStyles,
  getSectionTitleClass,
} from "./section-header.styles";

export {
  authFormStyles,
  getInputClass,
} from "./auth-form.styles";

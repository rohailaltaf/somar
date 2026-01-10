"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  quickActionStyles,
  getQuickActionContainerClass,
  getQuickActionIconContainerClass,
  getQuickActionIconClass,
  getQuickActionLabelClass,
} from "@somar/shared/styles";

interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  sublabel: string;
  highlight?: boolean;
}

/**
 * Quick action card for dashboard shortcuts.
 * Links to common actions like upload, categorize, reports.
 * Uses shared styles from @somar/shared/styles.
 */
export function QuickAction({ href, icon: Icon, label, sublabel, highlight = false }: QuickActionProps) {
  return (
    <Link href={href}>
      <div
        className={`${getQuickActionContainerClass(highlight)} hover:-translate-y-0.5 transition-all duration-150 group`}
        style={highlight ? { borderColor: quickActionStyles.containerHighlightBorder } : undefined}
      >
        <div className={`flex ${quickActionStyles.content}`}>
          <div className={getQuickActionIconContainerClass(highlight)}>
            <Icon className={`${getQuickActionIconClass(highlight)} transition-colors`} />
          </div>
          <div>
            <p className={getQuickActionLabelClass(highlight)}>{label}</p>
            <p className={quickActionStyles.sublabel}>{sublabel}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

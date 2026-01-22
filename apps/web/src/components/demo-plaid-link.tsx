"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { demoPlaidLinkStyles, type DemoPlaidLinkProps } from "@somar/shared/styles";
import Image from "next/image";

const styles = demoPlaidLinkStyles;

export function DemoPlaidLink({ institutions, onSelect, onClose }: DemoPlaidLinkProps) {
  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Connect a Demo Bank</h2>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={styles.dimensions.closeIconSize} />
            </button>
          </div>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Select a demo bank to connect. This will add sample accounts and transactions to your demo.
          </p>

          {/* Bank list */}
          <div className={styles.bankList}>
            {institutions.map((institution) => (
              <motion.button
                key={institution.id}
                className={styles.bankButton}
                onClick={() => onSelect(institution.id, institution.name)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  className={styles.bankLogoWrapper}
                  style={{ backgroundColor: `${institution.color}15` }}
                >
                  <Image
                    src={institution.logo}
                    alt={institution.name}
                    width={styles.dimensions.logoInnerSize}
                    height={styles.dimensions.logoInnerSize}
                    className={styles.bankLogo}
                    unoptimized
                  />
                </div>
                <div className={styles.bankInfo}>
                  <span className={styles.bankName}>{institution.name}</span>
                  <span className={styles.bankType}>Demo Bank</span>
                </div>
                <ChevronRight
                  size={styles.dimensions.chevronSize}
                  className="text-muted-foreground"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

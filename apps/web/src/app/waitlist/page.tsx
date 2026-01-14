"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/providers";
import { authFormStyles } from "@somar/shared/styles";
import { CheckCircle2, Sparkles, LogOut } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Floating orb positions for decorative elements
const orbs = [
  { x: "15%", y: "20%", size: 3, delay: 0, duration: 4 },
  { x: "85%", y: "25%", size: 2, delay: 0.5, duration: 5 },
  { x: "10%", y: "70%", size: 4, delay: 1, duration: 4.5 },
  { x: "90%", y: "65%", size: 2, delay: 1.5, duration: 5.5 },
  { x: "50%", y: "85%", size: 3, delay: 2, duration: 4 },
  { x: "25%", y: "45%", size: 2, delay: 0.8, duration: 5 },
  { x: "75%", y: "40%", size: 2, delay: 1.2, duration: 4.5 },
];

const colors = authFormStyles.waitlist.colors.oklch;

function FloatingOrb({ x, y, size, delay, duration }: (typeof orbs)[0]) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: colors.orb,
        boxShadow: `0 0 ${size * 4}px ${colors.orbGlow}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
        y: [0, -10, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function AtmosphericBackground() {
  const styles = authFormStyles.waitlist.background;

  return (
    <div className={styles.wrapper}>
      {/* Primary nebula - deep purple, top-left */}
      <motion.div
        className={styles.nebulaPrimary}
        style={{ background: colors.nebulaPrimary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />

      {/* Secondary nebula - indigo, bottom-right */}
      <motion.div
        className={styles.nebulaSecondary}
        style={{
          background: colors.nebulaSecondary,
          animationDelay: "2s",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />

      {/* Accent nebula - gold hint, top-right */}
      <motion.div
        className={styles.nebulaAccent}
        style={{
          background: colors.nebulaAccent,
          animationDelay: "1s",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 1 }}
      />

      {/* Subtle grid overlay */}
      <div
        className={styles.gridOverlay}
        style={{
          backgroundImage: `
            linear-gradient(${colors.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}
    </div>
  );
}

export default function WaitlistPage() {
  const { session, isLoading, logout } = useAuth();
  const styles = authFormStyles.waitlist;

  if (isLoading) {
    return (
      <div className={authFormStyles.loading.container}>
        <div className={authFormStyles.loading.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AtmosphericBackground />

      <div className={styles.content}>
        {/* Status badge */}
        <motion.div
          className={styles.statusBadge}
          style={{
            background: colors.statusBadgeBg,
            color: colors.statusBadgeText,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <span
            className={styles.statusDot}
            style={{ background: colors.statusDot }}
          />
          Application Received
        </motion.div>

        {/* Hero section */}
        <motion.div
          className={styles.hero.container}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          <h1 className={styles.hero.titleItalic}>
            <span style={{ color: colors.heroText }}>You're on </span>
            <span
              style={{
                background: `linear-gradient(135deg, ${colors.heroGradientStart}, ${colors.heroGradientEnd})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              the list
            </span>
          </h1>
          <p className={styles.hero.subtitle}>
            We're reviewing your application. You'll be among the first to
            experience a new way to understand your finances.
          </p>
        </motion.div>

        {/* Email card with gradient border */}
        <motion.div
          className={styles.emailCard.outer}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
        >
          {/* Gradient border effect */}
          <div
            className={styles.emailCard.gradient}
            style={{
              background: `linear-gradient(135deg, ${colors.cardGradientStart}, ${colors.cardGradientMid}, ${colors.cardGradientEnd})`,
            }}
          />

          {/* Card content */}
          <div className={styles.emailCard.inner}>
            <p className={styles.emailCard.label}>Signed in as</p>
            <p className={styles.emailCard.email}>{session?.user?.email}</p>
          </div>

          {/* Checkmark icon */}
          <div
            className={styles.emailCard.iconWrapper}
            style={{
              background: colors.checkmarkBg,
              boxShadow: `0 0 20px ${colors.checkmarkGlow}`,
            }}
          >
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: colors.checkmarkIcon }}
            />
          </div>
        </motion.div>

        {/* Info section */}
        <motion.div
          className={styles.info.container}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
        >
          <p className={styles.info.text}>
            You'll receive an email at this address once approved.
            <br />
            <span className={styles.info.highlight}>
              This usually happens within 24 hours.
            </span>
          </p>
        </motion.div>

        {/* Feature preview hint */}
        <motion.div
          className={styles.featurePreview}
          style={{
            background: colors.featurePreviewBg,
            border: `1px solid ${colors.featurePreviewBorder}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease }}
        >
          <Sparkles
            className="w-4 h-4 flex-shrink-0"
            style={{ color: colors.featurePreviewIcon }}
          />
          <p className="text-xs text-muted-foreground">
            Smart categorization, beautiful insights, and total control over
            your financial data.
          </p>
        </motion.div>

        {/* Sign out button */}
        <motion.button
          type="button"
          onClick={logout}
          className={styles.signOutButton}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={styles.signOutButtonBg} />
          <LogOut className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Sign out</span>
        </motion.button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/providers";
import { authFormStyles } from "@somar/shared/styles";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, LogOut, Play, Loader2 } from "lucide-react";

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
const dims = authFormStyles.waitlist.dimensions;

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
          backgroundSize: `${dims.gridSpacing}px ${dims.gridSpacing}px`,
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
  const router = useRouter();
  const styles = authFormStyles.waitlist;
  const [isEnteringDemo, setIsEnteringDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleEnterDemo = async () => {
    setIsEnteringDemo(true);
    setDemoError(null);
    try {
      const response = await fetch("/api/demo/enter", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        router.push("/");
      } else {
        setDemoError(data.error?.message || "Failed to enter demo mode");
      }
    } catch {
      setDemoError("Failed to enter demo mode");
    } finally {
      setIsEnteringDemo(false);
    }
  };

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
          className={styles.badgeWrapper}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Badge variant="success">Application Received</Badge>
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
              size={dims.iconMedium}
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

        {/* Demo button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
          className="mb-6"
        >
          <motion.button
            type="button"
            onClick={handleEnterDemo}
            disabled={isEnteringDemo}
            className={styles.demoButton}
            style={{ color: colors.demoButtonText }}
            whileHover={{ scale: isEnteringDemo ? 1 : 1.02 }}
            whileTap={{ scale: isEnteringDemo ? 1 : 0.98 }}
          >
            <motion.span
              className={styles.demoButtonBg}
              style={{ background: colors.demoButtonBg }}
              whileHover={{ background: colors.demoButtonBgHover }}
            />
            {isEnteringDemo ? (
              <Loader2 className={`${styles.demoButtonIcon} animate-spin`} />
            ) : (
              <Play className={styles.demoButtonIcon} />
            )}
            <span className={styles.demoButtonText}>
              {isEnteringDemo ? "Starting demo..." : "Try out a demo"}
            </span>
          </motion.button>

          {demoError && (
            <p className="text-destructive text-sm text-center mt-2">
              {demoError}
            </p>
          )}
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
          <LogOut className={styles.signOutButtonIcon} />
          <span className={styles.signOutButtonText}>Sign out</span>
        </motion.button>
      </div>
    </div>
  );
}

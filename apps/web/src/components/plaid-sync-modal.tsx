"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, Sparkles, AlertCircle } from "lucide-react";
import { hexColors } from "@somar/shared/theme";

// Custom smooth easing
const smoothEase = [0.16, 1, 0.3, 1] as const;

type SyncStage = "connecting" | "preparing" | "syncing" | "success" | "error";

// Duration for the preparation phase (ms) - gives Plaid time to enrich transaction data
const PREPARATION_DURATION = 20000;

interface PlaidSyncModalProps {
  isOpen: boolean;
  institutionName: string;
  onComplete: () => void;
  syncFunction: () => Promise<{ added: number; errors: string[] }>;
}

// Helper to check if stage is a terminal state
const isTerminalStage = (stage: SyncStage) => stage === "success" || stage === "error";

// Animated orbital dots around the bank icon
function OrbitalDots({ stage }: { stage: SyncStage }) {
  const dotCount = 8;
  const dots = Array.from({ length: dotCount }, (_, i) => i);

  return (
    <div className="absolute inset-0">
      {dots.map((i) => {
        const angle = (i / dotCount) * 360;
        const delay = i * 0.1;

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2"
            style={{
              originX: 0,
              originY: 0,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: isTerminalStage(stage) ? 0 : [0.3, 0.8, 0.3],
              scale: isTerminalStage(stage) ? 0 : 1,
              rotate: [angle, angle + 360],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                delay,
              },
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 0.3,
              },
            }}
          >
            <motion.div
              className="absolute rounded-full bg-primary"
              style={{
                width: 6,
                height: 6,
                x: 52,
                y: -3,
              }}
              animate={{
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// Pulsing rings behind the icon
function PulsingRings({ stage }: { stage: SyncStage }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            isTerminalStage(stage)
              ? { scale: 1.5, opacity: 0 }
              : {
                  scale: [1, 1.8, 2],
                  opacity: [0.4, 0.2, 0],
                }
          }
          transition={{
            duration: 2,
            repeat: isTerminalStage(stage) ? 0 : Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

// Seeded random for consistent particle positions
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Floating particles in the background
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: seededRandom(i * 1.1) * 100,
        y: seededRandom(i * 2.2) * 100,
        size: seededRandom(i * 3.3) * 4 + 2,
        duration: seededRandom(i * 4.4) * 3 + 4,
        delay: seededRandom(i * 5.5) * 2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Messages that cycle during preparation phase (while waiting for Plaid to enrich data)
const preparingMessages = [
  { main: "Establishing secure connection", sub: "Your data is encrypted end-to-end" },
  { main: "Verifying your credentials", sub: "Confirming access with your bank" },
  { main: "Your bank is preparing your data", sub: "This usually takes a few moments" },
  { main: "Gathering your transactions", sub: "Looking back at recent activity" },
  { main: "Organizing account information", sub: "Sorting through your accounts" },
  { main: "Almost ready", sub: "Just a few more seconds" },
];

// Messages that cycle during the actual sync
const syncMessages = [
  { main: "Downloading transactions", sub: "Securely transferring your data" },
  { main: "Processing your data", sub: "Categorizing and organizing" },
  { main: "Finalizing sync", sub: "Almost done" },
];

export function PlaidSyncModal({
  isOpen,
  institutionName,
  onComplete,
  syncFunction,
}: PlaidSyncModalProps) {
  const [stage, setStage] = useState<SyncStage>("connecting");
  const [messageIndex, setMessageIndex] = useState(0);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const syncStartedRef = useRef(false);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalIdsRef = useRef<NodeJS.Timeout[]>([]);
  const syncFunctionRef = useRef(syncFunction);
  const onCompleteRef = useRef(onComplete);

  // Keep refs up to date
  syncFunctionRef.current = syncFunction;
  onCompleteRef.current = onComplete;

  // Cycle through messages during preparing phase
  useEffect(() => {
    if (stage !== "preparing") return;

    // Calculate message interval to show all messages during preparation
    const messageInterval = PREPARATION_DURATION / preparingMessages.length;

    const interval = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, preparingMessages.length - 1));
    }, messageInterval);
    intervalIdsRef.current.push(interval);

    // Progress animation - update every 100ms for smooth progress
    const progressInterval = setInterval(() => {
      setPreparationProgress((prev) => Math.min(prev + (100 / PREPARATION_DURATION) * 100, 100));
    }, 100);
    intervalIdsRef.current.push(progressInterval);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [stage]);

  // Cycle through messages during sync
  useEffect(() => {
    if (stage !== "syncing") return;

    // Reset message index for sync messages
    setMessageIndex(0);

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % syncMessages.length);
    }, 2000);
    intervalIdsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [stage]);

  // Handle the sync process
  const performSync = useCallback(async () => {
    setStage("connecting");
    setErrorMessages([]);
    setPreparationProgress(0);
    setMessageIndex(0);

    // Brief connecting animation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Enter preparation phase - wait for Plaid to enrich transaction data
    setStage("preparing");

    // Wait for the full preparation duration
    await new Promise((resolve) => setTimeout(resolve, PREPARATION_DURATION));

    // Now perform the actual sync
    setStage("syncing");
    setMessageIndex(0);

    try {
      const result = await syncFunctionRef.current();

      if (result.errors.length > 0) {
        setErrorMessages(result.errors);
        setStage("error");
        // Auto-close after showing error
        const timeoutId = setTimeout(() => onCompleteRef.current(), 4000);
        timeoutIdsRef.current.push(timeoutId);
        return;
      }

      setTransactionCount(result.added);
      setStage("success");

      // Auto-close after success animation
      const timeoutId = setTimeout(() => {
        onCompleteRef.current();
      }, 2500);
      timeoutIdsRef.current.push(timeoutId);
    } catch (err) {
      setErrorMessages([
        err instanceof Error ? err.message : "An unexpected error occurred",
      ]);
      setStage("error");
      const timeoutId = setTimeout(() => onCompleteRef.current(), 4000);
      timeoutIdsRef.current.push(timeoutId);
    }
  }, []);

  // Start sync when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!syncStartedRef.current) {
        syncStartedRef.current = true;
        performSync();
      }
    } else {
      // Clear any pending timeouts to prevent memory leaks
      for (const timeoutId of timeoutIdsRef.current) {
        clearTimeout(timeoutId);
      }
      timeoutIdsRef.current = [];

      // Clear any pending intervals
      for (const intervalId of intervalIdsRef.current) {
        clearInterval(intervalId);
      }
      intervalIdsRef.current = [];

      // Reset state when closed
      syncStartedRef.current = false;
      setStage("connecting");
      setMessageIndex(0);
      setPreparationProgress(0);
      setTransactionCount(0);
      setErrorMessages([]);
    }
  }, [isOpen, performSync]);

  const getMessage = () => {
    switch (stage) {
      case "connecting":
        return `Connecting to ${institutionName}...`;
      case "preparing":
        return preparingMessages[messageIndex]?.main || "Preparing your data...";
      case "syncing":
        return syncMessages[messageIndex]?.main || "Syncing...";
      case "success":
        if (transactionCount > 0) {
          return `${transactionCount} transaction${transactionCount !== 1 ? "s" : ""} synced!`;
        }
        return "You're all set!";
      case "error":
        return "Sync failed";
    }
  };

  const getSubMessage = () => {
    switch (stage) {
      case "connecting":
        return "Establishing secure connection";
      case "preparing":
        return preparingMessages[messageIndex]?.sub || "This won't take long";
      case "syncing":
        return syncMessages[messageIndex]?.sub || "Almost there";
      case "success":
        return `${institutionName} is now connected`;
      case "error":
        return errorMessages[0] || "Please try again later";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container - fullscreen on mobile, centered modal on desktop */}
          <motion.div
            className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
          >
            {/* Content */}
            <div className="relative h-full sm:h-auto flex flex-col items-center justify-center bg-background sm:rounded-3xl overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

              {/* Floating particles */}
              <FloatingParticles />

              {/* Main content */}
              <div className="relative flex flex-col items-center justify-center px-8 py-16 sm:py-12 min-h-[400px]">
                {/* Animated icon container */}
                <div className="relative w-32 h-32 mb-8">
                  <PulsingRings stage={stage} />
                  <OrbitalDots stage={stage} />

                  {/* Main icon */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{
                      scale: stage === "success" ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: smoothEase,
                    }}
                  >
                    <motion.div
                      className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/20"
                      animate={{
                        rotate: stage === "preparing" || stage === "syncing" ? [0, 5, -5, 0] : 0,
                      }}
                      transition={{
                        duration: 4,
                        repeat: stage === "preparing" || stage === "syncing" ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />

                      {/* Icon */}
                      <AnimatePresence mode="wait">
                        {stage === "success" ? (
                          <motion.div
                            key="success"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.5, ease: smoothEase }}
                            className="relative z-10"
                          >
                            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
                              <Check className="w-8 h-8 text-white" strokeWidth={3} />
                            </div>
                          </motion.div>
                        ) : stage === "error" ? (
                          <motion.div
                            key="error"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.5, ease: smoothEase }}
                            className="relative z-10"
                          >
                            <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                              <AlertCircle className="w-8 h-8 text-white" strokeWidth={2} />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="bank"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="relative z-10"
                          >
                            <Building2 className="w-10 h-10 text-primary" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Institution name */}
                <motion.div
                  className="flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: smoothEase }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {institutionName}
                  </span>
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>

                {/* Main message */}
                <motion.div
                  className="text-center mb-2"
                  layout
                >
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={getMessage()}
                      className="text-xl sm:text-2xl font-semibold text-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getMessage()}
                    </motion.h2>
                  </AnimatePresence>
                </motion.div>

                {/* Sub message */}
                <motion.p
                  className="text-sm text-muted-foreground text-center mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getSubMessage()}
                </motion.p>

                {/* Progress indicator */}
                <div className="w-full max-w-xs">
                  {stage === "success" ? (
                    <motion.div
                      className="h-1.5 bg-success rounded-full"
                      initial={{ width: "90%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: smoothEase }}
                    />
                  ) : stage === "error" ? (
                    <motion.div
                      className="h-1.5 bg-destructive rounded-full"
                      initial={{ width: "90%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: smoothEase }}
                    />
                  ) : (
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        style={{
                          // Progress bar segments:
                          // - connecting: 0-10% (fast animation)
                          // - preparing: 10-85% (smooth 20s animation via preparationProgress)
                          // - syncing: 85-95% (indeterminate while waiting for API)
                          width: stage === "connecting"
                            ? "10%"
                            : stage === "preparing"
                              ? `${10 + (preparationProgress * 0.75)}%`
                              : "95%",
                        }}
                        initial={{ width: "0%" }}
                        animate={{
                          width: stage === "connecting"
                            ? "10%"
                            : stage === "preparing"
                              ? `${10 + (preparationProgress * 0.75)}%`
                              : "95%",
                        }}
                        transition={{
                          duration: stage === "connecting" ? 1.5 : 0.1,
                          ease: "easeOut",
                        }}
                      />
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Success celebration particles */}
                <AnimatePresence>
                  {stage === "success" && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            left: "50%",
                            top: "35%",
                            backgroundColor:
                              i % 3 === 0
                                ? hexColors.primary
                                : i % 3 === 1
                                  ? hexColors.success
                                  : hexColors.gold,
                          }}
                          initial={{ scale: 0, x: 0, y: 0 }}
                          animate={{
                            scale: [0, 1, 0],
                            x: (seededRandom(i * 7.7) - 0.5) * 300,
                            y: (seededRandom(i * 8.8) - 0.5) * 300,
                          }}
                          transition={{
                            duration: 1,
                            delay: i * 0.02,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

/**
 * Atmospheric background with nebula effect and subtle grid.
 * Matches the mobile dashboard's deep space aesthetic.
 */
export function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Primary nebula - oklch(0.25 0.15 280) at 12% */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-[oklch(0.25_0.15_280_/_0.12)] rounded-full blur-[150px] animate-breathe" />
      {/* Secondary glow - oklch(0.35 0.12 200) at 8% */}
      <div className="absolute top-[30%] right-[-15%] w-[50vw] h-[60vh] bg-[oklch(0.35_0.12_200_/_0.08)] rounded-full blur-[120px] animate-breathe delay-300" />
      {/* Accent highlight - oklch(0.45 0.18 260) at 6% */}
      <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vh] bg-[oklch(0.45_0.18_260_/_0.06)] rounded-full blur-[100px]" />
      {/* Subtle grid overlay - 60px spacing to match mobile */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.5 0.02 260) 1px, transparent 1px),
                           linear-gradient(90deg, oklch(0.5 0.02 260) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

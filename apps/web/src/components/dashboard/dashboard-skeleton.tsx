"use client";

/**
 * Loading skeleton state for the dashboard.
 * Matches the layout structure of the actual dashboard.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Grid Skeleton */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-7 row-span-2">
          <div className="h-[380px] rounded-3xl bg-surface animate-pulse" />
        </div>
        <div className="col-span-6 lg:col-span-5">
          <div className="h-[160px] rounded-2xl bg-surface animate-pulse" />
        </div>
        <div className="col-span-6 lg:col-span-5">
          <div className="h-[160px] rounded-2xl bg-surface animate-pulse" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-2xl bg-surface p-8 space-y-6">
            <div className="h-8 w-48 bg-surface-elevated rounded animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-surface-elevated rounded animate-pulse" />
                  <div className="h-4 w-20 bg-surface-elevated rounded animate-pulse" />
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-2xl bg-surface p-8 space-y-4 h-full">
            <div className="h-8 w-40 bg-surface-elevated rounded animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-elevated rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

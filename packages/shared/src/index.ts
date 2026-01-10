// Shared types, utilities, and business logic for Somar apps
// This package contains code shared between web and mobile apps

// Shared type definitions
export * from "./types/index";

// Transaction deduplication (Tier 1 - client-side)
export * from "./dedup";

// Shared utilities (date, currency formatting, etc.)
export * from "./utils";

// Note: Services, hooks, and API client are exported via subpath exports:
// - import { ... } from "@somar/shared/services"
// - import { ... } from "@somar/shared/hooks"
// - import { ... } from "@somar/shared/api-client"
// This keeps the main export lean and allows tree-shaking.

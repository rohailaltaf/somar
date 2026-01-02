// Shared types, utilities, and business logic for Somar apps
// This package contains code shared between web and mobile apps

// Shared type definitions
export * from "./types/index";

// Crypto utilities for client-side E2EE
export * from "./crypto";

// Database schema for E2EE SQLite database
export * from "./schema";

// Transaction deduplication (Tier 1 - client-side)
export * from "./dedup";

// Storage abstraction layer
export * from "./storage";

// Shared utilities (date, currency formatting, etc.)
export * from "./utils";

// Note: Services and hooks are exported via subpath exports:
// - import { ... } from "@somar/shared/services"
// - import { ... } from "@somar/shared/hooks"
// This keeps the main export lean and allows tree-shaking.

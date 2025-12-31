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

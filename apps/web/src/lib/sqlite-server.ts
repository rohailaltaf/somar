import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { SCHEMA_SQL, DEFAULT_CATEGORIES } from "@somar/shared";

/**
 * Creates an in-memory SQLite database with the standard schema and default categories.
 * Returns the database as a Buffer (raw bytes).
 *
 * This is used server-side to create the initial database template for new users.
 * The database contains no personal data - just structure and defaults.
 */
export function createInitialDatabase(): Buffer {
  const db = new Database(":memory:");

  try {
    // Apply schema
    db.exec(SCHEMA_SQL);

    // Seed default categories
    const now = new Date().toISOString();
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO categories (id, name, type, color, created_at) VALUES (?, ?, ?, ?, ?)"
    );

    for (const cat of DEFAULT_CATEGORIES) {
      insertStmt.run(randomUUID(), cat.name, cat.type, cat.color, now);
    }

    // Serialize to buffer
    return db.serialize();
  } finally {
    db.close();
  }
}

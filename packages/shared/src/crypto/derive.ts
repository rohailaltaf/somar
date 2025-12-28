/**
 * Derive an encryption key from a password.
 * This key is used to encrypt/decrypt the user's database.
 * The key derivation happens CLIENT-SIDE only - the server never sees it.
 *
 * Uses PBKDF2 via Web Crypto API for cross-platform compatibility
 * (works in browser, Node.js, and React Native).
 *
 * @param password - The user's password
 * @param email - The user's email (used as salt)
 * @returns A 256-bit (32-byte) hex-encoded encryption key
 */
export async function deriveEncryptionKey(
  password: string,
  email: string
): Promise<string> {
  const salt = `somar:encrypt:${email}`;
  return pbkdf2Derive(password, salt);
}

/**
 * Derive a key for key verification purposes.
 * This is stored (hashed again) to verify the user entered the correct password
 * for decryption without exposing the actual encryption key.
 *
 * @param password - The user's password
 * @param email - The user's email (used as salt)
 * @returns A hex-encoded verification key
 */
export async function deriveVerificationKey(
  password: string,
  email: string
): Promise<string> {
  const salt = `somar:verify:${email}`;
  return pbkdf2Derive(password, salt);
}

/**
 * PBKDF2 key derivation using Web Crypto API.
 * 100,000 iterations with SHA-256.
 */
async function pbkdf2Derive(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();

  // Import password as a key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive 256 bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 32 bytes
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Convert a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

import { hexToBytes } from "./derive";

/**
 * Encrypt data using AES-256-GCM.
 * Works in both browser (Web Crypto API) and Node.js environments.
 *
 * Output format: IV (12 bytes) + Ciphertext + AuthTag (appended by GCM)
 *
 * @param data - The data to encrypt (as a Uint8Array)
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The encrypted data as a Uint8Array
 */
export async function encrypt(
  data: Uint8Array,
  keyHex: string
): Promise<Uint8Array> {
  // Create fresh Uint8Array to ensure ArrayBuffer backing (not SharedArrayBuffer)
  const keyBytes = new Uint8Array(hexToBytes(keyHex));
  const inputData = new Uint8Array(data);

  // Generate a random 12-byte IV for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Encrypt the data (GCM appends auth tag automatically)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    inputData.buffer as ArrayBuffer
  );

  // Prepend IV to ciphertext+authTag
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return combined;
}

/**
 * Encrypt data and return as base64 string.
 *
 * @param data - The data to encrypt
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The encrypted data (base64 encoded)
 */
export async function encryptToBase64(
  data: Uint8Array,
  keyHex: string
): Promise<string> {
  const encrypted = await encrypt(data, keyHex);
  return uint8ArrayToBase64(encrypted);
}

/**
 * Encrypt a string using AES-256-GCM.
 *
 * @param text - The string to encrypt
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The encrypted data (base64 encoded)
 */
export async function encryptString(
  text: string,
  keyHex: string
): Promise<string> {
  const encoder = new TextEncoder();
  return encryptToBase64(encoder.encode(text), keyHex);
}

/**
 * Convert a Uint8Array to a base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    // Node.js
    return Buffer.from(bytes).toString("base64");
  } else {
    // Browser
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

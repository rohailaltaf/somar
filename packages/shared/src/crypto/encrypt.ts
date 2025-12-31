import { gcm } from "@noble/ciphers/aes";
import { hexToBytes } from "./derive";

/** Function type for generating random bytes */
export type RandomBytesFunc = (length: number) => Uint8Array;

/**
 * Default random bytes using Web Crypto API.
 * Works in browsers and modern Node.js.
 */
function defaultRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
    return array;
  }
  throw new Error(
    "No crypto.getRandomValues available. " +
      "Pass a getRandomBytes function (e.g., from expo-crypto)."
  );
}

/**
 * Encrypt data using AES-256-GCM.
 * Uses @noble/ciphers for cross-platform compatibility.
 *
 * Output format: IV (12 bytes) + Ciphertext + AuthTag (16 bytes)
 *
 * @param data - The data to encrypt (as a Uint8Array)
 * @param keyHex - The 256-bit encryption key as a hex string
 * @param getRandomBytes - Optional function to generate random bytes (for React Native, pass expo-crypto.getRandomBytes)
 * @returns The encrypted data as a Uint8Array
 */
export async function encrypt(
  data: Uint8Array,
  keyHex: string,
  getRandomBytes: RandomBytesFunc = defaultRandomBytes
): Promise<Uint8Array> {
  const keyBytes = hexToBytes(keyHex);
  const inputData = new Uint8Array(data);

  // Generate a random 12-byte IV for GCM
  const iv = getRandomBytes(12);

  // Create AES-GCM cipher and encrypt
  const aes = gcm(keyBytes, iv);
  const encrypted = aes.encrypt(inputData);

  // Prepend IV to ciphertext+authTag
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv, 0);
  combined.set(encrypted, iv.length);

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

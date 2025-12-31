import { gcm } from "@noble/ciphers/aes";
import { hexToBytes } from "./derive";

/**
 * Decrypt data that was encrypted with AES-256-GCM.
 * Uses @noble/ciphers for cross-platform compatibility
 * (works in browser, Node.js, React Native/Expo Go).
 *
 * Expected input format: IV (12 bytes) + Ciphertext + AuthTag (16 bytes)
 *
 * @param encrypted - The encrypted data (IV + ciphertext + authTag)
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The decrypted data as a Uint8Array
 */
export async function decrypt(
  encrypted: Uint8Array,
  keyHex: string
): Promise<Uint8Array> {
  const keyBytes = hexToBytes(keyHex);

  // Extract IV (first 12 bytes) and ciphertext+authTag
  const iv = encrypted.slice(0, 12);
  const ciphertext = encrypted.slice(12);

  // Create AES-GCM cipher and decrypt
  const aes = gcm(keyBytes, iv);
  const decrypted = aes.decrypt(ciphertext);

  return decrypted;
}

/**
 * Decrypt base64-encoded data.
 *
 * @param encryptedBase64 - The encrypted data (base64 encoded)
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The decrypted data as a Uint8Array
 */
export async function decryptFromBase64(
  encryptedBase64: string,
  keyHex: string
): Promise<Uint8Array> {
  const encrypted = base64ToUint8Array(encryptedBase64);
  return decrypt(encrypted, keyHex);
}

/**
 * Decrypt data and return as a string.
 *
 * @param encryptedBase64 - The encrypted data (base64 encoded)
 * @param keyHex - The 256-bit encryption key as a hex string
 * @returns The decrypted string
 */
export async function decryptString(
  encryptedBase64: string,
  keyHex: string
): Promise<string> {
  const decrypted = await decryptFromBase64(encryptedBase64, keyHex);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Convert a base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    // Node.js
    return new Uint8Array(Buffer.from(base64, "base64"));
  } else {
    // Browser
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

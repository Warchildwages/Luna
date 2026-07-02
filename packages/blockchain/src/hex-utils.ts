/**
 * Hex encoding/decoding utilities.
 * Pure JS — no Node dependencies.
 */

/**
 * Decode a hex string to Uint8Array.
 */
export function decodeHex(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/i, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Encode a Uint8Array to hex string.
 */
export function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

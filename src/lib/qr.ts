import crypto from "crypto";
import QRCode from "qrcode";

export interface GeneratedTokenPair {
  token: string;
  tokenHash: string;
}

/**
 * Generates a cryptographically strong random token and its SHA-256 hash.
 * The unhashed token is embedded in the attendee's QR code.
 * The hashed token is safely persisted in attendees.qr_token_hash.
 */
export function generateAttendeeToken(): GeneratedTokenPair {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

/**
 * Computes SHA-256 hash of a raw token.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Constant-time comparison between an incoming token and a stored hash.
 * Prevents timing attacks on QR pass verification.
 * Safely handles null, undefined, non-string, malformed, and variable length tokens without throwing.
 */
export function verifyTokenHash(token: unknown, storedHash: unknown): boolean {
  try {
    if (typeof token !== "string" || typeof storedHash !== "string") return false;
    const cleanToken = token.trim();
    const cleanHash = storedHash.trim();
    if (!cleanToken || !cleanHash) return false;

    // Stored SHA-256 hash must be exactly 64 hexadecimal characters
    if (!/^[a-f0-9]{64}$/i.test(cleanHash)) return false;

    const computedHash = hashToken(cleanToken);
    if (computedHash.length !== cleanHash.length) return false;

    const bufA = Buffer.from(computedHash, "hex");
    const bufB = Buffer.from(cleanHash, "hex");
    if (bufA.length !== 32 || bufB.length !== 32 || bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Builds the tamper-evident payload encoded into the attendee's QR code.
 */
export function buildQrPayload(reference: string, token: string): string {
  return JSON.stringify({
    app: "KP-INTIMACY-2026",
    v: 1,
    ref: reference,
    tok: token,
  });
}

/**
 * Renders a scannable PNG Data URL with high contrast and optimal scanning properties.
 */
export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H", // High error correction (30% recovery)
    type: "image/png",
    margin: 2,
    width: 320,
    color: {
      dark: "#09080E",  // Deep obsidian foreground
      light: "#FFFFFF", // Crisp white background for universal laser/camera scanning
    },
  });
}

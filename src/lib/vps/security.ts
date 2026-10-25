// Python VPS Security & HMAC Authentication Verification
// Used for secure server-to-server webhook ingestion between the Elvaris Python VPS and Next.js marketplace

import crypto from "crypto";

const DEFAULT_SECRET = process.env.VPS_SHARED_SECRET || "stratmarket-dev-vps-hmac-shared-secret-key-2026";
const MAX_ALLOWED_TIMESTAMP_SKEW_MS = 5 * 60 * 1000; // 5 minutes

export function generateVpsSignature(
  rawBody: string,
  timestamp: string,
  secret: string = DEFAULT_SECRET
): string {
  const payloadToSign = `${timestamp}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");
}

export function verifyVpsSignature(
  rawBody: string,
  providedSignature: string | null,
  timestamp: string | null,
  secret: string = DEFAULT_SECRET
): { valid: boolean; reason?: string } {
  if (!providedSignature) {
    return { valid: false, reason: "MISSING_SIGNATURE_HEADER" };
  }

  if (!timestamp) {
    return { valid: false, reason: "MISSING_TIMESTAMP_HEADER" };
  }

  // 1. Replay prevention: check timestamp drift
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, reason: "INVALID_TIMESTAMP_FORMAT" };
  }

  const now = Date.now();
  if (Math.abs(now - requestTime) > MAX_ALLOWED_TIMESTAMP_SKEW_MS) {
    return { valid: false, reason: "TIMESTAMP_SKEW_EXCEEDED" };
  }

  // 2. Compute expected HMAC SHA-256 signature
  const expectedSignature = generateVpsSignature(rawBody, timestamp, secret);

  // 3. Constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "SIGNATURE_MISMATCH" };
  }

  const matches = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!matches) {
    return { valid: false, reason: "SIGNATURE_MISMATCH" };
  }

  return { valid: true };
}

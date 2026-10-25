import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { generateVpsSignature, verifyVpsSignature } from "@/lib/vps/security";
import { hashPassword } from "@/lib/auth/session";

describe("Python VPS Signal Integration & Email Delivery", () => {
  const testSecret = "stratmarket-dev-vps-hmac-shared-secret-key-2026";

  it("verifies authentic HMAC SHA-256 signatures from VPS", () => {
    const rawBody = JSON.stringify({
      strategyId: "PY-01",
      signalType: "ENTRY",
      direction: "LONG",
      instrument: "XAUUSD",
      timeframe: "H1",
      sourceEventId: "evt_test_valid_01",
    });

    const nowTimestamp = Date.now().toString();
    const signature = generateVpsSignature(rawBody, nowTimestamp, testSecret);

    const check = verifyVpsSignature(rawBody, signature, nowTimestamp, testSecret);
    expect(check.valid).toBe(true);
  });

  it("rejects forged or tampered signatures", () => {
    const rawBody = JSON.stringify({ signal: "BUY" });
    const nowTimestamp = Date.now().toString();
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const check = verifyVpsSignature(rawBody, forgedSignature, nowTimestamp, testSecret);
    expect(check.valid).toBe(false);
    expect(check.reason).toBe("SIGNATURE_MISMATCH");
  });

  it("rejects replayed requests with expired timestamps (> 5 minutes)", () => {
    const rawBody = JSON.stringify({ signal: "BUY" });
    // Timestamp from 10 minutes ago
    const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString();
    const signature = generateVpsSignature(rawBody, staleTimestamp, testSecret);

    const check = verifyVpsSignature(rawBody, signature, staleTimestamp, testSecret);
    expect(check.valid).toBe(false);
    expect(check.reason).toBe("TIMESTAMP_SKEW_EXCEEDED");
  });

  it("enforces idempotency and rejects duplicate sourceEventId", async () => {
    const uniqueEventId = "vps_evt_idempotent_" + Date.now();

    const signalData = {
      sourceEventId: uniqueEventId,
      strategyId: "PY-01",
      strategyVersion: "1.2.0",
      instrument: "XAUUSD",
      timeframe: "H1",
      signalType: "ENTRY" as const,
      direction: "LONG" as const,
      entryPrice: 2650.0,
    };

    // First ingestion must succeed
    const res1 = await db.ingestVpsSignal(signalData);
    expect(res1.signal.id).toBeDefined();

    // Replay with identical sourceEventId must be rejected
    await expect(db.ingestVpsSignal(signalData)).rejects.toThrow("DUPLICATE_SOURCE_EVENT_ID");
  });

  it("dispatches notifications only to entitled users with active alert preferences", async () => {
    const userEmail = `entitled_${Date.now()}@elvariscapital.in`;
    const hash = await hashPassword("Pass123!");
    const user = await db.createUser({
      name: "Entitled Trader",
      email: userEmail,
      passwordHash: hash,
    });

    // Start trial on PY-08
    await db.startTrial(user.id, "py-08");

    // Ingest signal for PY-08
    const eventId = "evt_py08_test_" + Date.now();
    const res = await db.ingestVpsSignal({
      sourceEventId: eventId,
      strategyId: "PY-08",
      instrument: "BTCUSD",
      timeframe: "H1",
      signalType: "ENTRY",
      direction: "LONG",
      entryPrice: 94000.0,
    });

    expect(res.notifiedUsersCount).toBeGreaterThan(0);

    const deliveries = await db.getUserDeliveries(user.id);
    expect(deliveries.some((d) => d.signalId === res.signal.id)).toBe(true);
  });
});

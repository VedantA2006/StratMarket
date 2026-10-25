import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/session";

describe("Security & Access Boundaries", () => {
  it("enforces customer isolation (cannot view another user's deliveries or connections)", async () => {
    const user1 = await db.createUser({
      name: "User 1",
      email: `iso1_${Date.now()}@elvariscapital.in`,
      passwordHash: await hashPassword("Pass123!"),
    });

    const user2 = await db.createUser({
      name: "User 2",
      email: `iso2_${Date.now()}@elvariscapital.in`,
      passwordHash: await hashPassword("Pass123!"),
    });

    await db.saveTradingConnection(user1.id, {
      brokerIdentifier: "ALPACA",
      grantedScopes: ["READ_ONLY"],
      isLive: false,
    });

    const user1Connections = await db.getUserConnections(user1.id);
    const user2Connections = await db.getUserConnections(user2.id);

    expect(user1Connections.length).toBe(1);
    expect(user2Connections.length).toBe(0);
  });

  it("never returns raw secrets or encrypted credentials to user connection responses", async () => {
    const user = await db.createUser({
      name: "Secret Checker",
      email: `sec_${Date.now()}@elvariscapital.in`,
      passwordHash: await hashPassword("Pass123!"),
    });

    const conn = await db.saveTradingConnection(user.id, {
      brokerIdentifier: "BINANCE",
      grantedScopes: ["READ_ONLY"],
    });

    expect((conn as any).encryptedCredentialRef).toBeUndefined();
    expect((conn as any).apiSecret).toBeUndefined();
  });

  it("records immutable audit log events for sensitive operations", async () => {
    const initialLogsCount = (await db.getAuditEvents(500)).length;

    await db.createAuditEvent({
      action: "ADMIN_STRATEGY_STATUS_CHANGE",
      entityType: "STRATEGY",
      entityId: "PY-01",
      details: JSON.stringify({ status: "PRIVATE" }),
    });

    const logs = await db.getAuditEvents(500);
    expect(logs.length).toBe(initialLogsCount + 1);
    expect(logs[0].action).toBe("ADMIN_STRATEGY_STATUS_CHANGE");
  });
});

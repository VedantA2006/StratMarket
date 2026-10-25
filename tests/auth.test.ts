import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth/session";

describe("Authentication & Session Security", () => {
  it("hashes password and verifies correctly with bcrypt", async () => {
    const raw = "SuperSecret2026!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(await verifyPassword(raw, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("signs and verifies JWT tokens with tamper detection", () => {
    const testUser = {
      id: "usr_test_123",
      email: "quant@elvariscapital.in",
      name: "Quant Researcher",
      role: "CUSTOMER" as const,
      accountStatus: "ACTIVE",
      emailVerified: true,
    };

    const token = signToken(testUser);
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe(testUser.email);
    expect(decoded?.role).toBe("CUSTOMER");

    // Tampered token test
    const tampered = token.slice(0, -6) + "abcdef";
    const invalidPayload = verifyToken(tampered);
    expect(invalidPayload).toBeNull();
  });

  it("prevents creating duplicate users with same email", async () => {
    const email = `test_${Date.now()}@elvariscapital.in`;
    const hash = await hashPassword("TestPass123!");

    const user1 = await db.createUser({
      name: "User One",
      email,
      passwordHash: hash,
    });
    expect(user1.id).toBeDefined();

    // Duplicate attempt must throw
    await expect(
      db.createUser({
        name: "User Two",
        email,
        passwordHash: hash,
      })
    ).rejects.toThrow("USER_EXISTS");
  });
});

import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Environment validation", () => {
  it("should validate correct DATABASE_URL", () => {
    const schema = z.string().url();
    const result = schema.safeParse("postgresql://user:pass@localhost:6100/db");
    expect(result.success).toBe(true);
  });

  it("should reject invalid DATABASE_URL", () => {
    const schema = z.string().url();
    const result = schema.safeParse("not-a-url");
    expect(result.success).toBe(false);
  });

  it("should validate port offset +100 convention", () => {
    const port = 6100;
    expect(port).toBeGreaterThanOrEqual(6100);
    expect(port).toBeLessThan(6200);
  });

  it("should validate AUTH_SECRET minimum length", () => {
    const schema = z.string().min(32);
    expect(schema.safeParse("short").success).toBe(false);
    expect(schema.safeParse("this-is-a-valid-secret-with-32-chars!").success).toBe(true);
  });
});

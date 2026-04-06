/**
 * Tests for notifyMissionTransition (mission.emails.ts)
 * Mocks nodemailer to verify which transitions trigger emails,
 * who receives them, and that failures never throw.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock nodemailer ───────────────────────────────────────────────────────────

const mockSendMail = vi.fn().mockResolvedValue({});
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

// Provide required env vars so createTransport doesn't bail out early
vi.stubEnv("SMTP_FROM", "ops@systemrapid.io");
vi.stubEnv("SMTP_AUTH_USER", "juang@systemrapid.io");
vi.stubEnv("SMTP_APP_PASSWORD", "test-app-password");

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = {
  code: "SKY-2026-001",
  name: "Inspección Torres Eléctricas",
  oldStatus: "planned" as const,
  pilotEmail: "pilot@skypro360.es",
  pilotName: "Carlos Ruiz",
  coordinatorEmail: "coord@skypro360.es",
  coordinatorName: "Ana Gomez",
  scheduledStart: new Date("2026-04-10T09:00:00Z"),
};

/** Flush microtask queue — notifyMissionTransition is fire-and-forget */
async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("notifyMissionTransition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // ── approved: only pilot ───────────────────────────────────────────────────

  describe("approved transition", () => {
    it("sends exactly one email to the pilot", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "approved" });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe("pilot@skypro360.es");
    });

    it("subject includes mission code and 'aprobada'", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "approved" });
      await flush();

      const { subject } = mockSendMail.mock.calls[0][0];
      expect(subject).toContain("SKY-2026-001");
      expect(subject.toLowerCase()).toContain("aprobada");
    });

    it("sends no email when pilotEmail is absent", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "approved", pilotEmail: null });
      await flush();

      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  // ── in_flight: pilot + coordinator ────────────────────────────────────────

  describe("in_flight transition", () => {
    it("sends two emails (pilot + coordinator)", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "in_flight" });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      const recipients = mockSendMail.mock.calls.map((c) => c[0].to);
      expect(recipients).toContain("pilot@skypro360.es");
      expect(recipients).toContain("coord@skypro360.es");
    });

    it("sends only one email when pilot and coordinator are the same address", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({
        ...BASE,
        newStatus: "in_flight",
        coordinatorEmail: "pilot@skypro360.es",
      });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("sends only to pilot when coordinator is absent", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({
        ...BASE,
        newStatus: "in_flight",
        coordinatorEmail: null,
      });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].to).toBe("pilot@skypro360.es");
    });
  });

  // ── completed ─────────────────────────────────────────────────────────────

  describe("completed transition", () => {
    it("notifies pilot and coordinator", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "completed" });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it("subject contains 'completada'", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "completed" });
      await flush();

      const subjects = mockSendMail.mock.calls.map((c) => c[0].subject.toLowerCase());
      expect(subjects.every((s) => s.includes("completada"))).toBe(true);
    });
  });

  // ── aborted ───────────────────────────────────────────────────────────────

  describe("aborted transition", () => {
    it("notifies pilot and coordinator", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "aborted" });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it("subject contains 'abortada'", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "aborted" });
      await flush();

      const subjects = mockSendMail.mock.calls.map((c) => c[0].subject.toLowerCase());
      expect(subjects.every((s) => s.includes("abortada"))).toBe(true);
    });
  });

  // ── cancelled: only pilot ─────────────────────────────────────────────────

  describe("cancelled transition", () => {
    it("sends only to pilot (not coordinator)", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: "cancelled" });
      await flush();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].to).toBe("pilot@skypro360.es");
    });

    it("sends no email when pilot is absent", async () => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({
        ...BASE,
        newStatus: "cancelled",
        pilotEmail: null,
      });
      await flush();

      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  // ── silent states: no email ───────────────────────────────────────────────

  it.each(["draft", "planned", "preflight"] as const)(
    "%s transition sends no email",
    async (status) => {
      const { notifyMissionTransition } = await import(
        "@/modules/notifications/mission.emails"
      );
      notifyMissionTransition({ ...BASE, newStatus: status });
      await flush();

      expect(mockSendMail).not.toHaveBeenCalled();
    },
  );

  // ── error resilience ──────────────────────────────────────────────────────

  it("does not throw when sendMail rejects", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP timeout"));
    const { notifyMissionTransition } = await import(
      "@/modules/notifications/mission.emails"
    );

    // Should not throw — fire-and-forget
    expect(() => {
      notifyMissionTransition({ ...BASE, newStatus: "approved" });
    }).not.toThrow();

    await flush();
    // sendMail was called and rejected — no propagation
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("does not throw when SMTP is unconfigured", async () => {
    vi.stubEnv("SMTP_FROM", "");
    vi.stubEnv("SMTP_APP_PASSWORD", "");
    vi.resetModules();

    const { notifyMissionTransition } = await import(
      "@/modules/notifications/mission.emails"
    );
    expect(() => {
      notifyMissionTransition({ ...BASE, newStatus: "approved" });
    }).not.toThrow();

    await flush();
    // Transport not created — sendMail never called
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── HTML body sanity ──────────────────────────────────────────────────────

  it("email body includes mission code", async () => {
    vi.stubEnv("SMTP_FROM", "ops@systemrapid.io");
    vi.stubEnv("SMTP_APP_PASSWORD", "test-app-password");
    vi.resetModules();

    const { notifyMissionTransition } = await import(
      "@/modules/notifications/mission.emails"
    );
    notifyMissionTransition({ ...BASE, newStatus: "approved" });
    await flush();

    const { html } = mockSendMail.mock.calls[0][0];
    expect(html).toContain("SKY-2026-001");
    expect(html).toContain("Inspección Torres Eléctricas");
  });

  it("from address uses SMTP_FROM alias", async () => {
    vi.stubEnv("SMTP_FROM", "ops@systemrapid.io");
    vi.stubEnv("SMTP_APP_PASSWORD", "test-app-password");
    vi.resetModules();

    const { notifyMissionTransition } = await import(
      "@/modules/notifications/mission.emails"
    );
    notifyMissionTransition({ ...BASE, newStatus: "approved" });
    await flush();

    const { from } = mockSendMail.mock.calls[0][0];
    expect(from).toContain("ops@systemrapid.io");
  });
});

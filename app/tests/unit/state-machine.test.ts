import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStatuses,
  isTerminal,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/modules/missions/state-machine";

describe("Mission State Machine", () => {
  describe("canTransition", () => {
    // Happy path — valid forward transitions
    const validTransitions: [string, string][] = [
      ["draft", "planned"],
      ["planned", "approved"],
      ["approved", "preflight"],
      ["preflight", "in_flight"],
      ["in_flight", "completed"],
      ["in_flight", "aborted"],
    ];

    it.each(validTransitions)("%s → %s should be allowed", (from, to) => {
      expect(canTransition(from as any, to as any)).toBe(true);
    });

    // Cancellation from any non-terminal state
    const cancellableStates = ["draft", "planned", "approved", "preflight"];

    it.each(cancellableStates)("%s → cancelled should be allowed", (from) => {
      expect(canTransition(from as any, "cancelled")).toBe(true);
    });

    // in_flight cannot be cancelled (only completed/aborted)
    it("in_flight → cancelled should NOT be allowed", () => {
      expect(canTransition("in_flight", "cancelled")).toBe(false);
    });

    // Backward transitions should be blocked
    const invalidBackward: [string, string][] = [
      ["planned", "draft"],
      ["approved", "planned"],
      ["preflight", "approved"],
      ["in_flight", "preflight"],
      ["completed", "in_flight"],
    ];

    it.each(invalidBackward)("%s → %s (backward) should NOT be allowed", (from, to) => {
      expect(canTransition(from as any, to as any)).toBe(false);
    });

    // Skipping states should be blocked
    const invalidSkip: [string, string][] = [
      ["draft", "approved"],
      ["draft", "in_flight"],
      ["planned", "preflight"],
      ["planned", "in_flight"],
      ["approved", "in_flight"],
      ["approved", "completed"],
    ];

    it.each(invalidSkip)("%s → %s (skip) should NOT be allowed", (from, to) => {
      expect(canTransition(from as any, to as any)).toBe(false);
    });

    // Terminal states should not transition anywhere
    const terminalStates = ["completed", "aborted", "cancelled"];

    it.each(terminalStates)("%s should not transition to any state", (state) => {
      const allStates = ["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"];
      for (const target of allStates) {
        expect(canTransition(state as any, target as any)).toBe(false);
      }
    });

    // Self-transitions should be blocked
    it("self-transitions should NOT be allowed", () => {
      const allStates = ["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"];
      for (const state of allStates) {
        expect(canTransition(state as any, state as any)).toBe(false);
      }
    });
  });

  describe("getNextStatuses", () => {
    it("draft can go to planned or cancelled", () => {
      expect(getNextStatuses("draft")).toEqual(["planned", "cancelled"]);
    });

    it("planned can go to approved or cancelled", () => {
      expect(getNextStatuses("planned")).toEqual(["approved", "cancelled"]);
    });

    it("approved can go to preflight or cancelled", () => {
      expect(getNextStatuses("approved")).toEqual(["preflight", "cancelled"]);
    });

    it("preflight can go to in_flight or cancelled", () => {
      expect(getNextStatuses("preflight")).toEqual(["in_flight", "cancelled"]);
    });

    it("in_flight can go to completed or aborted", () => {
      expect(getNextStatuses("in_flight")).toEqual(["completed", "aborted"]);
    });

    it("terminal states return empty array", () => {
      expect(getNextStatuses("completed")).toEqual([]);
      expect(getNextStatuses("aborted")).toEqual([]);
      expect(getNextStatuses("cancelled")).toEqual([]);
    });
  });

  describe("isTerminal", () => {
    it("completed is terminal", () => {
      expect(isTerminal("completed")).toBe(true);
    });

    it("aborted is terminal", () => {
      expect(isTerminal("aborted")).toBe(true);
    });

    it("cancelled is terminal", () => {
      expect(isTerminal("cancelled")).toBe(true);
    });

    const nonTerminal = ["draft", "planned", "approved", "preflight", "in_flight"];

    it.each(nonTerminal)("%s is NOT terminal", (status) => {
      expect(isTerminal(status as any)).toBe(false);
    });
  });

  describe("STATUS_LABELS", () => {
    it("has labels for all 8 states", () => {
      const states = ["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"];
      for (const s of states) {
        expect(STATUS_LABELS[s as keyof typeof STATUS_LABELS]).toBeDefined();
        expect(typeof STATUS_LABELS[s as keyof typeof STATUS_LABELS]).toBe("string");
      }
    });

    it("labels are in Spanish", () => {
      expect(STATUS_LABELS.draft).toBe("Borrador");
      expect(STATUS_LABELS.in_flight).toBe("En vuelo");
      expect(STATUS_LABELS.completed).toBe("Completada");
    });
  });

  describe("STATUS_COLORS", () => {
    it("has CSS classes for all 8 states", () => {
      const states = ["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"];
      for (const s of states) {
        const color = STATUS_COLORS[s as keyof typeof STATUS_COLORS];
        expect(color).toBeDefined();
        expect(color).toContain("bg-");
        expect(color).toContain("text-");
      }
    });
  });

  describe("PRIORITY_LABELS", () => {
    it("has all 4 priority levels", () => {
      expect(PRIORITY_LABELS.low).toBe("Baja");
      expect(PRIORITY_LABELS.normal).toBe("Normal");
      expect(PRIORITY_LABELS.high).toBe("Alta");
      expect(PRIORITY_LABELS.urgent).toBe("Urgente");
    });
  });

  describe("PRIORITY_COLORS", () => {
    it("has CSS classes for all 4 levels", () => {
      for (const key of ["low", "normal", "high", "urgent"]) {
        expect(PRIORITY_COLORS[key]).toBeDefined();
        expect(PRIORITY_COLORS[key]).toContain("text-");
      }
    });
  });
});

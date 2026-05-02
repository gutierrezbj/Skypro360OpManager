import { describe, it, expect } from "vitest";
import {
  canSeeAllMissions,
  canSeeAnalytics,
  canCreateMission,
  canEditMission,
  canDeleteMission,
  canApproveMission,
  canTransitionMission,
  canManageFleet,
  canManagePilots,
  canSignCompliance,
  canGenerateDossier,
  canManageUsers,
  ROLE_LABELS,
} from "@/lib/auth/rbac";

const ROLES = ["admin", "org_admin", "coordinator", "pilot", "viewer"] as const;

describe("RBAC — visibilidad de misiones", () => {
  it("admin/org_admin/coordinator/viewer ven todas las misiones del tenant", () => {
    expect(canSeeAllMissions("admin")).toBe(true);
    expect(canSeeAllMissions("org_admin")).toBe(true);
    expect(canSeeAllMissions("coordinator")).toBe(true);
    expect(canSeeAllMissions("viewer")).toBe(true);
  });

  it("pilot solo ve sus misiones (no todas)", () => {
    expect(canSeeAllMissions("pilot")).toBe(false);
  });

  it("rol desconocido por defecto NO ve todas (fail-closed)", () => {
    expect(canSeeAllMissions("unknown")).toBe(false);
    expect(canSeeAllMissions("")).toBe(false);
  });
});

describe("RBAC — Analytics", () => {
  it("solo admin/org_admin/coordinator ven Analytics", () => {
    expect(canSeeAnalytics("admin")).toBe(true);
    expect(canSeeAnalytics("org_admin")).toBe(true);
    expect(canSeeAnalytics("coordinator")).toBe(true);
    expect(canSeeAnalytics("pilot")).toBe(false);
    expect(canSeeAnalytics("viewer")).toBe(false);
  });
});

describe("RBAC — escritura de misiones", () => {
  it("admin/org_admin/coordinator pueden crear misiones — pilot NO", () => {
    expect(canCreateMission("admin")).toBe(true);
    expect(canCreateMission("org_admin")).toBe(true);
    expect(canCreateMission("coordinator")).toBe(true);
    expect(canCreateMission("pilot")).toBe(false);
    expect(canCreateMission("viewer")).toBe(false);
  });

  it("solo admin y org_admin pueden borrar misiones", () => {
    expect(canDeleteMission("admin")).toBe(true);
    expect(canDeleteMission("org_admin")).toBe(true);
    expect(canDeleteMission("coordinator")).toBe(false);
    expect(canDeleteMission("pilot")).toBe(false);
    expect(canDeleteMission("viewer")).toBe(false);
  });

  it("editar = mismo set que crear", () => {
    for (const r of ROLES) {
      expect(canEditMission(r)).toBe(canCreateMission(r));
    }
  });

  it("aprobar misiones — admin/org_admin/coordinator", () => {
    expect(canApproveMission("admin")).toBe(true);
    expect(canApproveMission("org_admin")).toBe(true);
    expect(canApproveMission("coordinator")).toBe(true);
    expect(canApproveMission("pilot")).toBe(false);
    expect(canApproveMission("viewer")).toBe(false);
  });

  it("transicionar estado — pilot SÍ puede (ejecuta su misión)", () => {
    expect(canTransitionMission("admin")).toBe(true);
    expect(canTransitionMission("org_admin")).toBe(true);
    expect(canTransitionMission("coordinator")).toBe(true);
    expect(canTransitionMission("pilot")).toBe(true);
    expect(canTransitionMission("viewer")).toBe(false);
  });
});

describe("RBAC — Flota", () => {
  it("solo admin y org_admin gestionan flota", () => {
    expect(canManageFleet("admin")).toBe(true);
    expect(canManageFleet("org_admin")).toBe(true);
    expect(canManageFleet("coordinator")).toBe(false);
    expect(canManageFleet("pilot")).toBe(false);
    expect(canManageFleet("viewer")).toBe(false);
  });

  it("gestionar pilotos = mismo set que flota", () => {
    for (const r of ROLES) {
      expect(canManagePilots(r)).toBe(canManageFleet(r));
    }
  });
});

describe("RBAC — Compliance", () => {
  it("pilot puede firmar compliance (es su trabajo)", () => {
    expect(canSignCompliance("pilot")).toBe(true);
    expect(canSignCompliance("admin")).toBe(true);
    expect(canSignCompliance("org_admin")).toBe(true);
  });

  it("coordinator NO firma compliance (no es piloto técnico)", () => {
    expect(canSignCompliance("coordinator")).toBe(false);
    expect(canSignCompliance("viewer")).toBe(false);
  });

  it("generar dossier PDF — todos menos viewer", () => {
    expect(canGenerateDossier("admin")).toBe(true);
    expect(canGenerateDossier("org_admin")).toBe(true);
    expect(canGenerateDossier("coordinator")).toBe(true);
    expect(canGenerateDossier("pilot")).toBe(true);
    expect(canGenerateDossier("viewer")).toBe(false);
  });
});

describe("RBAC — Usuarios", () => {
  it("solo admin y org_admin gestionan usuarios", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("org_admin")).toBe(true);
    expect(canManageUsers("coordinator")).toBe(false);
    expect(canManageUsers("pilot")).toBe(false);
    expect(canManageUsers("viewer")).toBe(false);
  });
});

describe("RBAC — etiquetas humanizadas", () => {
  it("ROLE_LABELS cubre los 5 roles", () => {
    expect(ROLE_LABELS.admin).toBeTruthy();
    expect(ROLE_LABELS.org_admin).toBeTruthy();
    expect(ROLE_LABELS.coordinator).toBeTruthy();
    expect(ROLE_LABELS.pilot).toBeTruthy();
    expect(ROLE_LABELS.viewer).toBeTruthy();
  });
});

describe("RBAC — fail-closed por defecto", () => {
  it("rol vacio o desconocido bloquea todas las acciones de escritura", () => {
    const badRoles = ["", "unknown", "guest", undefined as unknown as string, null as unknown as string];
    for (const role of badRoles) {
      expect(canCreateMission(role)).toBe(false);
      expect(canDeleteMission(role)).toBe(false);
      expect(canManageFleet(role)).toBe(false);
      expect(canManageUsers(role)).toBe(false);
    }
  });
});

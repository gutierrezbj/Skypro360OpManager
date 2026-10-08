import { describe, it, expect } from "vitest";
import {
  calcularLimite,
  diasHastaLimite,
  urgencia,
  estadoGlobal,
  evaluarCoordinacion,
  diasHabilesPermitidos,
  BODY_DEFAULT_DAYS,
} from "@/modules/coordinations/logic";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);

describe("calcularLimite (días hábiles, salta fines de semana)", () => {
  // Caso real del panel de Luis: vuelo viernes 30 oct 2026
  const vuelo = utc("2026-10-30");

  it("Ministerio: 5 días hábiles → viernes 23 oct", () => {
    expect(iso(calcularLimite(vuelo, BODY_DEFAULT_DAYS.mi))).toBe("2026-10-23");
  });

  it("Helipuerto: 10 días hábiles → viernes 16 oct", () => {
    expect(iso(calcularLimite(vuelo, BODY_DEFAULT_DAYS.helipuerto))).toBe("2026-10-16");
  });

  it("Aeropuerto: 20 días hábiles → viernes 2 oct", () => {
    expect(iso(calcularLimite(vuelo, BODY_DEFAULT_DAYS.aeropuerto))).toBe("2026-10-02");
  });

  it("Defensa 15 días → viernes 9 oct", () => {
    expect(iso(calcularLimite(vuelo, 15))).toBe("2026-10-09");
  });

  it("vuelo en lunes: 1 día hábil → viernes anterior", () => {
    expect(iso(calcularLimite(utc("2026-11-02"), 1))).toBe("2026-10-30");
  });

  it("ignora la hora de la fecha de vuelo", () => {
    expect(iso(calcularLimite(new Date("2026-10-30T18:45:00Z"), 5))).toBe("2026-10-23");
  });
});

describe("diasHastaLimite", () => {
  it("positivo antes del límite", () => {
    expect(diasHastaLimite(utc("2026-10-02"), utc("2026-09-26"))).toBe(6);
  });
  it("cero el mismo día", () => {
    expect(diasHastaLimite(utc("2026-10-02"), utc("2026-10-02"))).toBe(0);
  });
  it("negativo si ya pasó", () => {
    expect(diasHastaLimite(utc("2026-10-02"), utc("2026-10-05"))).toBe(-3);
  });
});

describe("urgencia", () => {
  const limite = utc("2026-10-10");
  it("aprobada gana a todo", () => {
    expect(urgencia("aprobada", limite, utc("2026-12-01"))).toBe("aprobada");
  });
  it("superado si el límite ya pasó", () => {
    expect(urgencia("enviada", limite, utc("2026-10-11"))).toBe("superado");
  });
  it("urgente a ≤3 días (incluye el mismo día)", () => {
    expect(urgencia("pendiente", limite, utc("2026-10-07"))).toBe("urgente");
    expect(urgencia("pendiente", limite, utc("2026-10-10"))).toBe("urgente");
  });
  it("próximo a ≤7 días", () => {
    expect(urgencia("pendiente", limite, utc("2026-10-03"))).toBe("proximo");
    expect(urgencia("pendiente", limite, utc("2026-10-06"))).toBe("proximo");
  });
  it("en plazo a >7 días", () => {
    expect(urgencia("pendiente", limite, utc("2026-10-02"))).toBe("en_plazo");
  });
});

describe("estadoGlobal", () => {
  const vuelo = utc("2026-10-30");
  const hoy = utc("2026-09-26");

  it("sin coordinaciones", () => {
    expect(estadoGlobal([], vuelo, hoy)).toBe("sin_coordinaciones");
  });
  it("sin fecha de vuelo → sin_coordinaciones (fuera del semáforo)", () => {
    expect(estadoGlobal([{ estado: "pendiente", diasHabiles: 5 }], null, hoy)).toBe("sin_coordinaciones");
  });
  it("pasada si la fecha de vuelo ya pasó", () => {
    expect(estadoGlobal([{ estado: "pendiente", diasHabiles: 5 }], vuelo, utc("2026-11-01"))).toBe("pasada");
  });
  it("lista si todas aprobadas", () => {
    expect(estadoGlobal([{ estado: "aprobada", diasHabiles: 5 }, { estado: "aprobada", diasHabiles: 20 }], vuelo, hoy)).toBe("lista");
  });
  it("el peor nivel manda (caso Luis: aeropuerto próximo, resto en plazo)", () => {
    expect(estadoGlobal([
      { estado: "enviada", diasHabiles: 5 },
      { estado: "enviada", diasHabiles: 10 },
      { estado: "pendiente", diasHabiles: 20 },
    ], vuelo, hoy)).toBe("proximo");
  });
  it("urgente > próximo", () => {
    expect(estadoGlobal([
      { estado: "pendiente", diasHabiles: 20 },
      { estado: "pendiente", diasHabiles: 15 },
    ], vuelo, utc("2026-09-30"))).toBe("urgente");
  });
  it("aprobadas no cuentan para el peor nivel", () => {
    expect(estadoGlobal([
      { estado: "aprobada", diasHabiles: 20 },
      { estado: "pendiente", diasHabiles: 5 },
    ], vuelo, hoy)).toBe("en_plazo");
  });
});

describe("evaluarCoordinacion", () => {
  it("devuelve límite, urgencia y días restantes", () => {
    const v = evaluarCoordinacion({ estado: "pendiente", diasHabiles: 20, contacto: null }, utc("2026-10-30"), utc("2026-09-26"));
    expect(iso(v.limite!)).toBe("2026-10-02");
    expect(v.urgencia).toBe("proximo");
    expect(v.diasRestantes).toBe(6);
    expect(v.contacto).toBeNull();
  });
  it("sin fecha de vuelo todo null", () => {
    const v = evaluarCoordinacion({ estado: "pendiente", diasHabiles: 5 }, null);
    expect(v.limite).toBeNull();
    expect(v.urgencia).toBeNull();
  });
});

describe("diasHabilesPermitidos", () => {
  it("fijos para mi/helipuerto/aeropuerto", () => {
    expect(diasHabilesPermitidos("mi", 5)).toBe(true);
    expect(diasHabilesPermitidos("mi", 6)).toBe(false);
    expect(diasHabilesPermitidos("aeropuerto", 20)).toBe(true);
  });
  it("defensa entre 11 y 15 hábiles (≥ 15 naturales, AIC NTL 01/26)", () => {
    expect(diasHabilesPermitidos("defensa", 11)).toBe(true);
    expect(diasHabilesPermitidos("defensa", 15)).toBe(true);
    expect(diasHabilesPermitidos("defensa", 10)).toBe(false);
    expect(diasHabilesPermitidos("defensa", 16)).toBe(false);
    expect(diasHabilesPermitidos("defensa", 12.5)).toBe(false);
  });
});

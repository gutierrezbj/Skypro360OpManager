"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Mission, MissionCoordination } from "@/lib/db/schema";
import { ChevronDownIcon, ChevronRightIcon, CalendarIcon } from "@/lib/icons";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import CoordinationsSection from "@/modules/coordinations/components/CoordinationsSection";
import { BODY_ICONS } from "@/modules/coordinations/components/bodyIcons";
import {
  BODY_ORDER,
  BODY_SHORT,
  BODY_LABELS,
  URGENCY_META,
  GLOBAL_META,
  evaluarCoordinacion,
  estadoGlobal,
  diasHastaLimite,
  fmtLimite,
} from "@/modules/coordinations/logic";

type Props = {
  missions: Mission[];
  coordinations: MissionCoordination[];
  canEdit: boolean;
};

const TERMINAL = new Set(["completed", "aborted", "cancelled"]);

export default function CoordinacionesClient({ missions, coordinations, canEdit }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const now = useMemo(() => new Date(), []);

  const byMission = useMemo(() => {
    const map = new Map<string, MissionCoordination[]>();
    for (const c of coordinations) {
      const arr = map.get(c.missionId) ?? [];
      arr.push(c);
      map.set(c.missionId, arr);
    }
    return map;
  }, [coordinations]);

  const rows = useMemo(() => {
    return missions
      .map((m) => {
        const coords = byMission.get(m.id) ?? [];
        const fecha = m.scheduledStart ? new Date(m.scheduledStart) : null;
        const global = estadoGlobal(coords, fecha, now);
        const diasVuelo = fecha ? diasHastaLimite(fecha, now) : null;
        const isPast = TERMINAL.has(m.status) || global === "pasada";
        const evaluated = coords
          .map((c) => evaluarCoordinacion(c, fecha, now))
          .sort((a, b) => BODY_ORDER.indexOf(a.organismo) - BODY_ORDER.indexOf(b.organismo));
        return { mission: m, coords, evaluated, fecha, global, diasVuelo, isPast };
      })
      .filter((r) => showPast || !r.isPast)
      .sort((a, b) => {
        const ta = a.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const tb = b.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });
  }, [missions, byMission, now, showPast]);

  const attention = useMemo(() => {
    return rows
      .filter((r) => !r.isPast)
      .flatMap((r) =>
        r.evaluated
          .filter((c) => c.urgencia && c.urgencia !== "aprobada" && c.urgencia !== "en_plazo")
          .map((c) => ({ ...c, mission: r.mission, fecha: r.fecha })),
      )
      .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0));
  }, [rows]);

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--sky-border)" }}
      >
        <div>
          <h1
            className="text-base font-semibold uppercase tracking-wide"
            style={{ color: "var(--sky-text)", fontFamily: "var(--font-barlow-condensed), sans-serif", fontSize: "16px", letterSpacing: "0.08em" }}
          >
            Centro de <span style={{ color: "var(--sky-accent-blue)" }}>coordinación</span>
          </h1>
          <p className="text-xs" style={{ color: "var(--sky-muted)" }}>
            Organismos a avisar antes de cada vuelo y plazos en días hábiles
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--sky-muted)" }}>
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          Mostrar pasadas y cerradas
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Requieren atención */}
        <section>
          <SectionTitle title="Requieren atención" count={attention.length} />
          {attention.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--sky-muted)" }}>Nada urgente. Todo en plazo o aprobado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {attention.map((a) => {
                const um = URGENCY_META[a.urgencia!];
                const Icon = BODY_ICONS[a.organismo];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setOpen(a.mission.id)}
                    className="rounded-xl p-3 text-left transition-all hover:opacity-90"
                    style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)", borderLeft: `4px solid ${um.color}` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--sky-muted)" }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: um.color }} />
                        {BODY_SHORT[a.organismo]}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: um.color, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                        {a.diasRestantes! < 0 ? `Superado · hace ${-a.diasRestantes!} d` : a.diasRestantes === 0 ? "Vence hoy" : `Vence en ${a.diasRestantes} d`}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--sky-text)" }}>{a.mission.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--sky-muted)" }}>
                      Límite: {fmtLimite(a.limite)} · vuelo {fmtLimite(a.fecha)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Operaciones */}
        <section>
          <SectionTitle title="Operaciones" count={rows.length} />
          {rows.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--sky-muted)" }}>No hay operaciones activas.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const gm = GLOBAL_META[r.global];
                const isOpen = open === r.mission.id;
                return (
                  <div
                    key={r.mission.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--sky-surface)", border: `1px solid ${isOpen ? gm.border : "var(--sky-border)"}` }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : r.mission.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--sky-surface-2)]"
                    >
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: gm.color, boxShadow: `0 0 6px ${gm.color}` }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: "var(--sky-accent-blue)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                            {r.mission.code}
                          </span>
                          <span className="truncate text-sm font-semibold" style={{ color: "var(--sky-text)" }}>{r.mission.name}</span>
                          <MissionStatusBadge status={r.mission.status} />
                        </div>
                        {r.evaluated.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {r.evaluated.map((c) => {
                              const um = c.urgencia ? URGENCY_META[c.urgencia] : null;
                              const Icon = BODY_ICONS[c.organismo];
                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                                  style={um
                                    ? { background: um.bg, color: um.color, border: `1px solid ${um.border}` }
                                    : { background: "var(--sky-surface-2)", color: "var(--sky-muted)", border: "1px solid var(--sky-border-2)" }}
                                  title={`${BODY_LABELS[c.organismo]} · ${um ? um.label : "sin fecha"}`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {BODY_SHORT[c.organismo]}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-1 text-[11px]" style={{ color: "var(--sky-muted)" }}>Sin organismos añadidos</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {r.fecha ? (
                          <>
                            <p className="flex items-center justify-end gap-1 text-sm font-bold" style={{ color: "var(--sky-text)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                              <CalendarIcon className="h-3.5 w-3.5" style={{ color: "var(--sky-muted)" }} />
                              {fmtLimite(r.fecha)}
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--sky-muted)" }}>
                              {r.diasVuelo! < 0 ? `hace ${-r.diasVuelo!} días` : r.diasVuelo === 0 ? "hoy" : `en ${r.diasVuelo} días`}
                              {" "}
                              <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: gm.bg, color: gm.color, border: `1px solid ${gm.border}` }}>
                                {gm.label}
                              </span>
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] font-semibold" style={{ color: "var(--sky-accent-yellow)" }}>Sin fecha de vuelo</p>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronDownIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--sky-muted)" }} />
                        : <ChevronRightIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--sky-muted)" }} />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--sky-border)" }}>
                        <div className="mt-4">
                          <CoordinationsSection mission={r.mission} coordinations={r.coords} canEdit={canEdit && !r.isPast} />
                        </div>
                        <Link
                          href={`/missions/${r.mission.id}/compliance`}
                          className="text-xs font-semibold hover:opacity-80"
                          style={{ color: "var(--sky-accent-blue)" }}
                        >
                          Abrir ficha completa de la operación →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>{title}</h2>
      <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: "var(--sky-surface-2)", color: "var(--sky-muted)", border: "1px solid var(--sky-border-2)" }}>
        {count}
      </span>
    </div>
  );
}

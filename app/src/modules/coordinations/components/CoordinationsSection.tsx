"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Mission, MissionCoordination } from "@/lib/db/schema";
import {
  BODY_ORDER,
  BODY_LABELS,
  BODY_DEFAULT_DAYS,
  DEFENSA_RANGE,
  STATUS_LABELS,
  URGENCY_META,
  GLOBAL_META,
  evaluarCoordinacion,
  estadoGlobal,
  fmtLimite,
  type CoordinationBody,
  type CoordinationStatus,
} from "../logic";
import { addCoordination, updateCoordination, removeCoordination } from "../actions/coordination.actions";

type Props = {
  mission: Mission;
  coordinations: MissionCoordination[];
  canEdit: boolean;
};

const STATUSES: CoordinationStatus[] = ["pendiente", "enviada", "aprobada"];

export default function CoordinationsSection({ mission, coordinations, canEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<CoordinationBody | "">("");
  const [defensaDias, setDefensaDias] = useState<number>(BODY_DEFAULT_DAYS.defensa);

  const fechaVuelo = mission.scheduledStart ? new Date(mission.scheduledStart) : null;
  const rows = coordinations
    .map((c) => evaluarCoordinacion(c, fechaVuelo))
    .sort((a, b) => BODY_ORDER.indexOf(a.organismo) - BODY_ORDER.indexOf(b.organismo));
  const global = estadoGlobal(coordinations, fechaVuelo);
  const gm = GLOBAL_META[global];
  const remaining = BODY_ORDER.filter((b) => !coordinations.some((c) => c.organismo === b));

  function run(action: (prev: null, fd: FormData) => Promise<{ success: boolean; error?: string }>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await action(null, fd);
      if (!res.success) setError(res.error ?? "Error");
      else router.refresh();
    });
  }

  function handleAdd() {
    if (!adding) return;
    const fd = new FormData();
    fd.set("missionId", mission.id);
    fd.set("organismo", adding);
    if (adding === "defensa") fd.set("diasHabiles", String(defensaDias));
    run(addCoordination, fd);
    setAdding("");
  }

  function setStatus(id: string, estado: CoordinationStatus) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("estado", estado);
    run(updateCoordination, fd);
  }

  function setContact(id: string, contacto: string, prev: string | null) {
    if ((prev ?? "") === contacto.trim()) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("contacto", contacto);
    run(updateCoordination, fd);
  }

  function setDias(id: string, dias: number, prev: number) {
    if (dias === prev) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("diasHabiles", String(dias));
    run(updateCoordination, fd);
  }

  function remove(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    run(removeCoordination, fd);
  }

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${gm.border}`, background: "var(--sky-surface)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--sky-border)", background: gm.bg }}
      >
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: gm.color, boxShadow: `0 0 6px ${gm.color}` }} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>
              Coordinaciones aeronáuticas
            </p>
            <p className="text-sm font-semibold" style={{ color: gm.color }}>{gm.label}</p>
          </div>
        </div>
        <div className="text-right text-[11px]" style={{ color: "var(--sky-muted)" }}>
          {fechaVuelo
            ? <>Vuelo: <span style={{ color: "var(--sky-text)", fontWeight: 600 }}>{fmtLimite(fechaVuelo)}</span></>
            : <span style={{ color: "var(--sky-accent-yellow)", fontWeight: 600 }}>Sin fecha de vuelo — no se calculan plazos</span>}
        </div>
      </div>

      <div className="px-4 py-3">
        {error && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-xs"
            style={{ background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)", color: "var(--sky-accent-red)" }}
          >
            {error}
          </div>
        )}

        {rows.length === 0 && (
          <p className="text-sm" style={{ color: "var(--sky-muted)" }}>
            Esta operación no tiene organismos que coordinar.{canEdit ? " Añade uno abajo si aplica." : ""}
          </p>
        )}

        <div className="divide-y" style={{ borderColor: "var(--sky-border)" }}>
          {rows.map((r) => {
            const um = r.urgencia ? URGENCY_META[r.urgencia] : null;
            return (
              <div key={r.id} className="py-3 first:pt-0 last:pb-0" style={{ borderColor: "var(--sky-border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--sky-text)" }}>
                        {BODY_LABELS[r.organismo]}
                      </span>
                      {um ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                          style={{ background: um.bg, color: um.color, border: `1px solid ${um.border}` }}
                        >
                          {um.label}
                          {r.urgencia !== "aprobada" && r.diasRestantes !== null && (
                            r.diasRestantes >= 0 ? ` · ${r.diasRestantes} d` : ` · hace ${-r.diasRestantes} d`
                          )}
                        </span>
                      ) : (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                          style={{ background: "var(--sky-surface-2)", color: "var(--sky-muted)", border: "1px solid var(--sky-border-2)" }}
                        >
                          {STATUS_LABELS[r.estado]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--sky-muted)" }}>
                      {r.organismo === "defensa" && canEdit ? (
                        <>
                          Antelación:{" "}
                          <input
                            type="number"
                            min={DEFENSA_RANGE.min}
                            max={DEFENSA_RANGE.max}
                            defaultValue={r.diasHabiles}
                            disabled={isPending}
                            onBlur={(e) => setDias(r.id, Number(e.target.value), r.diasHabiles)}
                            className="w-12 rounded px-1 py-0.5 text-[11px]"
                            style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
                            aria-label="Días hábiles de antelación (Defensa)"
                          />{" "}
                          días hábiles
                        </>
                      ) : (
                        <>Antelación: {r.diasHabiles} días hábiles</>
                      )}
                      {" · "}Límite:{" "}
                      <span style={{ color: "var(--sky-text)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                        {fmtLimite(r.limite)}
                      </span>
                    </p>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      disabled={isPending}
                      aria-label={`Quitar ${BODY_LABELS[r.organismo]}`}
                      title="Quitar organismo"
                      className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs hover:opacity-80 disabled:opacity-40"
                      style={{ color: "var(--sky-muted)", border: "1px solid var(--sky-border)" }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {STATUSES.map((s) => {
                    const active = r.estado === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!canEdit || isPending}
                        onClick={() => setStatus(r.id, s)}
                        className="rounded-md px-3 py-1 text-xs font-semibold transition-all disabled:cursor-default"
                        style={
                          active
                            ? { background: "var(--sky-accent-blue)", color: "#fff", border: "1px solid var(--sky-accent-blue)" }
                            : { background: "var(--sky-surface-2)", color: canEdit ? "var(--sky-text)" : "var(--sky-muted)", border: "1px solid var(--sky-border-2)", opacity: canEdit ? 1 : 0.6 }
                        }
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                  <input
                    type="text"
                    defaultValue={r.contacto ?? ""}
                    placeholder="Contacto (nombre, email o teléfono)"
                    readOnly={!canEdit}
                    disabled={isPending}
                    onBlur={(e) => canEdit && setContact(r.id, e.target.value, r.contacto)}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="min-w-[200px] flex-1 rounded-md px-2.5 py-1 text-xs outline-none"
                    style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
                    aria-label={`Contacto en ${BODY_LABELS[r.organismo]}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {canEdit && remaining.length > 0 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2 pt-3"
            style={{ borderTop: rows.length > 0 ? "1px solid var(--sky-border)" : "none" }}
          >
            <select
              value={adding}
              onChange={(e) => setAdding(e.target.value as CoordinationBody | "")}
              disabled={isPending}
              className="rounded-md px-2.5 py-1.5 text-xs"
              style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
              aria-label="Organismo a añadir"
            >
              <option value="">+ Añadir organismo…</option>
              {remaining.map((b) => (
                <option key={b} value={b}>
                  {BODY_LABELS[b]} ({b === "defensa" ? `${DEFENSA_RANGE.min}–${DEFENSA_RANGE.max}` : BODY_DEFAULT_DAYS[b]} d hábiles)
                </option>
              ))}
            </select>
            {adding === "defensa" && (
              <input
                type="number"
                min={DEFENSA_RANGE.min}
                max={DEFENSA_RANGE.max}
                value={defensaDias}
                onChange={(e) => setDefensaDias(Number(e.target.value))}
                className="w-16 rounded-md px-2 py-1.5 text-xs"
                style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
                aria-label="Días hábiles Defensa"
              />
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!adding || isPending}
              className="rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              style={{ background: "var(--sky-accent-blue)", color: "#fff" }}
            >
              {isPending ? "…" : "Añadir"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

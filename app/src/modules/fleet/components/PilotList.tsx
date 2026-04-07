"use client";

import { useState } from "react";
import type { Pilot, User } from "@/lib/db/schema";
import PilotForm from "./PilotForm";
import { PilotIcon } from "@/lib/icons";

const CERT_HEX: Record<string, string> = {
  valid:     "#00D97E",
  expired:   "#E53E3E",
  suspended: "#F04E1C",
  pending:   "#4A8FD4",
};

const CERT_LABELS: Record<string, string> = {
  valid: "Valido", expired: "Expirado", suspended: "Suspendido", pending: "Pendiente",
};

type PilotWithUser = Pilot & { userName?: string; userEmail?: string };

export default function PilotList({
  pilots,
  users,
}: {
  pilots: PilotWithUser[];
  users: Pick<User, "id" | "name" | "email">[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pilot | undefined>();

  function openCreate() {
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(pilot: Pilot) {
    setEditing(pilot);
    setShowForm(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p style={{ color: "var(--sky-muted)" }} className="text-sm">
          {pilots.length} piloto{pilots.length !== 1 ? "s" : ""} registrado{pilots.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          style={{ background: "#0C9FD8", color: "#fff" }}
          className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
        >
          + Nuevo Piloto
        </button>
      </div>

      {pilots.length === 0 ? (
        <div style={{ border: "1px dashed var(--sky-border-2)", color: "var(--sky-muted)" }} className="rounded-lg py-12 text-center">
          <p className="text-sm">No hay pilotos registrados.</p>
          <button onClick={openCreate} style={{ color: "#0C9FD8" }} className="mt-2 text-sm font-medium hover:opacity-80">
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pilots.map((pilot) => {
            const certColor = CERT_HEX[pilot.certificationStatus] ?? "#3A5570";
            return (
              <div
                key={pilot.id}
                style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
                className="overflow-hidden rounded-xl transition-all hover:border-[#1E3A5F]"
              >
                <div className="h-1" style={{ background: certColor }} />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <PilotIcon style={{ color: "#0C9FD8" }} className="h-6 w-6" />
                    <span
                      style={{
                        background: `${certColor}18`,
                        color: certColor,
                        border: `1px solid ${certColor}40`,
                      }}
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {CERT_LABELS[pilot.certificationStatus] ?? pilot.certificationStatus}
                    </span>
                  </div>
                  <h3 style={{ color: "var(--sky-text)" }} className="text-sm font-semibold">{pilot.userName ?? "—"}</h3>
                  {pilot.userEmail && (
                    <p style={{ color: "var(--sky-muted)" }} className="mb-3 text-xs">{pilot.userEmail}</p>
                  )}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--sky-muted)" }}>Licencia</span>
                      <span
                        style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                        className="font-medium"
                      >
                        {pilot.licenseNumber || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--sky-muted)" }}>Horas vuelo</span>
                      <span style={{ color: "var(--sky-text)" }} className="font-medium">{pilot.flightHours ?? "0"}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--sky-muted)" }}>Exp. medico</span>
                      <span style={{ color: "var(--sky-text)" }} className="font-medium">
                        {pilot.medicalExpiry
                          ? new Date(pilot.medicalExpiry).toLocaleDateString("es-ES")
                          : "—"}
                      </span>
                    </div>
                    {pilot.certificationExpiry && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--sky-muted)" }}>Exp. cert.</span>
                        <span style={{ color: "var(--sky-text)" }} className="font-medium">
                          {new Date(pilot.certificationExpiry).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid var(--sky-border)" }} className="mt-3 pt-3">
                    <button
                      onClick={() => openEdit(pilot)}
                      style={{ background: "rgba(12,159,216,0.06)", color: "var(--sky-muted)", border: "1px solid var(--sky-border)" }}
                      className="w-full rounded-md px-2 py-1.5 text-xs font-medium hover:opacity-80"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <PilotForm pilot={editing} users={users} onClose={() => setShowForm(false)} />}
    </div>
  );
}

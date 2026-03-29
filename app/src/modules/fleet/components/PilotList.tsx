"use client";

import { useState } from "react";
import type { Pilot, User } from "@/lib/db/schema";
import PilotForm from "./PilotForm";

const CERT_COLORS: Record<string, string> = {
  valid: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
  pending: "bg-blue-100 text-blue-700",
};

const CERT_LABELS: Record<string, string> = {
  valid: "Valido",
  expired: "Expirado",
  suspended: "Suspendido",
  pending: "Pendiente",
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
        <p className="text-sm text-gray-500">{pilots.length} piloto{pilots.length !== 1 ? "s" : ""} registrado{pilots.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo Piloto
        </button>
      </div>

      {pilots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No hay pilotos registrados.</p>
          <button onClick={openCreate} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pilots.map((pilot) => {
            const certColor: Record<string, string> = {
              valid: "#22c55e",
              expired: "#ef4444",
              suspended: "#f97316",
              pending: "#3b82f6",
            };
            return (
              <div
                key={pilot.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-1.5" style={{ background: certColor[pilot.certificationStatus] ?? "#9ca3af" }} />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/people.svg" alt="" className="h-6 w-6" />
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CERT_COLORS[pilot.certificationStatus] ?? ""}`}>
                      {CERT_LABELS[pilot.certificationStatus] ?? pilot.certificationStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{pilot.userName ?? "—"}</h3>
                  {pilot.userEmail && <p className="mb-3 text-xs text-gray-500">{pilot.userEmail}</p>}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Licencia</span>
                      <span className="font-mono font-medium text-gray-700">{pilot.licenseNumber || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horas vuelo</span>
                      <span className="font-medium text-gray-700">{pilot.flightHours ?? "0"}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exp. medico</span>
                      <span className="font-medium text-gray-700">
                        {pilot.medicalExpiry
                          ? new Date(pilot.medicalExpiry).toLocaleDateString("es-ES")
                          : "—"}
                      </span>
                    </div>
                    {pilot.certificationExpiry && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exp. cert.</span>
                        <span className="font-medium text-gray-700">
                          {new Date(pilot.certificationExpiry).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => openEdit(pilot)}
                      className="w-full rounded-md bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
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

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
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Piloto</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Licencia</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Certificacion</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Horas</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Exp. medico</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pilots.map((pilot) => (
                <tr key={pilot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{pilot.userName ?? "—"}</div>
                    <div className="text-xs text-gray-500">{pilot.userEmail ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pilot.licenseNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CERT_COLORS[pilot.certificationStatus] ?? ""}`}>
                      {CERT_LABELS[pilot.certificationStatus] ?? pilot.certificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pilot.flightHours ?? "0"}h</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pilot.medicalExpiry
                      ? new Date(pilot.medicalExpiry).toLocaleDateString("es-ES")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(pilot)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <PilotForm pilot={editing} users={users} onClose={() => setShowForm(false)} />}
    </div>
  );
}

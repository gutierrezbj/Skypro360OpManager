"use client";

import { useState } from "react";
import type { Drone } from "@/lib/db/schema";
import DroneForm from "./DroneForm";
import DroneStatusBadge from "./DroneStatusBadge";

export default function DroneList({ drones }: { drones: Drone[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Drone | undefined>();

  function openCreate() {
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(drone: Drone) {
    setEditing(drone);
    setShowForm(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{drones.length} drone{drones.length !== 1 ? "s" : ""} registrado{drones.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo Drone
        </button>
      </div>

      {drones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No hay drones registrados.</p>
          <button onClick={openCreate} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {drones.map((drone) => {
            const statusColor: Record<string, string> = {
              active: "#22c55e",
              maintenance: "#eab308",
              retired: "#9ca3af",
              pending_registration: "#3b82f6",
            };
            return (
              <div
                key={drone.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-1.5" style={{ background: statusColor[drone.status] ?? "#9ca3af" }} />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/drone.svg" alt="" className="h-6 w-6" />
                    <DroneStatusBadge status={drone.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{drone.model}</h3>
                  <p className="mb-3 text-xs text-gray-500">{drone.manufacturer}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">S/N</span>
                      <span className="font-mono font-medium text-gray-700">{drone.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registro</span>
                      <span className="font-medium text-gray-700">{drone.registrationNumber || "—"}</span>
                    </div>
                    {drone.easaClass && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Clase EASA</span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{drone.easaClass}</span>
                      </div>
                    )}
                    {drone.maxFlightTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vuelo max</span>
                        <span className="font-medium text-gray-700">{drone.maxFlightTime} min</span>
                      </div>
                    )}
                    {drone.insuranceExpiry && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Seguro exp.</span>
                        <span className="font-medium text-gray-700">{new Date(drone.insuranceExpiry).toLocaleDateString("es-ES")}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => openEdit(drone)}
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

      {showForm && <DroneForm drone={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

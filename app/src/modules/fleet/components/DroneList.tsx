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
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Drone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">S/N</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Registro</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Clase</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {drones.map((drone) => (
                <tr key={drone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{drone.model}</div>
                    <div className="text-xs text-gray-500">{drone.manufacturer}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{drone.serialNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{drone.registrationNumber || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {drone.easaClass ? (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">{drone.easaClass}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3"><DroneStatusBadge status={drone.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(drone)}
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

      {showForm && <DroneForm drone={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

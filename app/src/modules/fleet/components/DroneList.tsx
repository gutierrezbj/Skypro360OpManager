"use client";

import { useState } from "react";
import type { Drone } from "@/lib/db/schema";
import DroneForm from "./DroneForm";
import DroneStatusBadge from "./DroneStatusBadge";
import { DroneIcon } from "@/lib/icons";

const DRONE_STATUS_HEX: Record<string, string> = {
  active:               "#00D97E",
  maintenance:          "#F5C518",
  retired:              "#3A5570",
  pending_registration: "#4A8FD4",
};

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
        <p style={{ color: "#6BA3C0" }} className="text-sm">
          {drones.length} drone{drones.length !== 1 ? "s" : ""} registrado{drones.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          style={{ background: "#0C9FD8", color: "#fff" }}
          className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
        >
          + Nuevo Drone
        </button>
      </div>

      {drones.length === 0 ? (
        <div style={{ border: "1px dashed #1E3A5F", color: "#6BA3C0" }} className="rounded-lg py-12 text-center">
          <p className="text-sm">No hay drones registrados.</p>
          <button onClick={openCreate} style={{ color: "#0C9FD8" }} className="mt-2 text-sm font-medium hover:opacity-80">
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {drones.map((drone) => (
            <div
              key={drone.id}
              style={{ background: "#0D1520", border: "1px solid #162338" }}
              className="overflow-hidden rounded-xl transition-all hover:border-[#1E3A5F]"
            >
              <div className="h-1" style={{ background: DRONE_STATUS_HEX[drone.status] ?? "#3A5570" }} />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <DroneIcon style={{ color: "#0C9FD8" }} className="h-6 w-6" />
                  <DroneStatusBadge status={drone.status} />
                </div>
                <h3 style={{ color: "#D6E8F5" }} className="text-sm font-semibold">{drone.model}</h3>
                <p style={{ color: "#6BA3C0" }} className="mb-3 text-xs">{drone.manufacturer}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: "#6BA3C0" }}>S/N</span>
                    <span
                      style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                      className="font-medium"
                    >
                      {drone.serialNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6BA3C0" }}>Registro</span>
                    <span style={{ color: "#D6E8F5" }} className="font-medium">{drone.registrationNumber || "—"}</span>
                  </div>
                  {drone.easaClass && (
                    <div className="flex justify-between">
                      <span style={{ color: "#6BA3C0" }}>Clase EASA</span>
                      <span
                        style={{ background: "#111D2E", color: "#D6E8F5", border: "1px solid #162338" }}
                        className="rounded px-2 py-0.5 font-medium text-xs"
                      >
                        {drone.easaClass}
                      </span>
                    </div>
                  )}
                  {drone.maxFlightTime && (
                    <div className="flex justify-between">
                      <span style={{ color: "#6BA3C0" }}>Vuelo max</span>
                      <span style={{ color: "#D6E8F5" }} className="font-medium">{drone.maxFlightTime} min</span>
                    </div>
                  )}
                  {drone.insuranceExpiry && (
                    <div className="flex justify-between">
                      <span style={{ color: "#6BA3C0" }}>Seguro exp.</span>
                      <span style={{ color: "#D6E8F5" }} className="font-medium">
                        {new Date(drone.insuranceExpiry).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ borderTop: "1px solid #162338" }} className="mt-3 pt-3">
                  <button
                    onClick={() => openEdit(drone)}
                    style={{ background: "rgba(12,159,216,0.06)", color: "#6BA3C0", border: "1px solid #162338" }}
                    className="w-full rounded-md px-2 py-1.5 text-xs font-medium hover:opacity-80"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <DroneForm drone={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";
import MissionStatusBadge from "./MissionStatusBadge";
import MissionForm from "./MissionForm";
import MissionDetail from "./MissionDetail";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "../state-machine";

type PilotWithUser = Pilot & { userName?: string };
type Props = {
  missions: Mission[];
  drones: Drone[];
  pilots: PilotWithUser[];
  users: Pick<User, "id" | "name" | "email">[];
};

export default function MissionList({ missions, drones, pilots, users }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Mission | undefined>();
  const [viewing, setViewing] = useState<Mission | undefined>();
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? missions
      : missions.filter((m) => m.status === filter);

  const statusCounts = missions.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});

  function openCreate() {
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(m: Mission) {
    setViewing(undefined);
    setEditing(m);
    setShowForm(true);
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip label="Todas" value="all" count={missions.length} active={filter} onClick={setFilter} />
        <FilterChip label="Borrador" value="draft" count={statusCounts.draft} active={filter} onClick={setFilter} />
        <FilterChip label="Planificadas" value="planned" count={statusCounts.planned} active={filter} onClick={setFilter} />
        <FilterChip label="Aprobadas" value="approved" count={statusCounts.approved} active={filter} onClick={setFilter} />
        <FilterChip label="En vuelo" value="in_flight" count={statusCounts.in_flight} active={filter} onClick={setFilter} />
        <FilterChip label="Completadas" value="completed" count={statusCounts.completed} active={filter} onClick={setFilter} />
        <div className="ml-auto">
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nueva Mision
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No hay misiones{filter !== "all" ? " en este estado" : ""}.</p>
          {filter === "all" && (
            <button onClick={openCreate} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Codigo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mision</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Piloto</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Drone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((m) => {
                const pilot = pilots.find((p) => p.id === m.pilotId);
                const drone = drones.find((d) => d.id === m.droneId);
                return (
                  <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewing(m)}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{m.code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{m.name}</div>
                      {m.description && (
                        <div className="max-w-xs truncate text-xs text-gray-500">{m.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MissionStatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${PRIORITY_COLORS[m.priority] ?? ""}`}>
                        {PRIORITY_LABELS[m.priority] ?? m.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pilot?.userName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{drone?.model ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.scheduledStart
                        ? new Date(m.scheduledStart).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(m)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MissionForm
          mission={editing}
          drones={drones}
          pilots={pilots}
          users={users}
          onClose={() => setShowForm(false)}
        />
      )}

      {viewing && (
        <MissionDetail
          mission={viewing}
          drones={drones}
          pilots={pilots}
          onClose={() => setViewing(undefined)}
          onEdit={() => openEdit(viewing)}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  value,
  count,
  active,
  onClick,
}: {
  label: string;
  value: string;
  count?: number;
  active: string;
  onClick: (v: string) => void;
}) {
  const isActive = active === value;
  if (!count && value !== "all") return null;
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label} {count !== undefined ? `(${count})` : ""}
    </button>
  );
}

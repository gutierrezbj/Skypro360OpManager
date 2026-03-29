"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";
import MissionStatusBadge from "./MissionStatusBadge";
import MissionForm from "./MissionForm";
import MissionDetail from "./MissionDetail";
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS } from "../state-machine";

const MARKER_COLORS: Record<string, string> = {
  draft: "#9ca3af",
  planned: "#3b82f6",
  approved: "#6366f1",
  preflight: "#eab308",
  in_flight: "#10b981",
  completed: "#22c55e",
  aborted: "#ef4444",
  cancelled: "#6b7280",
};

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

      {/* Card grid */}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => {
            const pilot = pilots.find((p) => p.id === m.pilotId);
            const drone = drones.find((d) => d.id === m.droneId);
            const statusColor = MARKER_COLORS[m.status] ?? "#9ca3af";
            return (
              <div
                key={m.id}
                onClick={() => setViewing(m)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Status color bar top */}
                <div className="h-1.5" style={{ background: statusColor }} />

                <div className="p-4">
                  {/* Header: code + status */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-400">{m.code}</span>
                    <MissionStatusBadge status={m.status} />
                  </div>

                  {/* Name */}
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 line-clamp-2">{m.name}</h3>
                  {m.description && (
                    <p className="mb-3 text-xs text-gray-500 line-clamp-2">{m.description}</p>
                  )}

                  {/* Info rows */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Prioridad</span>
                      <span className={`font-medium ${PRIORITY_COLORS[m.priority] ?? ""}`}>
                        {PRIORITY_LABELS[m.priority] ?? m.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">&#9992; Drone</span>
                      <span className="font-medium text-gray-700">{drone?.model ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">&#128100; Piloto</span>
                      <span className="font-medium text-gray-700">{pilot?.userName ?? "—"}</span>
                    </div>
                    {m.scheduledStart && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Fecha</span>
                        <span className="font-medium text-gray-700">
                          {new Date(m.scheduledStart).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/missions/${m.id}/compliance`}
                      className="flex-1 rounded-md bg-indigo-50 px-2 py-1.5 text-center text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                    >
                      Compliance
                    </Link>
                    <button
                      onClick={() => openEdit(m)}
                      className="flex-1 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
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

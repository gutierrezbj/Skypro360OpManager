"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";
import MissionStatusBadge from "./MissionStatusBadge";
import MissionForm from "./MissionForm";
import MissionDetail from "./MissionDetail";
import { PRIORITY_LABELS, STATUS_HEX } from "../state-machine";

const PRIORITY_HEX: Record<string, string> = {
  low:    "#4A8FD4",
  normal: "#D6E8F5",
  high:   "#F5C518",
  urgent: "#F04E1C",
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
    filter === "all" ? missions : missions.filter((m) => m.status === filter);

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
        <FilterChip label="Borrador"    value="draft"     count={statusCounts.draft}     active={filter} onClick={setFilter} />
        <FilterChip label="Planificadas" value="planned"  count={statusCounts.planned}   active={filter} onClick={setFilter} />
        <FilterChip label="Aprobadas"   value="approved"  count={statusCounts.approved}  active={filter} onClick={setFilter} />
        <FilterChip label="En vuelo"    value="in_flight" count={statusCounts.in_flight} active={filter} onClick={setFilter} />
        <FilterChip label="Completadas" value="completed" count={statusCounts.completed} active={filter} onClick={setFilter} />
        <div className="ml-auto">
          <button
            onClick={openCreate}
            style={{ background: "#0C9FD8", color: "#fff" }}
            className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          >
            + Nueva Mision
          </button>
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div
          style={{ border: "1px dashed #1E3A5F", color: "#6BA3C0" }}
          className="rounded-lg py-12 text-center"
        >
          <p className="text-sm">No hay misiones{filter !== "all" ? " en este estado" : ""}.</p>
          {filter === "all" && (
            <button
              onClick={openCreate}
              style={{ color: "#0C9FD8" }}
              className="mt-2 text-sm font-medium hover:opacity-80"
            >
              Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => {
            const pilot = pilots.find((p) => p.id === m.pilotId);
            const drone = drones.find((d) => d.id === m.droneId);
            const statusColor = STATUS_HEX[m.status as keyof typeof STATUS_HEX] ?? "#3A5570";
            return (
              <div
                key={m.id}
                onClick={() => setViewing(m)}
                style={{ background: "#0D1520", border: "1px solid #162338" }}
                className="group relative cursor-pointer overflow-hidden rounded-xl transition-all hover:border-[#1E3A5F]"
              >
                {/* Status bar */}
                <div className="h-1" style={{ background: statusColor }} />

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains-mono, monospace)" }} className="text-xs">
                      {m.code}
                    </span>
                    <MissionStatusBadge status={m.status} />
                  </div>

                  <h3 style={{ color: "#D6E8F5" }} className="mb-1 text-sm font-semibold line-clamp-2">{m.name}</h3>
                  {m.description && (
                    <p style={{ color: "#6BA3C0" }} className="mb-3 text-xs line-clamp-2">{m.description}</p>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#6BA3C0" }}>Prioridad</span>
                      <span style={{ color: PRIORITY_HEX[m.priority] ?? "#D6E8F5" }} className="font-medium">
                        {PRIORITY_LABELS[m.priority] ?? m.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#6BA3C0" }}>Drone</span>
                      <span style={{ color: "#D6E8F5" }} className="font-medium">{drone?.model ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#6BA3C0" }}>Piloto</span>
                      <span style={{ color: "#D6E8F5" }} className="font-medium">{pilot?.userName ?? "—"}</span>
                    </div>
                    {m.scheduledStart && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: "#6BA3C0" }}>Fecha</span>
                        <span style={{ color: "#D6E8F5" }} className="font-medium">
                          {new Date(m.scheduledStart).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{ borderTop: "1px solid #162338" }}
                    className="mt-3 flex gap-2 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/missions/${m.id}/compliance`}
                      style={{ background: "rgba(12,159,216,0.08)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.2)" }}
                      className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium hover:opacity-80"
                    >
                      Compliance
                    </Link>
                    <button
                      onClick={() => openEdit(m)}
                      style={{ background: "rgba(12,159,216,0.06)", color: "#6BA3C0", border: "1px solid #162338" }}
                      className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium hover:opacity-80"
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
  label, value, count, active, onClick,
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
      style={
        isActive
          ? { background: "#0C9FD8", color: "#fff" }
          : { background: "#111D2E", color: "#6BA3C0", border: "1px solid #162338" }
      }
      className="rounded-full px-3 py-1 text-xs font-medium transition-all hover:opacity-80"
    >
      {label} {count !== undefined ? `(${count})` : ""}
    </button>
  );
}

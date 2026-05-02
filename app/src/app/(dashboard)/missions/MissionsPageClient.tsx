"use client";

import { useState } from "react";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";
import MissionList from "@/modules/missions/components/MissionList";
import MissionsMap from "@/modules/missions/components/MissionsMap";
import { useTelemetry } from "@/modules/telemetry/hooks/useTelemetry";

type PilotWithUser = Pilot & { userName?: string };

export default function MissionsPageClient({
  missions,
  drones,
  pilots,
  users,
  canEdit = true,
}: {
  missions: Mission[];
  drones: Drone[];
  pilots: PilotWithUser[];
  users: Pick<User, "id" | "name" | "email">[];
  canEdit?: boolean;
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const telemetry = useTelemetry();

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--sky-border)" }}
      >
        <h1
          className="text-base font-semibold uppercase tracking-wide"
          style={{
            color: "var(--sky-text)",
            fontFamily: "var(--font-barlow-condensed), sans-serif",
            fontSize: "16px",
            letterSpacing: "0.08em",
          }}
        >
          Misi<span style={{ color: "#0C9FD8" }}>ones</span>
        </h1>
        {/* View toggle */}
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
        >
          <button
            onClick={() => setView("list")}
            className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: view === "list" ? "var(--sky-border-2)" : "transparent",
              color: view === "list" ? "var(--sky-text)" : "var(--sky-muted)",
            }}
          >
            Lista
          </button>
          <button
            onClick={() => setView("map")}
            className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: view === "map" ? "var(--sky-border-2)" : "transparent",
              color: view === "map" ? "var(--sky-text)" : "var(--sky-muted)",
            }}
          >
            Mapa
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "list" ? (
          <div className="h-full overflow-y-auto p-6">
            <MissionList
              missions={missions}
              drones={drones}
              pilots={pilots}
              users={users}
              canEdit={canEdit}
            />
          </div>
        ) : (
          <div className="h-full">
            <MissionsMap
              missions={missions}
              drones={drones}
              pilots={pilots}
              onSelectMission={setSelectedMission}
              selectedId={selectedMission?.id ?? null}
              telemetry={telemetry}
            />
          </div>
        )}
      </div>
    </div>
  );
}

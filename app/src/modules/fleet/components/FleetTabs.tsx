"use client";

import { useState } from "react";
import type { Drone, Pilot, User } from "@/lib/db/schema";
import DroneList from "./DroneList";
import PilotList from "./PilotList";

type PilotWithUser = Pilot & { userName?: string; userEmail?: string };

export default function FleetTabs({
  drones,
  pilots,
  users,
}: {
  drones: Drone[];
  pilots: PilotWithUser[];
  users: Pick<User, "id" | "name" | "email">[];
}) {
  const [tab, setTab] = useState<"drones" | "pilots">("drones");

  return (
    <div>
      <div style={{ borderBottom: "1px solid #162338" }} className="mb-6">
        <div className="-mb-px flex gap-6">
          <button
            onClick={() => setTab("drones")}
            style={
              tab === "drones"
                ? { borderBottom: "2px solid #0C9FD8", color: "#0C9FD8" }
                : { borderBottom: "2px solid transparent", color: "#4A7FA0" }
            }
            className="pb-3 text-sm font-medium transition-colors hover:opacity-80"
          >
            Drones ({drones.length})
          </button>
          <button
            onClick={() => setTab("pilots")}
            style={
              tab === "pilots"
                ? { borderBottom: "2px solid #0C9FD8", color: "#0C9FD8" }
                : { borderBottom: "2px solid transparent", color: "#4A7FA0" }
            }
            className="pb-3 text-sm font-medium transition-colors hover:opacity-80"
          >
            Pilotos ({pilots.length})
          </button>
        </div>
      </div>

      {tab === "drones" ? (
        <DroneList drones={drones} />
      ) : (
        <PilotList pilots={pilots} users={users} />
      )}
    </div>
  );
}

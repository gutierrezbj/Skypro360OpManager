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
      <div className="mb-6 border-b border-gray-200">
        <div className="-mb-px flex gap-6">
          <button
            onClick={() => setTab("drones")}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === "drones"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Drones ({drones.length})
          </button>
          <button
            onClick={() => setTab("pilots")}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === "pilots"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
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

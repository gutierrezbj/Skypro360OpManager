"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Mission } from "@/lib/db/schema";
import { STATUS_LABELS, STATUS_COLORS } from "../state-machine";

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

type Props = {
  missions: Mission[];
  onSelectMission?: (mission: Mission) => void;
};

export default function MissionsMap({ missions, onSelectMission }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-6.37, 39.15], // Extremadura center
      zoom: 7.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when missions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geoMissions = missions.filter(
      (m) => m.latitude && m.longitude,
    );

    for (const mission of geoMissions) {
      const lng = parseFloat(mission.longitude!);
      const lat = parseFloat(mission.latitude!);
      if (isNaN(lng) || isNaN(lat)) continue;

      const color = MARKER_COLORS[mission.status] ?? "#9ca3af";
      const isActive = mission.status === "in_flight";

      // Create marker element
      const el = document.createElement("div");
      el.className = "mission-marker";
      el.style.cssText = `
        width: ${isActive ? "18px" : "14px"};
        height: ${isActive ? "18px" : "14px"};
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        transition: transform 0.15s;
        ${isActive ? "animation: pulse 2s infinite;" : ""}
      `;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.4)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      // Popup
      const popup = new maplibregl.Popup({
        offset: 12,
        closeButton: false,
        maxWidth: "240px",
      }).setHTML(`
        <div style="font-family: system-ui, sans-serif; padding: 2px 0;">
          <div style="font-size: 10px; color: #6b7280; font-family: monospace;">${mission.code}</div>
          <div style="font-size: 13px; font-weight: 600; color: #111827; margin: 2px 0;">${mission.name}</div>
          <span style="
            display: inline-block;
            font-size: 11px;
            padding: 1px 8px;
            border-radius: 9999px;
            background: ${color}20;
            color: ${color};
            font-weight: 500;
          ">${STATUS_LABELS[mission.status] ?? mission.status}</span>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedId(mission.id);
        onSelectMission?.(mission);
      });

      markersRef.current.push(marker);
    }
  }, [missions, onSelectMission]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Pulse animation for active flights */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
      {/* Legend */}
      <div className="absolute bottom-6 left-3 rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(["in_flight", "preflight", "approved", "planned", "draft", "completed"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: MARKER_COLORS[s] }}
              />
              <span className="text-[10px] text-gray-600">{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

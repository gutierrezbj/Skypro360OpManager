"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Mission } from "@/lib/db/schema";
import { STATUS_LABELS } from "../state-machine";

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
  selectedId?: string | null;
};

export default function MissionsMap({ missions, onSelectMission, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const handleResize = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.resize();
    map.setCenter(center);
    map.setZoom(zoom);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-6.37, 39.15],
      zoom: 7.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    mapRef.current = map;

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [handleResize]);

  // Update markers when missions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geoMissions = missions.filter((m) => m.latitude && m.longitude);

    for (const mission of geoMissions) {
      const lng = parseFloat(mission.longitude!);
      const lat = parseFloat(mission.latitude!);
      if (isNaN(lng) || isNaN(lat)) continue;

      const color = MARKER_COLORS[mission.status] ?? "#9ca3af";
      const isActive = mission.status === "in_flight";
      const isSelected = mission.id === selectedId;
      const size = isSelected ? 22 : isActive ? 18 : 14;

      const el = document.createElement("div");
      el.title = `${mission.code} — ${mission.name} (${STATUS_LABELS[mission.status] ?? mission.status})`;
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${isSelected ? "3px" : "2px"} solid ${isSelected ? "#111827" : "white"};
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,${isSelected ? "0.5" : "0.3"});
        ${isActive ? "animation: pulse 2s infinite;" : ""}
      `;

      el.addEventListener("mouseenter", () => {
        el.style.boxShadow = `0 0 0 4px ${color}40, 0 1px 4px rgba(0,0,0,0.3)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.boxShadow = `0 1px 4px rgba(0,0,0,${isSelected ? "0.5" : "0.3"})`;
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectMission?.(mission);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [missions, onSelectMission, selectedId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
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

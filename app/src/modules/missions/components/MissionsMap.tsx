"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import { STATUS_LABELS, PRIORITY_LABELS } from "../state-machine";
import type { TelemetryPoint } from "@/modules/telemetry/hooks/useTelemetry";

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

const NOTAM_FILL = "rgba(56,189,248,0.18)";
const NOTAM_LINE = "#38bdf8";

type PilotWithUser = Pilot & { userName?: string };

type Props = {
  missions: Mission[];
  drones: Drone[];
  pilots: PilotWithUser[];
  onSelectMission?: (mission: Mission) => void;
  selectedId?: string | null;
  telemetry?: Map<string, TelemetryPoint>;
};

export default function MissionsMap({ missions, drones, pilots, onSelectMission, selectedId, telemetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // NOTAM state
  const [notamData, setNotamData] = useState<{ type: string; features: unknown[] } | null>(null);
  const [showNotams, setShowNotams] = useState(true);
  const [notamLoading, setNotamLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleResize = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.resize();
    map.setCenter(center);
    map.setZoom(zoom);
  }, []);

  // Fetch NOTAMs once on mount
  useEffect(() => {
    setNotamLoading(true);
    fetch("/api/airspace/notams")
      .then((r) => r.json())
      .then((d) => setNotamData(d))
      .catch((e) => console.error("[MissionsMap] NOTAM fetch failed:", e))
      .finally(() => setNotamLoading(false));
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

    map.on("load", () => {
      // Add empty NOTAM GeoJSON source + layers
      map.addSource("notams", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "notam-fill",
        type: "fill",
        source: "notams",
        paint: {
          "fill-color": NOTAM_FILL,
          "fill-opacity": 1,
        },
      });

      map.addLayer({
        id: "notam-line",
        type: "line",
        source: "notams",
        paint: {
          "line-color": NOTAM_LINE,
          "line-width": 1.5,
          "line-dasharray": [3, 2],
        },
      });

      // NOTAM click → popup
      map.on("click", "notam-fill", (e) => {
        if (!e.features?.length) return;
        const p = e.features[0].properties as Record<string, string>;
        const coords = e.lngLat;

        popupRef.current?.remove();
        const popup = new maplibregl.Popup({
          offset: [0, -4],
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
          className: "notam-popup",
        })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;min-width:210px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${NOTAM_LINE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style="font-size:10px;font-weight:700;color:${NOTAM_LINE};letter-spacing:0.05em;">NOTAM ACTIVO</span>
              </div>
              <div style="font-size:12px;font-weight:700;color:#111827;margin-bottom:4px;">${p.id ?? "—"}</div>
              ${p.name && p.name !== p.id ? `<div style="font-size:11px;color:#374151;margin-bottom:6px;">${p.name}</div>` : ""}
              <div style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#6b7280;border-top:1px solid #f3f4f6;padding-top:6px;margin-top:4px;">
                ${p.altitudeFloor || p.altitudeCeiling ? `
                <div style="display:flex;justify-content:space-between;">
                  <span>Altitud</span>
                  <span style="color:#374151;font-weight:500;">${p.altitudeFloor ?? "SFC"} → ${p.altitudeCeiling ?? "??"}</span>
                </div>` : ""}
                ${p.description ? `<div style="margin-top:4px;font-size:10px;color:#6b7280;line-height:1.4;max-height:60px;overflow:hidden;">${p.description.substring(0, 160)}${p.description.length > 160 ? "…" : ""}</div>` : ""}
              </div>
              <div style="margin-top:6px;font-size:9px;color:#9ca3af;">ENAIRE NOTAM_UAS_APP_V3</div>
            </div>
          `)
          .addTo(map);
        popupRef.current = popup;
      });

      map.on("mouseenter", "notam-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "notam-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      setMapLoaded(true);
    });

    mapRef.current = map;

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [handleResize]);

  // Update NOTAM source data when data arrives or toggle changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const source = map.getSource("notams") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const data =
      showNotams && notamData
        ? notamData
        : { type: "FeatureCollection", features: [] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source.setData(data as any);
  }, [notamData, showNotams, mapLoaded]);

  // Build popup HTML for a mission
  const buildPopupHTML = useCallback((mission: Mission) => {
    const color = MARKER_COLORS[mission.status] ?? "#9ca3af";
    const statusLabel = STATUS_LABELS[mission.status] ?? mission.status;
    const priorityLabel = PRIORITY_LABELS[mission.priority] ?? mission.priority;
    const drone = drones.find((d) => d.id === mission.droneId);
    const pilot = pilots.find((p) => p.id === mission.pilotId);

    return `<div style="font-family:system-ui,sans-serif;min-width:200px;max-width:260px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        <span style="font-size:11px;font-weight:600;color:#374151;">${mission.code}</span>
        <span style="font-size:10px;color:${color};font-weight:500;margin-left:auto;">${statusLabel}</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:#111827;margin-bottom:6px;">${mission.name}</div>
      <div style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#6b7280;">
        <div style="display:flex;justify-content:space-between;">
          <span>Prioridad</span>
          <span style="color:#374151;font-weight:500;">${priorityLabel}</span>
        </div>
        ${drone ? `<div style="display:flex;justify-content:space-between;">
          <span>Drone</span>
          <span style="color:#374151;font-weight:500;">${drone.model}</span>
        </div>` : ""}
        ${pilot ? `<div style="display:flex;justify-content:space-between;">
          <span>Piloto</span>
          <span style="color:#374151;font-weight:500;">${pilot.userName ?? "—"}</span>
        </div>` : ""}
        ${mission.scheduledStart ? `<div style="display:flex;justify-content:space-between;">
          <span>Programada</span>
          <span style="color:#374151;font-weight:500;">${new Date(mission.scheduledStart).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>` : ""}
      </div>
      <button data-mission-id="${mission.id}" style="
        margin-top:10px;width:100%;padding:6px 0;
        background:#3b82f6;color:white;border:none;border-radius:6px;
        font-size:11px;font-weight:600;cursor:pointer;
      ">Ver detalle completo</button>
    </div>`;
  }, [drones, pilots]);

  // Create/update markers when missions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const newIds = new Set(missions.filter((m) => m.latitude && m.longitude).map((m) => m.id));
    for (const [id, marker] of markerMapRef.current) {
      if (!newIds.has(id)) {
        marker.remove();
        markerMapRef.current.delete(id);
      }
    }
    popupRef.current?.remove();

    const geoMissions = missions.filter((m) => m.latitude && m.longitude);

    for (const mission of geoMissions) {
      const lng = parseFloat(mission.longitude!);
      const lat = parseFloat(mission.latitude!);
      if (isNaN(lng) || isNaN(lat)) continue;

      const color = MARKER_COLORS[mission.status] ?? "#9ca3af";
      const isActive = mission.status === "in_flight";
      const isSelected = mission.id === selectedId;

      const existing = markerMapRef.current.get(mission.id);
      if (existing) {
        const wrapper = existing.getElement();
        const card = wrapper.firstElementChild as HTMLElement | null;
        const pointer = wrapper.lastElementChild as HTMLElement | null;
        if (card) {
          card.style.background = isSelected ? "#1e3a5f" : "white";
          card.style.border = `1.5px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`;
          const codeEl = card.lastElementChild as HTMLElement | null;
          if (codeEl) codeEl.style.color = isSelected ? "white" : "#374151";
        }
        if (pointer) {
          pointer.style.borderTopColor = isSelected ? "#1e3a5f" : "white";
        }
        continue;
      }

      const el = document.createElement("div");
      el.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        background: ${isSelected ? "#1e3a5f" : "white"};
        border: 1.5px solid ${isSelected ? "#3b82f6" : "#e5e7eb"};
        border-radius: 8px;
        padding: 3px 8px 3px 4px;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        white-space: nowrap;
        transition: box-shadow 0.15s;
      `;

      const dot = document.createElement("span");
      dot.style.cssText = `
        width: 8px; height: 8px;
        border-radius: 50%;
        background: ${color};
        flex-shrink: 0;
        ${isActive ? "animation: marker-pulse 2s infinite;" : ""}
      `;
      el.appendChild(dot);

      const code = document.createElement("span");
      code.textContent = mission.code ?? "—";
      code.style.cssText = `
        font-size: 10px;
        font-weight: 600;
        font-family: ui-monospace, monospace;
        color: ${isSelected ? "white" : "#374151"};
        line-height: 1;
      `;
      el.appendChild(code);

      const pointer = document.createElement("div");
      pointer.style.cssText = `
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${isSelected ? "#1e3a5f" : "white"};
      `;

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:fit-content;";
      wrapper.appendChild(el);
      wrapper.appendChild(pointer);

      el.addEventListener("mouseenter", () => {
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.15)";
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        popupRef.current?.remove();

        const popup = new maplibregl.Popup({
          offset: [0, -10],
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
          className: "mission-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(buildPopupHTML(mission))
          .addTo(map);

        const popupEl = popup.getElement();
        popupEl?.addEventListener("click", (ev) => {
          const target = ev.target as HTMLElement;
          if (target.dataset.missionId) {
            popup.remove();
            onSelectMission?.(mission);
          }
        });

        popupRef.current = popup;
      });

      const marker = new maplibregl.Marker({ element: wrapper, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(map);

      markerMapRef.current.set(mission.id, marker);
    }
  }, [missions, onSelectMission, selectedId, buildPopupHTML]);

  // Live telemetry: update marker positions without re-rendering
  useEffect(() => {
    if (!telemetry || telemetry.size === 0) return;

    for (const [missionId, point] of telemetry) {
      const marker = markerMapRef.current.get(missionId);
      if (marker) {
        marker.setLngLat([point.lng, point.lat]);
      }
    }
  }, [telemetry]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <style>{`
        @keyframes marker-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .mission-popup .maplibregl-popup-content,
        .notam-popup .maplibregl-popup-content {
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
        }
        .notam-popup .maplibregl-popup-content {
          border-color: #38bdf8;
        }
        .mission-popup .maplibregl-popup-close-button,
        .notam-popup .maplibregl-popup-close-button {
          font-size: 16px;
          padding: 4px 8px;
          color: #9ca3af;
        }
        .mission-popup .maplibregl-popup-tip {
          border-top-color: white;
        }
        .notam-popup .maplibregl-popup-tip {
          border-top-color: #38bdf8;
        }
      `}</style>

      {/* Center button */}
      <button
        onClick={() => {
          mapRef.current?.flyTo({ center: [-6.37, 39.15], zoom: 7.5, duration: 800 });
        }}
        className="absolute top-3 left-3 rounded-lg bg-white/95 p-2 shadow-md backdrop-blur-sm hover:bg-gray-100 transition-colors"
        title="Centrar mapa"
      >
        <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      </button>

      {/* NOTAM toggle */}
      <button
        onClick={() => setShowNotams((v) => !v)}
        className={`absolute top-12 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-md backdrop-blur-sm transition-all ${
          showNotams
            ? "bg-sky-400/90 text-white hover:bg-sky-500/90"
            : "bg-white/95 text-gray-500 hover:bg-gray-100"
        }`}
        title={showNotams ? "Ocultar NOTAMs" : "Mostrar NOTAMs"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        NOTAM
        {notamLoading && (
          <span className="ml-0.5 inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
        )}
        {!notamLoading && notamData && (
          <span className={`rounded-full px-1 text-[9px] font-bold ${showNotams ? "bg-white/30" : "bg-gray-100 text-sky-500"}`}>
            {(notamData as { count?: number }).count ?? notamData.features.length}
          </span>
        )}
      </button>

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
          {showNotams && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: NOTAM_LINE, opacity: 0.8 }} />
              <span className="text-[10px] text-gray-600">NOTAM</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

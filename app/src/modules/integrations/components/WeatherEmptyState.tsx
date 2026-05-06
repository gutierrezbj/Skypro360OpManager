"use client";

import { MapPinIcon } from "@/lib/icons";

export default function WeatherEmptyState() {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: "var(--sky-surface-2)",
        border: "1px dashed var(--sky-border-2)",
      }}
    >
      <div className="mb-2 flex justify-center">
        <MapPinIcon className="h-5 w-5" style={{ color: "var(--sky-muted)" }} />
      </div>
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--sky-text)" }}>
        Selecciona una ubicación
      </p>
      <p className="text-[10px] leading-relaxed" style={{ color: "var(--sky-muted)" }}>
        Pulsa <strong>Mi ubicación</strong> o busca una ciudad para ver la meteorología.
      </p>
    </div>
  );
}

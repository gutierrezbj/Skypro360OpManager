"use client";

import { useEffect, useState } from "react";
import type { WeatherForecast } from "../services/aemet.service";

type Props = {
  lat: number;
  lng: number;
  date?: string;
};

const WIND_DIRS: Record<string, string> = {
  N: "Norte", NE: "Noreste", E: "Este", SE: "Sureste",
  S: "Sur", SW: "Suroeste", SO: "Suroeste", W: "Oeste", O: "Oeste", NW: "Noroeste", NO: "Noroeste",
  C: "Calma",
};

// UV index → label + color
function uvLabel(uv: number | null | undefined): { label: string; color: string } {
  if (uv == null) return { label: "—", color: "var(--sky-muted)" };
  if (uv < 3) return { label: "Bajo", color: "var(--sky-accent-green)" };
  if (uv < 6) return { label: "Moderado", color: "var(--sky-accent-yellow)" };
  if (uv < 8) return { label: "Alto", color: "var(--sky-accent-orange)" };
  if (uv < 11) return { label: "Muy alto", color: "var(--sky-accent-red)" };
  return { label: "Extremo", color: "var(--sky-accent-red)" };
}

// KP status → label + color (drone GPS reliability)
function kpLabel(status: string | null | undefined): { label: string; color: string } {
  if (!status) return { label: "—", color: "var(--sky-muted)" };
  if (status === "optimo") return { label: "GPS óptimo", color: "var(--sky-accent-green)" };
  if (status === "degradado") return { label: "GPS degradado", color: "var(--sky-accent-yellow)" };
  return { label: "GPS inestable", color: "var(--sky-accent-red)" };
}

export default function WeatherWidget({ lat, lng, date }: Props) {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setWeather(null);
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (date) params.set("date", date);

    fetch(`/api/weather?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: WeatherForecast) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [lat, lng, date]);

  if (loading) {
    return (
      <div className="rounded-xl p-3" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--sky-muted)" }}>
          <span
            className="inline-block h-3 w-3 rounded-full border-2"
            style={{ borderColor: "var(--sky-border-2)", borderTopColor: "#0C9FD8", animation: "sky-spin 0.8s linear infinite" }}
          />
          Cargando meteorología...
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-xl p-3" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
        <p className="text-xs" style={{ color: "var(--sky-muted)" }}>Meteo no disponible</p>
      </div>
    );
  }

  const uv = uvLabel(weather.uvIndex);
  const kp = kpLabel(weather.kpStatus);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--sky-border)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <WeatherIcon estado={weather.estadoCielo} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest truncate" style={{ color: "var(--sky-muted)" }}>
              Meteorología{weather.municipio ? ` · ${weather.municipio}` : ""}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--sky-text)" }}>
              {weather.estadoCieloDesc}
            </p>
          </div>
        </div>
        <FlightBadge apto={weather.aptoVuelo} />
      </div>

      {/* Primary metrics: Temp + Viento */}
      <div className="grid grid-cols-2 gap-px" style={{ background: "var(--sky-border)" }}>
        <BigMetric
          label="Temp"
          value={`${weather.temperatura.max}°`}
          sub={`mín ${weather.temperatura.min}°`}
        />
        <BigMetric
          label="Viento"
          value={`${weather.viento.velocidad} km/h`}
          sub={`${WIND_DIRS[weather.viento.direccion] ?? weather.viento.direccion}${weather.rafagas != null ? ` · ráf ${weather.rafagas}` : ""}`}
        />
      </div>

      {/* Secondary grid */}
      <div className="grid grid-cols-2 gap-px" style={{ background: "var(--sky-border)" }}>
        <SmallMetric label="Humedad" value={weather.humedad != null ? `${weather.humedad}%` : "—"} />
        <SmallMetric label="Precip." value={`${weather.precipitacion}%`} />
        <SmallMetric label="Visibilidad" value={weather.visibilidad != null ? `${weather.visibilidad} km` : "—"} />
        <SmallMetric label="Nubosidad" value={weather.nubosidad != null ? `${weather.nubosidad}%` : "—"} />
      </div>

      {/* Sun + UV + KP row */}
      <div className="grid grid-cols-2 gap-px" style={{ background: "var(--sky-border)" }}>
        <SmallMetric label="Amanecer" value={weather.amanecer ?? "—"} icon="🌅" />
        <SmallMetric label="Ocaso" value={weather.ocaso ?? "—"} icon="🌇" />
      </div>

      <div className="grid grid-cols-2 gap-px" style={{ background: "var(--sky-border)" }}>
        <ColoredMetric
          label="UV"
          value={weather.uvIndex != null ? String(weather.uvIndex) : "—"}
          tag={uv.label}
          color={uv.color}
        />
        <ColoredMetric
          label="KP"
          value={weather.kpIndex != null ? String(weather.kpIndex) : "—"}
          tag={kp.label}
          color={kp.color}
        />
      </div>

      {/* Warning */}
      {weather.razon && (
        <div
          className="px-3 py-2 text-[10px]"
          style={weather.aptoVuelo
            ? { background: "rgba(245,197,24,0.08)", color: "var(--sky-accent-yellow)", borderTop: "1px solid var(--sky-border)" }
            : { background: "rgba(229,62,62,0.08)", color: "var(--sky-accent-red)", borderTop: "1px solid var(--sky-border)" }
          }
        >
          ⚠ {weather.razon}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-3 py-1.5 text-[9px]"
        style={{ borderTop: "1px solid var(--sky-border)", color: "var(--sky-dim)" }}
      >
        {weather.source === "aemet" ? "AEMET OpenData" : "Estimación estacional"}
        {weather.kpIndex != null ? " · NOAA SWPC" : ""}
        {(weather.uvIndex != null || weather.visibilidad != null) ? " · Open-Meteo" : ""}
      </div>
    </div>
  );
}

function BigMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-3 py-2" style={{ background: "var(--sky-surface)" }}>
      <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: "var(--sky-text)", fontFamily: "var(--font-jetbrains), monospace" }}>{value}</p>
      {sub && <p className="text-[9px]" style={{ color: "var(--sky-muted)" }}>{sub}</p>}
    </div>
  );
}

function SmallMetric({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="px-3 py-1.5" style={{ background: "var(--sky-surface)" }}>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--sky-muted)" }}>
        {icon ? `${icon} ` : ""}{label}
      </p>
      <p className="text-[11px] font-semibold" style={{ color: "var(--sky-text)" }}>{value}</p>
    </div>
  );
}

function ColoredMetric({ label, value, tag, color }: { label: string; value: string; tag: string; color: string }) {
  return (
    <div className="px-3 py-1.5" style={{ background: "var(--sky-surface)" }}>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--sky-muted)" }}>{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-semibold" style={{ color, fontFamily: "var(--font-jetbrains), monospace" }}>{value}</span>
        <span className="text-[9px] font-medium" style={{ color }}>{tag}</span>
      </div>
    </div>
  );
}

function FlightBadge({ apto }: { apto: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
      style={apto
        ? { background: "rgba(0,217,126,0.12)", color: "var(--sky-accent-green)", border: "1px solid rgba(0,217,126,0.4)" }
        : { background: "rgba(229,62,62,0.12)", color: "var(--sky-accent-red)", border: "1px solid rgba(229,62,62,0.4)" }
      }
    >
      {apto ? "Apto vuelo" : "No apto"}
    </span>
  );
}

function WeatherIcon({ estado }: { estado: string }) {
  const isRain = estado.includes("lluvia") || ["23", "24", "25", "26", "43", "44", "45", "46"].includes(estado);
  const isCloudy = estado.includes("nuboso") || ["12", "13", "14", "15", "16"].includes(estado);

  if (isRain) {
    return (
      <svg className="h-6 w-6 flex-shrink-0" style={{ color: "#4A8FD4" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  if (isCloudy) {
    return (
      <svg className="h-6 w-6 flex-shrink-0" style={{ color: "var(--sky-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 flex-shrink-0" style={{ color: "var(--sky-accent-yellow)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

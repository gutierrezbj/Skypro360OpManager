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
  S: "Sur", SW: "Suroeste", W: "Oeste", NW: "Noroeste",
  C: "Calma",
};

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
          Cargando meteo...
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

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <WeatherIcon estado={weather.estadoCielo} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--sky-text)" }}>
              {weather.estadoCieloDesc}
            </p>
            {weather.municipio && (
              <p className="text-[10px]" style={{ color: "var(--sky-muted)" }}>{weather.municipio}</p>
            )}
          </div>
        </div>
        <FlightBadge apto={weather.aptoVuelo} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-1.5">
        <MetricBox label="Temp." value={`${weather.temperatura.min}°/${weather.temperatura.max}°`} />
        <MetricBox
          label="Viento"
          value={`${weather.viento.velocidad} km/h`}
          sub={WIND_DIRS[weather.viento.direccion] ?? weather.viento.direccion}
        />
        <MetricBox label="Precip." value={`${weather.precipitacion}%`} />
      </div>

      {/* Warning */}
      {weather.razon && (
        <div
          className="mt-2 rounded px-2 py-1 text-[10px]"
          style={weather.aptoVuelo
            ? { background: "rgba(245,197,24,0.08)", color: "#F5C518" }
            : { background: "rgba(229,62,62,0.08)", color: "#FC8181" }
          }
        >
          {weather.razon}
        </div>
      )}

      <p className="mt-2 text-[9px]" style={{ color: "var(--sky-dim)" }}>
        {weather.source === "aemet" ? "AEMET OpenData" : "Estimacion estacional"}
      </p>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-lg px-2 py-1.5 text-center"
      style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
    >
      <p className="text-[9px]" style={{ color: "var(--sky-muted)" }}>{label}</p>
      <p className="text-[11px] font-semibold" style={{ color: "var(--sky-text)" }}>{value}</p>
      {sub && <p className="text-[9px]" style={{ color: "var(--sky-muted)" }}>{sub}</p>}
    </div>
  );
}

function FlightBadge({ apto }: { apto: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={apto
        ? { background: "rgba(0,217,126,0.1)", color: "#00D97E", border: "1px solid rgba(0,217,126,0.3)" }
        : { background: "rgba(229,62,62,0.1)", color: "#FC8181", border: "1px solid rgba(229,62,62,0.3)" }
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
      <svg className="h-5 w-5" style={{ color: "#4A8FD4" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  if (isCloudy) {
    return (
      <svg className="h-5 w-5" style={{ color: "var(--sky-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" style={{ color: "#F5C518" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

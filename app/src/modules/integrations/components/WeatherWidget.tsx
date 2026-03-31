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
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          Cargando meteo...
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs text-gray-400">Meteo no disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WeatherIcon estado={weather.estadoCielo} />
          <div>
            <p className="text-xs font-semibold text-gray-700">
              {weather.estadoCieloDesc}
            </p>
            {weather.municipio && (
              <p className="text-[10px] text-gray-400">{weather.municipio}</p>
            )}
          </div>
        </div>
        <FlightBadge apto={weather.aptoVuelo} />
      </div>

      {/* Metrics */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <MetricBox
          label="Temperatura"
          value={`${weather.temperatura.min}° / ${weather.temperatura.max}°`}
        />
        <MetricBox
          label="Viento"
          value={`${weather.viento.velocidad} km/h`}
          sub={WIND_DIRS[weather.viento.direccion] ?? weather.viento.direccion}
        />
        <MetricBox
          label="Precipitacion"
          value={`${weather.precipitacion}%`}
        />
      </div>

      {/* Warning */}
      {weather.razon && (
        <div className={`mt-2 rounded px-2 py-1 text-[10px] ${
          weather.aptoVuelo
            ? "bg-amber-50 text-amber-700"
            : "bg-red-50 text-red-700"
        }`}>
          {weather.razon}
        </div>
      )}

      {/* Source */}
      <p className="mt-2 text-[9px] text-gray-300">
        Fuente: {weather.source === "aemet" ? "AEMET OpenData" : "Estimacion estacional"}
      </p>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded bg-gray-50 px-2 py-1.5 text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-700">{value}</p>
      {sub && <p className="text-[9px] text-gray-400">{sub}</p>}
    </div>
  );
}

function FlightBadge({ apto }: { apto: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        apto
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {apto ? "Apto vuelo" : "No apto"}
    </span>
  );
}

function WeatherIcon({ estado }: { estado: string }) {
  // Simple SVG icons based on AEMET sky state codes
  const isCloudy = estado.includes("nuboso") || ["12", "13", "14", "15", "16"].includes(estado);
  const isRain = estado.includes("lluvia") || ["23", "24", "25", "26", "43", "44", "45", "46"].includes(estado);

  if (isRain) {
    return (
      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  if (isCloudy) {
    return (
      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    );
  }
  // Clear / default
  return (
    <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

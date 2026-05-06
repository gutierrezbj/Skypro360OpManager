"use client";

import { useCallback, useEffect, useState } from "react";

export type WeatherLoc = { lat: number; lng: number; label: string };

const KEY = "sky-weather-recents";
const MAX = 5;

function readStorage(): WeatherLoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is WeatherLoc =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as WeatherLoc).lat === "number" &&
          typeof (x as WeatherLoc).lng === "number" &&
          typeof (x as WeatherLoc).label === "string",
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function writeStorage(list: WeatherLoc[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore (private browsing, full quota, etc.)
  }
}

/**
 * Persiste en localStorage las últimas ubicaciones consultadas (máx 5).
 * Dedupe por `label` (case-insensitive). Más reciente primero.
 *
 * No guarda "Mi ubicación" — es transitoria.
 */
export function useRecentWeatherLocations() {
  const [recents, setRecents] = useState<WeatherLoc[]>([]);

  // Hidratar desde localStorage en cliente
  useEffect(() => {
    setRecents(readStorage());
  }, []);

  const add = useCallback((loc: WeatherLoc) => {
    if (!loc.label || loc.label === "Mi ubicación") return;
    setRecents((prev) => {
      const lower = loc.label.toLowerCase();
      const filtered = prev.filter((r) => r.label.toLowerCase() !== lower);
      const next = [loc, ...filtered].slice(0, MAX);
      writeStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecents([]);
    writeStorage([]);
  }, []);

  return { recents, add, clear };
}

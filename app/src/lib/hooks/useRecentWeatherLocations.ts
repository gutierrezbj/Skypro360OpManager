"use client";

import { useCallback, useSyncExternalStore } from "react";

export type WeatherLoc = { lat: number; lng: number; label: string };

const KEY = "sky-weather-recents";
const MAX = 5;
const EMPTY: WeatherLoc[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedList: WeatherLoc[] = EMPTY;

function parseStorage(raw: string | null): WeatherLoc[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
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
    return EMPTY;
  }
}

function readStorage(): WeatherLoc[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseStorage(raw);
  }
  return cachedList;
}

function getServerSnapshot(): WeatherLoc[] {
  return EMPTY;
}

function writeStorage(list: WeatherLoc[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore (private browsing, full quota, etc.)
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Persiste en localStorage las últimas ubicaciones consultadas (máx 5).
 * Dedupe por `label` (case-insensitive). Más reciente primero.
 *
 * No guarda "Mi ubicación" — es transitoria.
 */
export function useRecentWeatherLocations() {
  const recents = useSyncExternalStore(subscribe, readStorage, getServerSnapshot);

  const add = useCallback((loc: WeatherLoc) => {
    if (!loc.label || loc.label === "Mi ubicación") return;
    const lower = loc.label.toLowerCase();
    const filtered = readStorage().filter((r) => r.label.toLowerCase() !== lower);
    writeStorage([loc, ...filtered].slice(0, MAX));
  }, []);

  const clear = useCallback(() => {
    writeStorage([]);
  }, []);

  return { recents, add, clear };
}

"use client";

import { useCallback, useState } from "react";

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

export type GeolocationCoords = { lat: number; lng: number };

/**
 * Wrapper de `navigator.geolocation.getCurrentPosition` con estado React.
 *
 * El permiso se pide solo cuando se llama a `request()`. El navegador maneja
 * la persistencia del permiso (no guardamos coordenadas en BD).
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      (err) => {
        setError(err.message);
        setStatus("denied");
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return { status, coords, error, request };
}

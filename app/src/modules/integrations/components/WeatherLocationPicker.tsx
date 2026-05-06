"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Mission } from "@/lib/db/schema";
import { LocateIcon, SearchIcon, MapPinIcon, CloseIcon } from "@/lib/icons";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import {
  useRecentWeatherLocations,
  type WeatherLoc,
} from "@/lib/hooks/useRecentWeatherLocations";
import type { GeocodeResult } from "../services/geocode.service";

type Props = {
  activeMissions: Mission[];
  selected: WeatherLoc | null;
  onSelect: (loc: WeatherLoc) => void;
};

export default function WeatherLocationPicker({
  activeMissions,
  selected,
  onSelect,
}: Props) {
  const { recents, add: addRecent } = useRecentWeatherLocations();
  const { status: geoStatus, coords: geoCoords, request: requestGeo } = useGeolocation();

  // Cuando geolocation responde, propagar al padre
  const lastGeoRef = useRef<string | null>(null);
  useEffect(() => {
    if (geoStatus === "granted" && geoCoords) {
      const key = `${geoCoords.lat},${geoCoords.lng}`;
      if (lastGeoRef.current !== key) {
        lastGeoRef.current = key;
        onSelect({ lat: geoCoords.lat, lng: geoCoords.lng, label: "Mi ubicación" });
      }
    }
  }, [geoStatus, geoCoords, onSelect]);

  // Misiones activas con coordenadas → atajos
  const missionShortcuts = useMemo<WeatherLoc[]>(
    () =>
      activeMissions
        .filter((m) => m.latitude && m.longitude)
        .map((m) => ({
          lat: parseFloat(m.latitude!),
          lng: parseFloat(m.longitude!),
          label: m.code,
        })),
    [activeMissions],
  );

  function handlePick(loc: WeatherLoc, isSearchResult: boolean) {
    onSelect(loc);
    if (isSearchResult) addRecent(loc);
  }

  return (
    <div
      className="rounded-xl p-2.5"
      style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
    >
      {/* Acciones: Mi ubicación + Buscador */}
      <div className="flex flex-col gap-2">
        <GeoButton
          status={geoStatus}
          isActive={selected?.label === "Mi ubicación"}
          onClick={requestGeo}
        />
        <SearchBox onPick={(loc) => handlePick(loc, true)} />
      </div>

      {/* Misiones activas */}
      {missionShortcuts.length > 0 && (
        <Section title="Misiones activas">
          <div className="flex flex-wrap gap-1">
            {missionShortcuts.map((m) => (
              <Pill
                key={m.label}
                opt={m}
                active={selected?.label === m.label}
                onClick={() => handlePick(m, false)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Recientes */}
      {recents.length > 0 && (
        <Section title="Recientes">
          <div className="flex flex-wrap gap-1">
            {recents.map((r) => (
              <Pill
                key={r.label}
                opt={r}
                active={selected?.label === r.label}
                onClick={() => handlePick(r, false)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-2 pt-2"
      style={{ borderTop: "1px solid var(--sky-border)" }}
    >
      <p
        className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--sky-dim)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Pill({
  opt,
  active,
  onClick,
}: {
  opt: WeatherLoc;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all"
      style={
        active
          ? {
              background: "rgba(12,159,216,0.15)",
              color: "var(--sky-accent-blue)",
              border: "1px solid rgba(12,159,216,0.4)",
            }
          : {
              background: "var(--sky-surface)",
              color: "var(--sky-muted)",
              border: "1px solid var(--sky-border)",
            }
      }
    >
      <MapPinIcon className="h-2.5 w-2.5 flex-shrink-0" />
      {opt.label}
    </button>
  );
}

function GeoButton({
  status,
  isActive,
  onClick,
}: {
  status: ReturnType<typeof useGeolocation>["status"];
  isActive: boolean;
  onClick: () => void;
}) {
  if (status === "unsupported") return null;

  const denied = status === "denied";
  const requesting = status === "requesting";
  const granted = status === "granted";

  let bg = "var(--sky-surface)";
  let color = "var(--sky-muted)";
  let border = "var(--sky-border)";
  let label = "Mi ubicación";

  if (denied) {
    bg = "rgba(229,62,62,0.08)";
    color = "var(--sky-accent-red)";
    border = "rgba(229,62,62,0.3)";
    label = "Permiso denegado";
  } else if (requesting) {
    label = "Buscando...";
  } else if (granted && isActive) {
    bg = "rgba(0,217,126,0.10)";
    color = "var(--sky-accent-green)";
    border = "rgba(0,217,126,0.4)";
  }

  return (
    <button
      onClick={onClick}
      disabled={denied || requesting}
      className="flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      <LocateIcon className="h-3 w-3 flex-shrink-0" />
      {label}
    </button>
  );
}

/**
 * Detecta input tipo "lat, lng" en varios formatos:
 *   "39.4699, -6.3722"   (coma)
 *   "39.4699; -6.3722"   (punto y coma)
 *   "39.4699 -6.3722"    (espacio)
 *
 * Auto-detecta el orden si está invertido (lng, lat — común en GeoJSON/KMZ):
 * si el primer valor cabe en rango lat (-90..90) y el segundo en rango
 * lng (-180..180), asume lat-lng. Si no, prueba el orden inverso.
 *
 * Devuelve null si ningún orden encaja en rangos terrestres válidos.
 * Mismo helper que dronehub (Airspace.jsx parseCoords).
 */
function parseCoordsInput(text: string): { lat: number; lng: number } | null {
  const match = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (isNaN(a) || isNaN(b)) return null;
  // Orden natural: lat, lng
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
  // Orden invertido (KMZ/GeoJSON): lng, lat
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return { lat: b, lng: a };
  return null;
}

function SearchBox({ onPick }: { onPick: (loc: WeatherLoc) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Si el input es un par de coordenadas, no llamamos a /api/geocode
  const coordCandidate = useMemo(() => parseCoordsInput(q), [q]);

  // Debounced search
  useEffect(() => {
    if (coordCandidate) {
      setResults([]);
      setLoading(false);
      setOpen(true);
      return;
    }
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = (await res.json()) as { results: GeocodeResult[] };
          setResults(data.results ?? []);
          setOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, coordCandidate]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(r: GeocodeResult) {
    const label = formatLabel(r);
    onPick({ lat: r.lat, lng: r.lng, label });
    setQ("");
    setResults([]);
    setOpen(false);
  }

  function handleSelectCoords(coords: { lat: number; lng: number }) {
    const label = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    onPick({ lat: coords.lat, lng: coords.lng, label });
    setQ("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <SearchIcon
          className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3"
          style={{ color: "var(--sky-muted)" }}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ciudad o coordenadas (lat, lng)..."
          className="w-full rounded-md pl-7 pr-7 py-1.5 text-[11px] outline-none"
          style={{
            background: "var(--sky-surface)",
            color: "var(--sky-text)",
            border: "1px solid var(--sky-border)",
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); setResults([]); setOpen(false); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1"
            style={{ color: "var(--sky-muted)" }}
            aria-label="Limpiar"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (coordCandidate || results.length > 0 || loading) && (
        <div
          className="absolute z-20 mt-1 w-full rounded-md overflow-hidden shadow-lg"
          style={{
            background: "var(--sky-surface)",
            border: "1px solid var(--sky-border-2)",
          }}
        >
          {coordCandidate ? (
            <button
              type="button"
              onClick={() => handleSelectCoords(coordCandidate)}
              className="block w-full text-left px-3 py-2 text-[11px] transition-colors"
              style={{ color: "var(--sky-text)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(12,159,216,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span className="font-semibold" style={{ color: "var(--sky-accent-blue)" }}>
                Usar coordenadas
              </span>
              <span className="ml-1.5 text-[10px]" style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}>
                {coordCandidate.lat.toFixed(4)}, {coordCandidate.lng.toFixed(4)}
              </span>
            </button>
          ) : loading && results.length === 0 ? (
            <div className="px-3 py-2 text-[10px]" style={{ color: "var(--sky-muted)" }}>
              Buscando...
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.name}-${r.lat}-${r.lng}-${i}`}
                type="button"
                onClick={() => handleSelect(r)}
                className="block w-full text-left px-3 py-2 text-[11px] transition-colors"
                style={{
                  color: "var(--sky-text)",
                  borderBottom: i < results.length - 1 ? "1px solid var(--sky-border)" : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(12,159,216,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="font-semibold">{r.name}</span>
                {(r.admin1 || r.admin2 || r.country) && (
                  <span className="ml-1.5 text-[9px]" style={{ color: "var(--sky-muted)" }}>
                    {[r.admin2, r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatLabel(r: GeocodeResult): string {
  // "Trujillo" si es único, "Trujillo (Cáceres)" si hay desambiguación útil
  if (r.admin2 && r.admin2 !== r.name) return `${r.name} (${r.admin2})`;
  if (r.admin1 && r.admin1 !== r.name) return `${r.name} (${r.admin1})`;
  return r.name;
}

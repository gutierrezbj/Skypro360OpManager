import Link from "next/link";
import { BODY_SHORT, URGENCY_META, fmtLimite, type CoordinationBody, type UrgencyLevel } from "../logic";
import { BODY_ICONS } from "./bodyIcons";

export type CoordinationAlert = {
  missionId: string;
  code: string;
  name: string;
  organismo: CoordinationBody;
  limite: string;
  urgencia: UrgencyLevel;
  diasRestantes: number;
};

export default function PendingCoordinationsWidget({ alerts }: { alerts: CoordinationAlert[] }) {
  if (alerts.length === 0) return null;
  const worst = alerts.some((a) => a.urgencia === "superado" || a.urgencia === "urgente") ? "urgente" : "proximo";
  const hm = URGENCY_META[worst];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${hm.border}`, background: "var(--sky-surface)" }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: hm.bg, borderBottom: "1px solid var(--sky-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: hm.color }}>
          Pendientes de coordinar
        </p>
        <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: hm.color, color: "#fff" }}>
          {alerts.length}
        </span>
      </div>
      <ul className="divide-y" style={{ borderColor: "var(--sky-border)" }}>
        {alerts.map((a) => {
          const um = URGENCY_META[a.urgencia];
          return (
            <li key={`${a.missionId}-${a.organismo}`} style={{ borderColor: "var(--sky-border)" }}>
              <Link
                href={`/missions/${a.missionId}/compliance`}
                className="block px-3 py-2 transition-colors hover:bg-[var(--sky-surface-2)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--sky-accent-blue)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                    {a.code}
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: um.bg, color: um.color, border: `1px solid ${um.border}` }}>
                    {a.diasRestantes < 0 ? `Superado · hace ${-a.diasRestantes} d` : a.diasRestantes === 0 ? "Vence hoy" : `Vence en ${a.diasRestantes} d`}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: "var(--sky-text)" }}>{a.name}</p>
                <p className="flex items-center gap-1 text-[11px]" style={{ color: "var(--sky-muted)" }}>
                  {(() => { const Icon = BODY_ICONS[a.organismo]; return <Icon className="h-3 w-3" style={{ color: um.color }} />; })()}
                  {BODY_SHORT[a.organismo]} · límite {fmtLimite(new Date(a.limite))}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/coordinaciones"
        className="block px-3 py-2 text-center text-[11px] font-semibold hover:opacity-80"
        style={{ color: "var(--sky-accent-blue)", borderTop: "1px solid var(--sky-border)" }}
      >
        Abrir centro de coordinación →
      </Link>
    </div>
  );
}

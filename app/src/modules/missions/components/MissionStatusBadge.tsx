import { STATUS_LABELS } from "../state-machine";

/**
 * Status badge con contraste suficiente en modo claro y oscuro.
 * Usa CSS vars `--sky-accent-*` que adaptan el brand color (oscurecido en claro).
 */
const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  draft:      { color: "var(--sky-muted)",          bg: "var(--sky-surface-2)",       border: "var(--sky-border-2)" },
  planned:    { color: "var(--sky-accent-blue)",    bg: "rgba(12,159,216,0.10)",       border: "rgba(12,159,216,0.35)" },
  approved:   { color: "var(--sky-accent-blue)",    bg: "rgba(12,159,216,0.16)",       border: "rgba(12,159,216,0.50)" },
  preflight:  { color: "var(--sky-accent-yellow)",  bg: "rgba(245,197,24,0.14)",       border: "rgba(245,197,24,0.45)" },
  in_flight:  { color: "var(--sky-accent-green)",   bg: "rgba(0,217,126,0.14)",        border: "rgba(0,217,126,0.45)" },
  completed:  { color: "var(--sky-accent-green)",   bg: "rgba(0,217,126,0.10)",        border: "rgba(0,217,126,0.30)" },
  aborted:    { color: "var(--sky-accent-red)",     bg: "rgba(229,62,62,0.12)",        border: "rgba(229,62,62,0.40)" },
  cancelled:  { color: "var(--sky-muted)",          bg: "var(--sky-surface-2)",       border: "var(--sky-border-2)" },
};

export default function MissionStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className="inline-block rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  );
}

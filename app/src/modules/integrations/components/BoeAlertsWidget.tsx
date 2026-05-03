"use client";

import { useEffect, useState } from "react";
import type { BoeSearchResult, BoeDocument } from "../services/boe.service";
import { RefreshIcon, ExternalLinkIcon } from "@/lib/icons";

const RELEVANCE_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high:   { label: "Relevante",  color: "var(--sky-accent-orange)", bg: "rgba(240,78,28,0.08)",   border: "rgba(240,78,28,0.3)"   },
  medium: { label: "Relacionado", color: "var(--sky-accent-yellow)", bg: "rgba(245,197,24,0.08)",  border: "rgba(245,197,24,0.3)"  },
  low:    { label: "General",    color: "var(--sky-muted)", bg: "transparent",    border: "var(--sky-border)"     },
};

export default function BoeAlertsWidget() {
  const [data, setData] = useState<BoeSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/aesa/boe-search?type=news&rows=6");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: BoeSearchResult = await r.json();
      setData(d);
      setLastFetch(new Date());
    } catch {
      // keep previous data if any
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const hasItems = (data?.documents?.length ?? 0) > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--sky-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: "var(--sky-surface-2)", borderBottom: "1px solid var(--sky-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{ background: "#F04E1C", boxShadow: "0 0 5px #F04E1C" }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sky-muted)" }}
          >
            Alertas AESA · BOE
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Actualizar"
          className="rounded p-1 transition-colors"
          style={{ color: "var(--sky-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0C9FD8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
        >
          <RefreshIcon
            className="h-3 w-3"
            style={{ animation: loading ? "sky-spin 0.8s linear infinite" : "none" }}
          />
        </button>
      </div>

      {/* Body */}
      {loading && !hasItems ? (
        <div
          className="px-3 py-4 text-center text-xs"
          style={{ background: "var(--sky-surface)", color: "var(--sky-muted)" }}
        >
          <span
            className="inline-block h-3 w-3 rounded-full border-2 mr-2"
            style={{ borderColor: "var(--sky-border-2)", borderTopColor: "#0C9FD8", animation: "sky-spin 0.8s linear infinite" }}
          />
          Consultando BOE...
        </div>
      ) : !hasItems ? (
        <div
          className="px-3 py-4 text-center text-xs"
          style={{ background: "var(--sky-surface)", color: "var(--sky-muted)" }}
        >
          Sin publicaciones recientes
        </div>
      ) : (
        <div style={{ background: "var(--sky-surface)" }}>
          {data!.documents.map((doc, i) => (
            <BoeItem
              key={doc.id}
              doc={doc}
              isLast={i === data!.documents.length - 1}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {lastFetch && (
        <div
          className="px-3 py-1.5 text-[9px] flex items-center justify-between"
          style={{ background: "var(--sky-surface-2)", borderTop: "1px solid var(--sky-border)", color: "var(--sky-dim)" }}
        >
          <span>
            {data?.source === "cache" ? "Cache 24h" : "BOE OpenData"}
          </span>
          <span>
            {lastFetch.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
    </div>
  );
}

function BoeItem({ doc, isLast }: { doc: BoeDocument; isLast: boolean }) {
  const style = RELEVANCE_STYLE[doc.relevance] ?? RELEVANCE_STYLE.low;

  return (
    <div
      className="px-3 py-2.5"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--sky-border)" }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-medium leading-snug line-clamp-2 mb-1"
            style={{ color: "var(--sky-text)" }}
          >
            {doc.title}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-[9px]"
              style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}
            >
              {new Date(doc.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
            >
              {style.label}
            </span>
          </div>
          {doc.matchReason && (
            <p className="text-[9px] mt-0.5 line-clamp-1" style={{ color: "var(--sky-dim)" }}>
              {doc.matchReason}
            </p>
          )}
        </div>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver en BOE"
          className="flex-shrink-0 rounded p-1 transition-colors mt-0.5"
          style={{ color: "var(--sky-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0C9FD8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
        >
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

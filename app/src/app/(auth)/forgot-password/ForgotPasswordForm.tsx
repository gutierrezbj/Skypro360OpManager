"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ForgotPasswordResult } from "./actions";

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<ForgotPasswordResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <div
          className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
          style={{
            background: "rgba(0,217,126,0.08)",
            border: "1px solid rgba(0,217,126,0.3)",
            color: "#00D97E",
          }}
        >
          {state.message}
        </div>
      )}

      {state && !state.success && (
        <div
          className="rounded-lg px-3 py-2.5 text-xs"
          style={{
            background: "rgba(229,62,62,0.1)",
            border: "1px solid rgba(229,62,62,0.3)",
            color: "#FC8181",
          }}
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--sky-muted)" }}
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="tu@skypro360.es"
          className="block w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{
            background: "var(--sky-bg)",
            border: "1px solid var(--sky-border)",
            color: "var(--sky-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid #0C9FD8";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,159,216,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid var(--sky-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state?.success}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
        style={{
          background: isPending ? "rgba(12,159,216,0.6)" : "#0C9FD8",
          color: "#080D14",
          fontFamily: "var(--font-barlow-condensed), sans-serif",
          fontSize: "14px",
          letterSpacing: "0.08em",
          boxShadow: isPending || state?.success ? "none" : "0 0 24px rgba(12,159,216,0.3)",
        }}
      >
        {isPending ? (
          <>
            <span
              className="inline-block h-4 w-4 rounded-full border-2"
              style={{
                borderColor: "rgba(8,13,20,0.3)",
                borderTopColor: "#080D14",
                animation: "sky-spin 0.7s linear infinite",
              }}
            />
            Enviando...
          </>
        ) : (
          "ENVIAR ENLACE"
        )}
      </button>

      <Link
        href="/login"
        className="block text-center text-xs"
        style={{ color: "var(--sky-muted)" }}
      >
        ← Volver al login
      </Link>
    </form>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordResult } from "./actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ResetPasswordResult | null, FormData>(
    resetPasswordAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => router.push("/login"), 2200);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const fieldError = (field: string): string | undefined => {
    if (state && !state.success) return state.fieldErrors?.[field]?.[0];
    return undefined;
  };

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-lg px-3 py-3 text-xs leading-relaxed text-center"
          style={{
            background: "rgba(0,217,126,0.08)",
            border: "1px solid rgba(0,217,126,0.3)",
            color: "#00D97E",
          }}
        >
          Contraseña actualizada correctamente.<br />
          <span style={{ color: "var(--sky-muted)" }}>Redirigiendo al login...</span>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state && !state.success && state.error && !state.fieldErrors && (
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

      <Field
        id="newPassword"
        label="Contraseña nueva"
        type="password"
        hint="Mínimo 8 caracteres. Elige algo que recuerdes."
        error={fieldError("newPassword")}
      />
      <Field
        id="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        error={fieldError("confirmPassword")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
        style={{
          background: isPending ? "rgba(12,159,216,0.6)" : "#0C9FD8",
          color: "#080D14",
          fontFamily: "var(--font-barlow-condensed), sans-serif",
          fontSize: "14px",
          letterSpacing: "0.08em",
          boxShadow: isPending ? "none" : "0 0 24px rgba(12,159,216,0.3)",
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
            Guardando...
          </>
        ) : (
          "GUARDAR CONTRASEÑA"
        )}
      </button>

      <Link href="/login" className="block text-center text-xs" style={{ color: "var(--sky-muted)" }}>
        ← Volver al login
      </Link>
    </form>
  );
}

function Field({
  id, label, type, hint, error,
}: { id: string; label: string; type: string; hint?: string; error?: string }) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--sky-muted)" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        className="block w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{
          background: "var(--sky-bg)",
          border: error ? "1px solid rgba(229,62,62,0.5)" : "1px solid var(--sky-border)",
          color: "var(--sky-text)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid #0C9FD8";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,159,216,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? "1px solid rgba(229,62,62,0.5)" : "1px solid var(--sky-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {error ? (
        <p className="text-[10px]" style={{ color: "#FC8181" }}>{error}</p>
      ) : hint ? (
        <p className="text-[10px]" style={{ color: "var(--sky-dim)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

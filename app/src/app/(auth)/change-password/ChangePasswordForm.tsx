"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { changePasswordAction, type ChangePasswordResult } from "./actions";

const inputStyle = {
  background: "var(--sky-bg)",
  border: "1px solid var(--sky-border)",
  color: "var(--sky-text)",
  fontFamily: "var(--font-barlow), sans-serif",
} as const;

const labelStyle = {
  color: "var(--sky-muted)",
} as const;

export default function ChangePasswordForm({ allowSkip }: { allowSkip: boolean }) {
  const router = useRouter();
  const { update } = useSession();
  const [state, formAction, isPending] = useActionState<ChangePasswordResult | null, FormData>(
    changePasswordAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      // Refrescar el JWT en cliente y mandar al cockpit
      update({ mustChangePassword: false }).then(() => {
        router.push("/");
        router.refresh();
      });
    }
  }, [state, router, update]);

  const fieldError = (field: string): string | undefined => {
    if (state && !state.success) return state.fieldErrors?.[field]?.[0];
    return undefined;
  };

  // Mostrar banner siempre que haya error (aunque también haya errores por campo)
  const errorBanner = state && !state.success
    ? state.fieldErrors
      ? "Revisa los campos marcados en rojo abajo"
      : state.error
    : null;

  return (
    <form action={formAction} className="space-y-4">
      {errorBanner && (
        <div
          className="rounded-lg px-3 py-2.5 text-xs font-semibold"
          style={{
            background: "rgba(229,62,62,0.12)",
            border: "1px solid rgba(229,62,62,0.4)",
            color: "var(--sky-accent-red)",
          }}
        >
          {errorBanner}
        </div>
      )}

      <Field
        id="currentPassword"
        label="Contraseña actual"
        type="password"
        hint="La que te dieron (pilot12345 si es tu primer login)"
        error={fieldError("currentPassword")}
      />
      <Field
        id="newPassword"
        label="Contraseña nueva"
        type="password"
        hint="Mínimo 8 caracteres. Elige algo que recuerdes."
        error={fieldError("newPassword")}
      />
      <Field
        id="confirmPassword"
        label="Confirmar contraseña nueva"
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
          "GUARDAR Y CONTINUAR"
        )}
      </button>

      {allowSkip && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="block w-full text-center text-xs"
          style={{ color: "var(--sky-muted)" }}
        >
          Cancelar
        </button>
      )}
    </form>
  );

  function Field({
    id, label, type, hint, error,
  }: { id: string; label: string; type: string; hint?: string; error?: string }) {
    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="block text-[10px] font-semibold uppercase tracking-widest"
          style={labelStyle}
        >
          {label}
        </label>
        <input
          id={id}
          name={id}
          type={type}
          required
          className="block w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ ...inputStyle, ...(error ? { border: "1px solid rgba(229,62,62,0.5)" } : {}) }}
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
}

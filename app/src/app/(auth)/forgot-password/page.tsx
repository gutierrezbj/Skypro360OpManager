import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: "var(--sky-bg)",
        backgroundImage: `
          repeating-linear-gradient(0deg,rgba(12,159,216,0.03) 0px,rgba(12,159,216,0.03) 1px,transparent 1px,transparent 48px),
          repeating-linear-gradient(90deg,rgba(12,159,216,0.03) 0px,rgba(12,159,216,0.03) 1px,transparent 1px,transparent 48px)
        `,
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--sky-surface)",
          border: "1px solid var(--sky-border-2)",
          boxShadow: "0 0 0 1px rgba(12,159,216,0.06), 0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="flex flex-col items-center gap-2 px-8 pt-8 pb-5 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(12,159,216,0.06) 0%, transparent 100%)",
            borderBottom: "1px solid var(--sky-border)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-skypro360.png" alt="Skypro360" className="h-16 w-auto mb-1" />
          <div
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--sky-muted)" }}
          >
            Recuperar acceso
          </div>
        </div>

        <div className="px-8 py-6">
          <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--sky-muted)" }}>
            Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

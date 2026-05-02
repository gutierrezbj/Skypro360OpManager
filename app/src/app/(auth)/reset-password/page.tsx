import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

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
            Nueva contraseña
          </div>
        </div>

        <div className="px-8 py-6">
          {!token ? (
            <div className="space-y-4">
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{
                  background: "rgba(229,62,62,0.1)",
                  border: "1px solid rgba(229,62,62,0.3)",
                  color: "#FC8181",
                }}
              >
                Falta el token. Vuelve a solicitar el enlace de restablecimiento.
              </div>
              <Link
                href="/forgot-password"
                className="block text-center text-xs"
                style={{ color: "#0C9FD8" }}
              >
                Solicitar enlace nuevo →
              </Link>
            </div>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </div>
      </div>
    </div>
  );
}

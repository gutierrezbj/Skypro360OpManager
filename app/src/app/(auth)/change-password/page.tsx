import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isFirstLogin = !!(session.user as { mustChangePassword?: boolean }).mustChangePassword;
  const userName = session.user.name ?? "";
  const userEmail = session.user.email ?? "";

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
            {isFirstLogin ? "Configura tu acceso" : "Cambiar contraseña"}
          </div>
        </div>

        <div className="px-8 py-6">
          {isFirstLogin && (
            <div
              className="mb-4 rounded-lg px-3 py-2.5 text-xs"
              style={{
                background: "rgba(245,197,24,0.08)",
                border: "1px solid rgba(245,197,24,0.25)",
                color: "#F5C518",
              }}
            >
              Es tu primer inicio de sesión. Por seguridad, debes cambiar la contraseña antes de continuar.
            </div>
          )}

          <p className="mb-4 text-xs" style={{ color: "var(--sky-muted)" }}>
            Conectado como <span style={{ color: "var(--sky-text)", fontWeight: 600 }}>{userName}</span> ({userEmail})
          </p>

          <ChangePasswordForm allowSkip={!isFirstLogin} />
        </div>
      </div>
    </div>
  );
}

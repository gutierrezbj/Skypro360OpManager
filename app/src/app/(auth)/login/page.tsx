"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Admin",       email: "admin@skypro360.es",        password: "admin12345", role: "admin" },
  { label: "Coordinador", email: "coordinador@skypro360.es",  password: "coord12345", role: "coordinator" },
  { label: "Piloto 1",    email: "luis@skypro360.es",         password: "pilot12345", role: "pilot" },
  { label: "Piloto 2",    email: "ferenz@skypro360.es",       password: "pilot12345", role: "pilot" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function doLogin(loginEmail: string, loginPassword: string) {
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales incorrectas");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(email, password);
  }

  function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    doLogin(account.email, account.password);
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: "#080D14",
        backgroundImage: `
          repeating-linear-gradient(0deg,rgba(12,159,216,0.03) 0px,rgba(12,159,216,0.03) 1px,transparent 1px,transparent 48px),
          repeating-linear-gradient(90deg,rgba(12,159,216,0.03) 0px,rgba(12,159,216,0.03) 1px,transparent 1px,transparent 48px)
        `,
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#0D1520",
          border: "1px solid #1E3A5F",
          boxShadow: "0 0 0 1px rgba(12,159,216,0.06), 0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center gap-2 px-8 pt-10 pb-6 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(12,159,216,0.06) 0%, transparent 100%)",
            borderBottom: "1px solid #162338",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-skypro360.png" alt="Skypro360" className="h-24 w-auto mb-1" />
          <div
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "#4A7FA0" }}
          >
            Operations Console
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(229,62,62,0.1)",
                  border: "1px solid rgba(229,62,62,0.3)",
                  color: "#FC8181",
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#4A7FA0" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="piloto@skypro360.es"
                className="block w-full rounded-lg px-3 py-2.5 text-sm transition-all outline-none"
                style={{
                  background: "#080D14",
                  border: "1px solid #162338",
                  color: "#D6E8F5",
                  fontFamily: "var(--font-barlow), sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #0C9FD8";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,159,216,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #162338";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#4A7FA0" }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="block w-full rounded-lg px-3 py-2.5 text-sm transition-all outline-none"
                style={{
                  background: "#080D14",
                  border: "1px solid #162338",
                  color: "#D6E8F5",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #0C9FD8";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,159,216,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #162338";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{
                background: loading ? "rgba(12,159,216,0.6)" : "#0C9FD8",
                color: "#080D14",
                fontFamily: "var(--font-barlow-condensed), sans-serif",
                fontSize: "14px",
                letterSpacing: "0.08em",
                boxShadow: loading ? "none" : "0 0 24px rgba(12,159,216,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "#0FB8F0";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(12,159,216,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = "#0C9FD8";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(12,159,216,0.3)";
                }
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2"
                    style={{
                      borderColor: "rgba(8,13,20,0.3)",
                      borderTopColor: "#080D14",
                      animation: "sky-spin 0.7s linear infinite",
                    }}
                  />
                  Autenticando...
                </>
              ) : (
                "ACCEDER"
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6" style={{ borderTop: "1px solid #162338", paddingTop: "20px" }}>
            <p
              className="mb-3 text-center text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: "#243A52" }}
            >
              Acceso rápido demo
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className="rounded-md px-3 py-1 text-[11px] font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "rgba(12,159,216,0.06)",
                    border: "1px solid rgba(12,159,216,0.2)",
                    color: "#4A7FA0",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#0C9FD8";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,159,216,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#4A7FA0";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,159,216,0.2)";
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-3 text-center"
          style={{ borderTop: "1px solid #162338" }}
        >
          <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "#1E3A5F" }}>
            Skypro360 &times; SRS
          </p>
        </div>
      </div>
    </div>
  );
}

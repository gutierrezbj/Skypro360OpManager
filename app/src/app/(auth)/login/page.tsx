"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@skypro360.es", password: "admin12345", role: "admin" },
  { label: "Coordinador", email: "coordinador@skypro360.es", password: "coord12345", role: "coordinator" },
  { label: "Piloto 1", email: "luis@skypro360.es", password: "pilot12345", role: "pilot" },
  { label: "Piloto 2", email: "ferenz@skypro360.es", password: "pilot12345", role: "pilot" },
] as const;

const ROLE_COLORS_LIGHT: Record<string, string> = {
  admin: "border-blue-300 text-blue-700 hover:bg-blue-50",
  coordinator: "border-indigo-300 text-indigo-700 hover:bg-indigo-50",
  pilot: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
};

const ROLE_COLORS_DARK: Record<string, string> = {
  admin: "border-blue-500/40 text-blue-300 hover:bg-blue-900/30",
  coordinator: "border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/30",
  pilot: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("opsmanager-theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("opsmanager-theme", next ? "dark" : "light");
  }

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

  const roleColors = dark ? ROLE_COLORS_DARK : ROLE_COLORS_LIGHT;

  return (
    <div className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className={`relative w-full max-w-sm rounded-2xl p-8 shadow-lg transition-colors duration-300 ${dark ? "bg-gray-900 shadow-black/40" : "bg-white shadow-gray-200/60"}`}>
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute right-4 top-4 rounded-lg border p-2 transition-colors ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo-skypro360.png" alt="Skypro360" className="h-36 w-auto" />
          <p className={`text-xs font-medium uppercase tracking-widest transition-colors ${dark ? "text-gray-500" : "text-gray-400"}`}>
            Operations Console
          </p>
        </div>

        {/* Separator */}
        <hr className={`my-6 ${dark ? "border-gray-800" : "border-gray-100"}`} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`rounded-md p-3 text-sm ${dark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"}`}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${dark ? "border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white"}`}
              placeholder="piloto@skypro360.es"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${dark ? "border-gray-700 bg-gray-800 text-gray-100 focus:border-blue-500 focus:bg-gray-800" : "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white"}`}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className={`mt-6 border-t pt-4 ${dark ? "border-gray-800" : "border-gray-100"}`}>
          <p className={`mb-3 text-center text-[10px] font-semibold uppercase tracking-widest ${dark ? "text-gray-600" : "text-gray-400"}`}>
            Cuentas demo
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account)}
                disabled={loading}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${roleColors[account.role] ?? ""}`}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className={`mt-4 text-center text-[10px] ${dark ? "text-gray-700" : "text-gray-300"}`}>
          Skypro 360 + SRS
        </p>
      </div>
    </div>
  );
}

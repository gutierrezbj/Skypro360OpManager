"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@skypro360.es", password: "admin12345", role: "admin" },
  { label: "Coordinador", email: "coordinador@skypro360.es", password: "coord12345", role: "coordinator" },
  { label: "Piloto 1", email: "luis@skypro360.es", password: "pilot12345", role: "pilot" },
  { label: "Piloto 2", email: "ferenz@skypro360.es", password: "pilot12345", role: "pilot" },
] as const;

const ROLE_COLORS: Record<string, string> = {
  admin: "border-blue-300 text-blue-700 hover:bg-blue-50",
  coordinator: "border-indigo-300 text-indigo-700 hover:bg-indigo-50",
  pilot: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo-skypro360.png" alt="Skypro360" className="h-20 w-20 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpsManager</h1>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
              Operations Console
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="piloto@skypro360.es"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Cuentas demo
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account)}
                disabled={loading}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${ROLE_COLORS[account.role] ?? ""}`}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-gray-300">
          Skypro 360 + SRS
        </p>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Dashboard layout — requiere autenticacion.
 * Sidebar + header + content area.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
            <img src="/logo-skypro360.png" alt="Skypro360" className="h-9 w-9 rounded" />
            <span className="text-lg font-bold text-gray-900">OpsManager</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/" label="Mapa" />
            <NavLink href="/missions" label="Misiones" />
            <NavLink href="/fleet" label="Flota" />
            <NavLink href="/compliance" label="Compliance" />
          </nav>
          <div className="border-t border-gray-200 p-4">
            <p className="text-sm text-gray-500">{session.user.name}</p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    >
      {label}
    </a>
  );
}

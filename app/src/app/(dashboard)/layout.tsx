import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

/**
 * Dashboard layout — requiere autenticacion.
 * Sidebar + content area.
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
      <Sidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={(session.user as { role?: string }).role}
      />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Forzar cambio de password en primer login
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sky-bg">
      <Sidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={(session.user as { role?: string }).role}
      />
      <main className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--sky-bg)" }}>{children}</main>
    </div>
  );
}

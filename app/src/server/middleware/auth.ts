import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard para Server Components y Server Actions.
 * Redirige a /login si no hay session.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * RBAC: verificar que el usuario tiene uno de los roles permitidos.
 */
export async function requireRole(...allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return session;
}

// Re-export withTenantContext from db for convenience.
// Use this instead of the old setTenantContext — it wraps in a transaction
// so set_config is properly scoped and doesn't leak across pool connections.
export { withTenantContext } from "@/lib/db";

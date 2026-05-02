import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.tenantId = (user as { tenantId: string }).tenantId;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      // Cuando el cliente llama update() tras cambiar contrasena, refrescamos el flag
      if (trigger === "update" && updateSession?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { tenantId: string }).tenantId = token.tenantId as string;
        (session.user as { mustChangePassword: boolean }).mustChangePassword =
          (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24h
  },
});

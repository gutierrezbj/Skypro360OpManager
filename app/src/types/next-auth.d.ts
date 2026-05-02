import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    tenantId: string;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      tenantId: string;
      mustChangePassword?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    tenantId: string;
    mustChangePassword?: boolean;
  }
}

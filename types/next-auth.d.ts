import { DefaultSession } from "next-auth";

type UserRole = "user" | "recruiter" | "admin";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }

  interface Session {
    user: {
      role?: UserRole;
    } & DefaultSession["user"];
  }
}
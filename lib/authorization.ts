import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Role = "user" | "recruiter" | "admin";

export async function requireRole(
  allowedRoles: Role[]
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !session.user.role ||
    !allowedRoles.includes(session.user.role)
  ) {
    throw new Error("Forbidden");
  }

  return session;
}
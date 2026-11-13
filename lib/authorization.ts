import { auth } from "../auth";
import { redirect } from "next/navigation";

type Role = "user" | "recruiter" | "admin";

export async function requireRole(
  allowedRoles: Role[]
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as typeof session.user & { role?: Role }).role;

  if (
    !role ||
    !allowedRoles.includes(role)
  ) {
    throw new Error("Forbidden");
  }

  return session;
}
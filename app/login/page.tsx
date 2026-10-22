import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export const instant = false;

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <button type="submit">
        Continue with Google
      </button>
    </form>
  );
}
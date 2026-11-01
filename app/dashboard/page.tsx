import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";


export const instant = false;

export default async function DashboardPage() {
  const session = await auth();

 console.log("Current role:", session?.user?.role);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      {session.user.image && (
        <img className="rounded-full" src={session.user.image} alt="Profile" width={80} />
      )}
      <form
        action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
        }}
        >
          <span className="bg-blue-500 text-white p-2 rounded-lg hover:underline"><Link href="/jobs">Go to Jobs</Link></span>
          <span className="bg-blue-500 text-white p-2 rounded-lg hover:underline"><Link href="/moderate-image">Go to Moderate Image</Link></span>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}

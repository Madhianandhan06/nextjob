
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import getMongoClient from "./lib/mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(getMongoClient),
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user",
        };
      },
    }),
  ],
  callbacks: {
  async session({ session, user }) {
    if (session.user) {
      console.log("Auth session user ID:", session.user.id);
      (session.user as typeof session.user & { role: string }).role =
        (user as typeof user & { role: string }).role;
    }

    return session;
  },
},
});

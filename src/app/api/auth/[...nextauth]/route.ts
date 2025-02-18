import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize() {
        return null; // This will prevent any actual authentication
      },
    }),
  ],
  secret: "temporary-secret-for-development",
});

export { handler as GET, handler as POST }; 
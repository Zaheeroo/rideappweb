import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import 'next-auth';

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      id: string;
      email: string;
      name: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    id: string;
    email: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
} 
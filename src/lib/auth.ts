import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Required for middleware & performance
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error", // Separate error page is better for debugging
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() }, // Normalize email
        });

        // 1. Basic User Existence Check
        if (!user || !user.passwordHash) return null;

        // 2. Status Checks
        if (!user.isActive) throw new Error("Your account has been suspended.");
        
        if (user.isSelfExcluded) {
          const now = new Date();
          if (!user.selfExcludeUntil || user.selfExcludeUntil > now) {
            throw new Error("Account is currently self-excluded.");
          }
        }

        // 3. Password Verification
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Pass user data to the token on initial login
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      
      // OPTIONAL: Update token if user profile is updated
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, account }) {
      // 4. Production-Ready Wallet Check
      // We ensure EVERY user has a wallet upon signing in
      try {
        const userId = user.id;
        if (!userId) return false;

        const wallet = await prisma.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          await prisma.wallet.create({
            data: {
              userId,
              balance: 0,
              currency: "INR",
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Wallet initialization error:", error);
        return true; // Still allow login even if wallet creation fails (fix later via UI)
      }
    },
  },
  debug: process.env.NODE_ENV === "development", // Enables helpful logs in terminal
});

// Improved Type Augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}
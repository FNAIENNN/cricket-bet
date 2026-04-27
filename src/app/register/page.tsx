// src/app/register/page.tsx
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-700 mb-4">
            <span className="text-3xl">🏏</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1">Join CricketBet today</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

// src/components/auth/login-form.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Chrome } from "lucide-react";

interface LoginFormProps {
  googleEnabled?: boolean;
  telegramEnabled?: boolean;
}

export function LoginForm({ googleEnabled = true, telegramEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    // Validation
    if (!email || !password) {
      setLocalError("Please enter both email and password");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setLocalError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Successful login - redirect
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setLocalError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      setLocalError("Google sign in failed. Please try again.");
      setLoading(false);
    }
  };

  const displayError = localError || (error ? "Authentication failed. Please try again." : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Display */}
      {displayError && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 animate-shake">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">{displayError}</p>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Remember Me & Demo Account */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
            Remember me
          </span>
        </label>
        
        <button
          type="button"
          onClick={() => {
            setEmail("demo@cricketbet.com");
            setPassword("demo123456");
          }}
          className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
        >
          
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      {/* Google Sign In Button */}
      {googleEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gray-900/40 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 group hover:border-emerald-500/30"
          >
            <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>
        </>
      )}

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-400 pt-2">
        Don't have an account?{" "}
        <a
          href="/register"
          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
        >
          Create Account
        </a>
      </p>
    </form>
  );
}
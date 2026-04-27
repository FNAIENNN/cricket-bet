// src/app/login/page.tsx
import { LoginForm } from "@/components/auth/login-form";
import { PromotionBanner } from "@/components/promotion-banner";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Suspense } from "react";
import { Shield, Trophy, Users, Zap, Activity, Clock, Star, Award } from "lucide-react";

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: "Login - CricketBet | Toss Betting Platform",
  description: "Login to your CricketBet account to start betting on cricket matches, manage your wallet, and track your winnings.",
  keywords: "cricket betting, toss betting, online betting, cricket exchange",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login to CricketBet",
    description: "Access your account and start betting on upcoming cricket matches",
    type: "website",
    url: "https://cricketbet.com/login",
    siteName: "CricketBet",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CricketBet Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login to CricketBet",
    description: "Access your account and start betting on upcoming cricket matches",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

// Loading skeleton component
function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-pulse">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/50 mb-4" />
          <div className="h-8 w-48 bg-gray-800 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-800 rounded-lg mx-auto" />
        </div>
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-12 bg-gray-800 rounded-xl" />
            <div className="h-12 bg-gray-800 rounded-xl" />
            <div className="h-12 bg-emerald-600/50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature highlights component - No hover effects
function Features() {
  const features = [
    {
      icon: Trophy,
      title: "Live Toss Betting",
      description: "Real-time odds & instant payouts",
      gradient: "from-amber-500 to-orange-500",
      stats: "95% Payout Rate",
    },
    {
      icon: Activity,
      title: "Live Match Updates",
      description: "Ball-by-ball coverage",
      gradient: "from-emerald-500 to-teal-500",
      stats: "24/7 Live",
    },
    {
      icon: Clock,
      title: "Instant Withdrawals",
      description: "Fast & secure payouts",
      gradient: "from-blue-500 to-cyan-500",
      stats: "< 2 Hours",
    },
    {
      icon: Star,
      title: "Expert Tips",
      description: "Professional analysis",
      gradient: "from-violet-500 to-purple-500",
      stats: "85% Accuracy",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "SSL encrypted & verified",
      gradient: "from-slate-500 to-gray-500",
      stats: "100% Safe",
    },
    {
      icon: Users,
      title: "24/7 Customer Support",
      description: "Dedicated assistance",
      gradient: "from-rose-500 to-red-500",
      stats: "Quick Response",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
      {features.map((feature, index) => (
        <div
          key={index}
          className="relative overflow-hidden bg-gray-800/40 rounded-xl p-3 border border-gray-700"
        >
          <feature.icon className={`w-5 h-5 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent mb-2`} />
          <h3 className="text-xs font-semibold text-white mb-0.5">{feature.title}</h3>
          <p className="text-[10px] text-gray-400">{feature.description}</p>
          <div className="mt-1.5">
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {feature.stats}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Security badges component
function SecurityBadges() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/30 rounded-lg">
        <Shield className="w-3 h-3 text-emerald-400" />
        <span className="text-gray-400">256-bit SSL</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/30 rounded-lg">
        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2C6.5 2 3.5 4.5 3 8c.5 3.5 3.5 6 7 6s6.5-2.5 7-6c-.5-3.5-3.5-6-7-6zm0 2c2.5 0 4.5 1.5 5 4-.5 2.5-2.5 4-5 4s-4.5-1.5-5-4c.5-2.5 2.5-4 5-4z" />
        </svg>
        <span className="text-gray-400">PCI Compliant</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/30 rounded-lg">
        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M10 2C5.5 2 2 6.5 2 10s3.5 8 8 8 8-3.5 8-8-3.5-8-8-8zm0 2c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" />
        </svg>
        <span className="text-gray-400">GDPR Ready</span>
      </div>
    </div>
  );
}

// Trust indicators component
function TrustIndicators() {
  return (
    <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-gray-600">
      <div className="flex items-center gap-1">
        <Award className="w-3 h-3 text-amber-500" />
        <span>Licensed Platform</span>
      </div>
      <div className="w-px h-3 bg-gray-700" />
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 flex items-center justify-center">
          <span className="text-amber-500 text-[10px]">⭐</span>
        </div>
        <span>4.8/5 Rating</span>
      </div>
      <div className="w-px h-3 bg-gray-700" />
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3 text-emerald-400" />
        <span>50K+ Users</span>
      </div>
    </div>
  );
}

// Background pattern component - Enhanced visible grid lines
function BackgroundPattern() {
  return (
    <>
      {/* Main gradient orbs */}
      <div className="fixed top-0 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl max-h-5xl bg-emerald-500/5 rounded-full blur-3xl" />
      
      {/* Visible Grid Pattern - Cricket field lines */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Diagonal pitch lines */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.04) 0px, rgba(16, 185, 129, 0.04) 1px, transparent 1px, transparent 60px)
          `,
        }}
      />
      
      {/* Cricket field circle pattern */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Subtle dot pattern */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.06) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </>
  );
}

export default async function LoginPage() {
  const session = await auth();
  
  if (session) {
    redirect("/");
  }

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const telegramLoginEnabled = process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_ENABLED === "true";
  const showPromotion = process.env.NEXT_PUBLIC_SHOW_LOGIN_PROMOTION !== "false";

  return (
    <Suspense fallback={<LoginSkeleton />}>
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundPattern />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Logo and Branding */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-2xl mb-4">
                <span className="relative text-4xl">
                  🏏
                </span>
              </div>
              
              <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                Sign in to continue your betting journey
              </p>
            </div>

            {/* Promotion Banner */}
            {showPromotion && <PromotionBanner />}

            {/* Login Form */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 md:p-8 shadow-2xl animate-slide-up">
              <LoginForm 
                googleEnabled={googleEnabled}
                telegramEnabled={telegramLoginEnabled}
              />
            </div>

            {/* Features Grid */}
            <Features />

            {/* Trust Indicators */}
            <TrustIndicators />

            {/* Security Badges */}
            <SecurityBadges />

            {/* Footer Links */}
            <div className="text-center mt-6 pt-4 border-t border-gray-800/50">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <a href="/terms" className="hover:text-emerald-400 transition-colors">
                  Terms
                </a>
                <span className="text-gray-700">•</span>
                <a href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Privacy
                </a>
                <span className="text-gray-700">•</span>
                <a href="/support" className="hover:text-emerald-400 transition-colors">
                  Support
                </a>
                <span className="text-gray-700">•</span>
                <a href="/responsible-gaming" className="hover:text-emerald-400 transition-colors">
                  Responsible Gaming
                </a>
              </div>
              <p className="text-[10px] text-gray-600 mt-4">
                © {new Date().getFullYear()} CricketBet. All rights reserved. 
                                    by LRA
              </p>
              <p className="text-[9px] text-gray-700 mt-2">
                ⚠️ Gambling involves risk. Please play responsibly. 18+
              </p>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
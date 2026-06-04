"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-landing-ivory grain">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-landing-charcoal relative overflow-hidden">
        {/* Geometric accents */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full border border-white/5" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-landing-forest flex items-center justify-center">
              <span className="text-white font-serif text-xl font-medium">D</span>
            </div>
            <span className="text-white font-medium tracking-tight">AI Interviewer</span>
          </Link>

          {/* Quote */}
          <div className="max-w-md">
            <span className="text-[80px] font-serif text-white/10 leading-none">&quot;</span>
            <p className="text-2xl text-white/80 font-light leading-relaxed -mt-8">
              The best product decisions come from understanding real customer behavior, not opinions.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-px bg-landing-terracotta" />
              <span className="text-white/40 text-sm">Teresa Torres Method</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <span className="text-4xl font-light text-white">15m</span>
              <p className="text-white/40 text-sm mt-1">Synthesis Time</p>
            </div>
            <div>
              <span className="text-4xl font-light text-landing-terracotta">3x</span>
              <p className="text-white/40 text-sm mt-1">More Insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-landing-forest flex items-center justify-center">
              <span className="text-white font-serif text-xl font-medium">D</span>
            </div>
            <span className="text-landing-charcoal font-medium tracking-tight">AI Interviewer</span>
          </Link>

          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-light text-landing-charcoal">
              Welcome back
            </h1>
            <p className="text-landing-stone">
              Sign in to continue your discovery journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-landing-charcoal text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white border-landing-charcoal/10 focus:border-landing-forest focus:ring-landing-forest/20 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-landing-charcoal text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-landing-forest hover:text-landing-forest-light transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white border-landing-charcoal/10 focus:border-landing-forest focus:ring-landing-forest/20 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-landing-charcoal hover:bg-landing-forest text-white text-sm uppercase tracking-wider font-medium rounded-full transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-landing-stone text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-landing-forest hover:text-landing-forest-light font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

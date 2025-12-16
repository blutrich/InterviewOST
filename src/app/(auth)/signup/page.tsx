"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Check your email
          </h1>
          <p className="text-landing-stone mb-8">
            We've sent a confirmation link to{" "}
            <span className="text-landing-charcoal font-medium">{email}</span>.
            Click it to activate your account.
          </p>

          <Button
            variant="outline"
            className="border-landing-charcoal/20 text-landing-charcoal hover:bg-landing-mist h-12 px-8 rounded-full"
            onClick={() => router.push("/login")}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-landing-ivory grain">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-landing-forest relative overflow-hidden">
        {/* Geometric accents */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-32 left-20 w-96 h-96 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-serif text-xl font-medium">D</span>
            </div>
            <span className="text-white font-medium tracking-tight">Discovery Co-Pilot</span>
          </Link>

          {/* Value prop */}
          <div className="max-w-md">
            <h2 className="text-4xl text-white font-light leading-tight mb-6">
              Start discovering what your customers{" "}
              <span className="italic text-landing-terracotta-light">actually</span> need.
            </h2>
            <ul className="space-y-4">
              {[
                "AI-conducted story-based interviews",
                "Instant synthesis & experience maps",
                "Visual Opportunity Solution Trees",
                "Evidence-linked insights"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-landing-terracotta" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 text-white/40 text-sm">
            <span className="w-8 h-px bg-white/20" />
            Open source • Free to start
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
            <span className="text-landing-charcoal font-medium tracking-tight">Discovery Co-Pilot</span>
          </Link>

          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-light text-landing-charcoal">
              Create your account
            </h1>
            <p className="text-landing-stone">
              Begin your continuous discovery journey.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-landing-charcoal text-sm font-medium">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Researcher"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 bg-white border-landing-charcoal/10 focus:border-landing-forest focus:ring-landing-forest/20 rounded-lg"
              />
            </div>

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
              <Label htmlFor="password" className="text-landing-charcoal text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="h-12 bg-white border-landing-charcoal/10 focus:border-landing-forest focus:ring-landing-forest/20 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-landing-forest hover:bg-landing-forest-light text-white text-sm uppercase tracking-wider font-medium rounded-full transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-landing-stone text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-landing-forest hover:text-landing-forest-light font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

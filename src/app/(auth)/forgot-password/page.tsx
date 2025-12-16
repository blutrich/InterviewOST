"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
          {/* Email icon */}
          <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Check your email
          </h1>
          <p className="text-landing-stone mb-8">
            We've sent a password reset link to{" "}
            <span className="text-landing-charcoal font-medium">{email}</span>.
          </p>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="border-landing-charcoal/20 text-landing-charcoal hover:bg-landing-mist h-12 px-8 rounded-full"
              asChild
            >
              <Link href="/login">Back to sign in</Link>
            </Button>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="block w-full text-sm text-landing-forest hover:text-landing-forest-light transition-colors"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg bg-landing-forest flex items-center justify-center">
            <span className="text-white font-serif text-xl font-medium">D</span>
          </div>
          <span className="text-landing-charcoal font-medium tracking-tight">Discovery Co-Pilot</span>
        </Link>

        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-light text-landing-charcoal">
            Reset your password
          </h1>
          <p className="text-landing-stone">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-landing-charcoal text-sm font-medium">
              Email address
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

          <Button
            type="submit"
            className="w-full h-12 bg-landing-charcoal hover:bg-landing-forest text-white text-sm uppercase tracking-wider font-medium rounded-full transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <p className="mt-8 text-center text-landing-stone text-sm">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-landing-forest hover:text-landing-forest-light font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

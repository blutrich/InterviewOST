"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setCheckingSession(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsValidSession(true);
          setCheckingSession(false);
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);

      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }, 3000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-landing-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-landing-stone">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          {/* Warning icon */}
          <div className="w-20 h-20 rounded-full bg-landing-terracotta/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Link expired
          </h1>
          <p className="text-landing-stone mb-8">
            This password reset link is invalid or has expired.
          </p>

          <div className="space-y-4">
            <Button
              className="bg-landing-charcoal hover:bg-landing-forest text-white h-12 px-8 rounded-full"
              asChild
            >
              <Link href="/forgot-password">Request new link</Link>
            </Button>
            <Button
              variant="outline"
              className="border-landing-charcoal/20 text-landing-charcoal hover:bg-landing-mist h-12 px-8 rounded-full ml-4"
              asChild
            >
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Password updated
          </h1>
          <p className="text-landing-stone mb-8">
            Your password has been reset. Redirecting to sign in...
          </p>

          <Button
            className="bg-landing-charcoal hover:bg-landing-forest text-white h-12 px-8 rounded-full"
            asChild
          >
            <Link href="/login">Sign in now</Link>
          </Button>
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
            Choose new password
          </h1>
          <p className="text-landing-stone">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-landing-charcoal text-sm font-medium">
              New password
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-landing-charcoal text-sm font-medium">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              className="h-12 bg-white border-landing-charcoal/10 focus:border-landing-forest focus:ring-landing-forest/20 rounded-lg"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-landing-charcoal hover:bg-landing-forest text-white text-sm uppercase tracking-wider font-medium rounded-full transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

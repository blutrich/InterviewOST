"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-landing-ivory/95 backdrop-blur-md border-b border-landing-charcoal/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <nav className="flex items-center justify-between h-20">
          {/* Logo - Refined wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-landing-forest flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-white font-serif text-xl font-medium">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-landing-charcoal font-medium tracking-tight text-[15px]">
                AI
              </span>
              <span className="text-landing-stone font-light tracking-tight text-[15px] ml-1">
                Interviewer
              </span>
            </div>
          </Link>

          {/* Nav Links - Minimal, confident */}
          <div className="hidden md:flex items-center gap-12">
            <a
              href="#method"
              className="text-[13px] uppercase tracking-[0.15em] text-landing-stone hover:text-landing-charcoal transition-colors duration-300"
            >
              Method
            </a>
            <a
              href="#features"
              className="text-[13px] uppercase tracking-[0.15em] text-landing-stone hover:text-landing-charcoal transition-colors duration-300"
            >
              Features
            </a>
          </div>

          {/* Auth Buttons - Sophisticated contrast */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className="text-landing-charcoal hover:bg-landing-charcoal/5 text-[13px] uppercase tracking-[0.1em] font-medium h-10 px-5"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-landing-forest hover:bg-landing-forest-light text-white text-[13px] uppercase tracking-[0.1em] font-medium h-10 px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-landing-forest/20"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

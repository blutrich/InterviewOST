"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="method" className="py-32 bg-landing-charcoal grain relative overflow-hidden">
      {/* Geometric accents */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full border border-white/5 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full border border-white/5 translate-x-1/4 translate-y-1/4" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Message */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-landing-terracotta">
              <span className="w-8 h-px bg-landing-terracotta" />
              The Teresa Torres Method
            </span>

            <h2 className="text-4xl md:text-5xl font-light text-white leading-tight">
              Stop guessing what customers want.{" "}
              <span className="italic text-landing-terracotta-light">Start listening.</span>
            </h2>

            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              AI Interviewer brings Teresa Torres&apos; Continuous Discovery methodology
              to life. Every interview, every insight, every opportunity—structured,
              connected, and ready to drive your next decision.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
              <Button
                size="lg"
                asChild
                className="bg-white hover:bg-landing-ivory text-landing-charcoal text-[13px] uppercase tracking-[0.15em] font-medium h-14 px-10 rounded-full transition-all duration-500 hover:shadow-xl"
              >
                <Link href="/signup">Begin your discovery</Link>
              </Button>
            </div>
          </div>

          {/* Right - Quote/Testimonial */}
          <div className="lg:pl-12">
            <div className="relative">
              {/* Large quotation mark */}
              <span className="absolute -top-8 -left-4 text-[120px] font-serif text-white/5 leading-none select-none">
                &quot;
              </span>
              <blockquote className="relative z-10 space-y-6">
                <p className="text-2xl text-white/90 font-light leading-relaxed italic">
                  The magic happens when you stop asking customers what they want and start
                  understanding what they actually do.
                </p>
                <footer className="flex items-center gap-4">
                  <div className="w-12 h-px bg-landing-terracotta" />
                  <div>
                    <p className="text-white font-medium">Teresa Torres</p>
                    <p className="text-white/40 text-sm">Author, Continuous Discovery Habits</p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

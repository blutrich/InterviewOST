"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen bg-landing-ivory grain overflow-hidden">
      {/* Subtle geometric accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <div className="absolute top-32 right-12 w-[500px] h-[500px] rounded-full border border-landing-charcoal/5" />
        <div className="absolute top-48 right-24 w-[400px] h-[400px] rounded-full border border-landing-charcoal/5" />
        <div className="absolute top-64 right-36 w-[300px] h-[300px] rounded-full bg-landing-mist/50" />
      </div>

      {/* Vertical text accent */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:block">
        <span className="text-[11px] uppercase tracking-[0.3em] text-landing-stone/40 [writing-mode:vertical-lr] rotate-180">
          Teresa Torres Method
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 pt-40 pb-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left content - Editorial typography */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-landing-stone">
                <span className="w-8 h-px bg-landing-terracotta" />
                Continuous Discovery
              </span>
            </div>

            {/* Main headline - Large, confident serif-style */}
            <h1 className="animate-fade-up [animation-delay:0.1s]">
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-light text-landing-charcoal leading-[1.1] tracking-tight">
                Customer insights
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-light text-landing-charcoal leading-[1.1] tracking-tight mt-2">
                that actually
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-medium text-landing-forest leading-[1.1] tracking-tight mt-2 italic">
                matter.
              </span>
            </h1>

            {/* Subheadline - Refined, restrained */}
            <p className="text-lg text-landing-stone max-w-xl leading-relaxed animate-fade-up [animation-delay:0.2s]">
              AI-conducted interviews that excavate real stories from real customers.
              Synthesis that reveals patterns. Trees that drive decisions.
            </p>

            {/* CTA - Bold, intentional */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4 animate-fade-up [animation-delay:0.3s]">
              <Button
                size="lg"
                asChild
                className="bg-landing-charcoal hover:bg-landing-forest text-white text-[13px] uppercase tracking-[0.15em] font-medium h-14 px-10 rounded-full transition-all duration-500 hover:shadow-xl"
              >
                <Link href="/signup">Start discovering</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="text-landing-charcoal hover:text-landing-forest text-[13px] uppercase tracking-[0.15em] font-medium h-14 px-6 group"
              >
                <a href="#method" className="flex items-center gap-3">
                  <span>See the method</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </Button>
            </div>
          </div>

          {/* Right side - Stats/proof */}
          <div className="lg:col-span-5 lg:pl-12">
            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-landing-charcoal/5 border border-landing-charcoal/5 animate-fade-up [animation-delay:0.4s]">
              <div className="space-y-8">
                {/* Stat blocks */}
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-light text-landing-forest">15</span>
                  <span className="text-sm text-landing-stone uppercase tracking-wider">min avg<br/>synthesis time</span>
                </div>
                <div className="h-px bg-landing-charcoal/10" />
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-light text-landing-terracotta">3x</span>
                  <span className="text-sm text-landing-stone uppercase tracking-wider">more insights<br/>per interview</span>
                </div>
                <div className="h-px bg-landing-charcoal/10" />
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-light text-landing-charcoal">∞</span>
                  <span className="text-sm text-landing-stone uppercase tracking-wider">stories<br/>waiting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom edge accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-landing-charcoal/10 to-transparent" />
    </section>
  );
}

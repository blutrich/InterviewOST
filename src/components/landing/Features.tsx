"use client";

const features = [
  {
    number: "01",
    title: "Story-Based Interviews",
    description:
      "Our AI doesn't ask opinions. It excavates real experiences—the last time they struggled, the workaround they built, the moment they almost gave up.",
    accent: "bg-landing-forest",
  },
  {
    number: "02",
    title: "Instant Synthesis",
    description:
      "Experience maps, quote reels, and key facts generated in minutes. See the customer's journey laid bare, with every insight traced to its source.",
    accent: "bg-landing-terracotta",
  },
  {
    number: "03",
    title: "Opportunity Trees",
    description:
      "Visualize findings as Teresa Torres intended. Drag opportunities, link evidence, watch patterns emerge across dozens of interviews.",
    accent: "bg-landing-charcoal",
  },
  {
    number: "04",
    title: "Evidence-Linked",
    description:
      "Every opportunity, every insight, every decision—connected to the exact customer quote that sparked it. No more 'trust me' presentations.",
    accent: "bg-landing-forest",
  },
];

export function Features() {
  return (
    <section id="features" className="py-32 bg-white grain">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        {/* Section header - Editorial style */}
        <div className="max-w-3xl mb-20">
          <span className="inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-landing-stone mb-6">
            <span className="w-8 h-px bg-landing-terracotta" />
            Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-landing-charcoal leading-tight">
            Everything you need to transform{" "}
            <span className="italic text-landing-forest">conversations</span>{" "}
            into <span className="italic text-landing-forest">decisions</span>.
          </h2>
        </div>

        {/* Features grid - Asymmetric editorial layout */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Number accent */}
              <div className="flex items-start gap-6">
                <span className="text-[11px] font-medium text-landing-stone/40 pt-2">
                  {feature.number}
                </span>
                <div className="flex-1 space-y-4">
                  {/* Color accent bar */}
                  <div className={`w-12 h-1 ${feature.accent} rounded-full transition-all duration-500 group-hover:w-20`} />

                  <h3 className="text-2xl font-medium text-landing-charcoal tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-landing-stone leading-relaxed text-[15px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

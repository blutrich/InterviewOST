"use client";

interface ExperienceStep {
  step: number;
  action: string;
  feeling: string;
  timestamp?: string;
}

interface ExperienceMapProps {
  steps: ExperienceStep[];
}

export function ExperienceMap({ steps }: ExperienceMapProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Experience Map
          </h2>
        </div>
        <div className="p-8">
          <p className="text-landing-stone">No experience map data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
      <div className="px-8 py-6 border-b border-landing-charcoal/5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
          Experience Map
        </h2>
        <p className="text-sm text-landing-stone">
          The participant&apos;s journey through their experience
        </p>
      </div>
      <div className="p-8">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-3 bottom-3 w-px bg-landing-charcoal/10" />

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="relative pl-14">
                {/* Timeline dot */}
                <div className="absolute left-2.5 w-6 h-6 rounded-full bg-landing-forest flex items-center justify-center text-[10px] text-white font-medium">
                  {step.step}
                </div>

                {/* Step content */}
                <div className="bg-landing-ivory rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-landing-charcoal leading-relaxed">
                        {step.action}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg">{getFeelingEmoji(step.feeling)}</span>
                        <span className="text-sm text-landing-stone italic">
                          &quot;{step.feeling}&quot;
                        </span>
                      </div>
                    </div>
                    {step.timestamp && (
                      <span className="text-[10px] uppercase tracking-wider text-landing-stone whitespace-nowrap">
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 -bottom-3 text-landing-charcoal/20">
                    <svg className="w-2 h-3 -translate-x-1/2" fill="currentColor" viewBox="0 0 8 12">
                      <path d="M4 12l-4-4h8z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFeelingEmoji(feeling: string): string {
  const lowerFeeling = feeling.toLowerCase();

  if (lowerFeeling.includes("frustrat") || lowerFeeling.includes("angry") || lowerFeeling.includes("annoyed")) {
    return "";
  }
  if (lowerFeeling.includes("confus") || lowerFeeling.includes("unsure") || lowerFeeling.includes("lost")) {
    return "";
  }
  if (lowerFeeling.includes("happy") || lowerFeeling.includes("satisf") || lowerFeeling.includes("pleased")) {
    return "";
  }
  if (lowerFeeling.includes("excit") || lowerFeeling.includes("enthus") || lowerFeeling.includes("eager")) {
    return "";
  }
  if (lowerFeeling.includes("worry") || lowerFeeling.includes("anxious") || lowerFeeling.includes("nervous")) {
    return "";
  }
  if (lowerFeeling.includes("hope") || lowerFeeling.includes("optimis")) {
    return "";
  }
  if (lowerFeeling.includes("relief") || lowerFeeling.includes("calm")) {
    return "";
  }
  if (lowerFeeling.includes("disappoint") || lowerFeeling.includes("let down")) {
    return "";
  }
  if (lowerFeeling.includes("surprise") || lowerFeeling.includes("shock")) {
    return "";
  }

  return "";
}

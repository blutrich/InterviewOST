"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            Experience Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No experience map data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Experience Map
        </CardTitle>
        <p className="text-sm text-gray-500">
          The participant&apos;s journey through their experience
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs text-white font-medium">
                  {step.step}
                </div>

                {/* Step content */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {step.action}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg">
                          {getFeelingEmoji(step.feeling)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                          &quot;{step.feeling}&quot;
                        </span>
                      </div>
                    </div>
                    {step.timestamp && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="absolute left-4 -bottom-3 text-gray-300">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 16l-6-6h12z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getFeelingEmoji(feeling: string): string {
  const lowerFeeling = feeling.toLowerCase();

  if (
    lowerFeeling.includes("frustrat") ||
    lowerFeeling.includes("angry") ||
    lowerFeeling.includes("annoyed")
  ) {
    return "😤";
  }
  if (
    lowerFeeling.includes("confus") ||
    lowerFeeling.includes("unsure") ||
    lowerFeeling.includes("lost")
  ) {
    return "😕";
  }
  if (
    lowerFeeling.includes("happy") ||
    lowerFeeling.includes("satisf") ||
    lowerFeeling.includes("pleased")
  ) {
    return "😊";
  }
  if (
    lowerFeeling.includes("excit") ||
    lowerFeeling.includes("enthus") ||
    lowerFeeling.includes("eager")
  ) {
    return "🤩";
  }
  if (
    lowerFeeling.includes("worry") ||
    lowerFeeling.includes("anxious") ||
    lowerFeeling.includes("nervous")
  ) {
    return "😟";
  }
  if (
    lowerFeeling.includes("hope") ||
    lowerFeeling.includes("optimis")
  ) {
    return "🙂";
  }
  if (
    lowerFeeling.includes("relief") ||
    lowerFeeling.includes("calm")
  ) {
    return "😌";
  }
  if (
    lowerFeeling.includes("disappoint") ||
    lowerFeeling.includes("let down")
  ) {
    return "😞";
  }
  if (
    lowerFeeling.includes("surprise") ||
    lowerFeeling.includes("shock")
  ) {
    return "😮";
  }

  return "💭";
}

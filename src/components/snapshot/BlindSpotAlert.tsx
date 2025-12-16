"use client";

interface BlindSpot {
  observation: string;
  suggestion: string;
  severity: "low" | "medium" | "high";
}

interface BlindSpotAlertProps {
  blindSpots: BlindSpot[];
}

export function BlindSpotAlert({ blindSpots }: BlindSpotAlertProps) {
  if (!blindSpots || blindSpots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-landing-forest/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Blind Spots
          </h2>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-3 text-landing-forest">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>No significant blind spots detected. Great interview!</span>
          </div>
        </div>
      </div>
    );
  }

  const sortedBlindSpots = [...blindSpots].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const highCount = blindSpots.filter((b) => b.severity === "high").length;
  const mediumCount = blindSpots.filter((b) => b.severity === "medium").length;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${highCount > 0 ? "border-landing-terracotta/30" : "border-landing-charcoal/5"}`}>
      <div className="px-8 py-6 border-b border-landing-charcoal/5 flex items-center justify-between">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
            Blind Spots
          </h2>
          <p className="text-sm text-landing-stone">
            Opportunities that were missed during the interview
          </p>
        </div>
        <div className="flex gap-2">
          {highCount > 0 && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full bg-landing-terracotta/10 text-landing-terracotta">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full bg-landing-stone/10 text-landing-stone">
              {mediumCount} Medium
            </span>
          )}
        </div>
      </div>
      <div className="p-8">
        <div className="space-y-4">
          {sortedBlindSpots.map((blindSpot, index) => (
            <div
              key={index}
              className={`rounded-xl p-5 ${getSeverityBgColor(blindSpot.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getSeverityIconBg(blindSpot.severity)}`}>
                  {getSeverityIcon(blindSpot.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded ${getSeverityBadgeClass(blindSpot.severity)}`}>
                      {blindSpot.severity}
                    </span>
                  </div>
                  <p className="font-medium text-landing-charcoal mb-3">
                    {blindSpot.observation}
                  </p>
                  <div className="flex items-start gap-2 text-sm text-landing-stone">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <span>{blindSpot.suggestion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {highCount > 0 && (
          <div className="mt-6 p-4 bg-landing-terracotta/5 rounded-xl border border-landing-terracotta/20">
            <p className="text-sm text-landing-terracotta">
              <strong>Recommendation:</strong> Consider scheduling a follow-up
              interview to explore the high-severity blind spots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getSeverityBgColor(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-landing-terracotta/5";
    case "medium":
      return "bg-landing-stone/5";
    case "low":
      return "bg-landing-ivory";
    default:
      return "bg-landing-ivory";
  }
}

function getSeverityIconBg(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-landing-terracotta/10";
    case "medium":
      return "bg-landing-stone/10";
    case "low":
      return "bg-landing-charcoal/5";
    default:
      return "bg-landing-charcoal/5";
  }
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-landing-terracotta/10 text-landing-terracotta";
    case "medium":
      return "bg-landing-stone/10 text-landing-stone";
    case "low":
      return "bg-landing-charcoal/5 text-landing-charcoal/70";
    default:
      return "bg-landing-charcoal/5 text-landing-charcoal/70";
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "high":
      return (
        <svg className="w-4 h-4 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    case "medium":
      return (
        <svg className="w-4 h-4 text-landing-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-landing-charcoal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      );
  }
}

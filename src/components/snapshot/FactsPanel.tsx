"use client";

interface Facts {
  role?: string;
  tools?: string[];
  frequency?: string;
  context?: string;
  other?: Record<string, unknown>;
}

interface FactsPanelProps {
  facts: Facts;
}

export function FactsPanel({ facts }: FactsPanelProps) {
  if (!facts || Object.keys(facts).length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Facts Extracted
          </h2>
        </div>
        <div className="p-8">
          <p className="text-landing-stone">No facts extracted.</p>
        </div>
      </div>
    );
  }

  const hasAnyFacts =
    facts.role ||
    (facts.tools && facts.tools.length > 0) ||
    facts.frequency ||
    facts.context ||
    (facts.other && Object.keys(facts.other).length > 0);

  if (!hasAnyFacts) {
    return (
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Facts Extracted
          </h2>
        </div>
        <div className="p-8">
          <p className="text-landing-stone">No specific facts were extracted from this interview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
      <div className="px-8 py-6 border-b border-landing-charcoal/5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
          Facts Extracted
        </h2>
        <p className="text-sm text-landing-stone">
          Objective information stated during the interview
        </p>
      </div>
      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2">
          {facts.role && (
            <FactItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              label="Role / Title"
              value={facts.role}
            />
          )}

          {facts.tools && facts.tools.length > 0 && (
            <FactItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              }
              label="Tools & Products"
              value={
                <div className="flex flex-wrap gap-2">
                  {facts.tools.map((tool, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 bg-landing-ivory rounded-full text-landing-charcoal">
                      {tool}
                    </span>
                  ))}
                </div>
              }
            />
          )}

          {facts.frequency && (
            <FactItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              label="Frequency"
              value={facts.frequency}
            />
          )}

          {facts.context && (
            <FactItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              }
              label="Context"
              value={facts.context}
            />
          )}

          {facts.other && Object.keys(facts.other).length > 0 && (
            <div className="md:col-span-2">
              <FactItem
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                }
                label="Other Facts"
                value={
                  <div className="space-y-1">
                    {Object.entries(facts.other).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium capitalize text-landing-charcoal">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-landing-stone">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FactItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function FactItem({ icon, label, value }: FactItemProps) {
  return (
    <div className="bg-landing-ivory rounded-xl p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium text-landing-stone mb-2">
        <span className="text-landing-forest">{icon}</span>
        {label}
      </div>
      <div className="text-landing-charcoal">
        {typeof value === "string" ? value : value}
      </div>
    </div>
  );
}

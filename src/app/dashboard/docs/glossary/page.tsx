import Link from "next/link";

const terms = [
  {
    term: "Continuous Discovery",
    definition: "A product discovery framework developed by Teresa Torres. Teams conduct small research activities every week, staying in touch with customers while building products.",
  },
  {
    term: "Experience Map",
    definition: "A visual representation of a user's journey through a specific experience, showing phases, actions, thoughts, and feelings. Unlike journey maps, experience maps focus on one story from one interview.",
  },
  {
    term: "Interview Snapshot",
    definition: "A structured summary of a single interview designed to be consumed in 15 minutes or less. Contains an experience map, quote reel, extracted facts, and identified blind spots.",
  },
  {
    term: "Opportunity",
    definition: "An unmet need, pain point, or desire discovered through customer research. Opportunities are the starting point for ideation in the OST framework.",
  },
  {
    term: "Opportunity Solution Tree (OST)",
    definition: "A visual framework for connecting business outcomes to opportunities and solutions. The tree helps teams see how customer opportunities map to the solutions they're considering.",
  },
  {
    term: "Quote Reel",
    definition: "A collection of verbatim quotes from an interview, categorized by theme. Quotes preserve the customer's exact words to avoid researcher interpretation.",
  },
  {
    term: "Rubric",
    definition: "An interview guide that structures the conversation while allowing flexibility. Includes core questions, follow-up probes, and redirects for common responses.",
  },
  {
    term: "Story Excavation",
    definition: "A Teresa Torres technique for uncovering specific past experiences instead of opinions or generalizations. The interviewer asks 'Tell me about the last time...' rather than 'What do you usually do?'",
  },
  {
    term: "Stories Over Opinions",
    definition: "A core principle of effective customer interviewing. Specific stories reveal actual behavior, while opinions often reflect what people think they should say.",
  },
  {
    term: "Blind Spot",
    definition: "A topic or angle that wasn't explored during an interview. Identifying blind spots helps improve future interviews and highlights potential gaps in understanding.",
  },
];

export default function GlossaryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Getting Started
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Glossary
        </h1>
        <p className="text-lg text-gray-600">
          Key terms from Teresa Torres&apos; Continuous Discovery methodology and Base44 Interviewer.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Terms */}
      <div className="space-y-6">
        {terms.map((item) => (
          <div key={item.term} className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">{item.term}</h3>
            <p className="text-gray-600">{item.definition}</p>
          </div>
        ))}
      </div>

      <hr className="border-gray-100" />

      {/* Feedback */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">Was this helpful?</span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            👍 Yes
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            👎 No
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/docs/quick-start"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Quick Start
            </span>
          </div>
          <span className="text-sm text-gray-500">Previous</span>
        </Link>

        <Link
          href="/dashboard/docs/ai-agents"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              AI Agents
            </span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

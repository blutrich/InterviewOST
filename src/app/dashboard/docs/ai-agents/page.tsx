import Link from "next/link";

export default function AIAgentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Using AI Agents
        </h1>
        <p className="text-lg text-gray-600">
          AI Interviewer uses 5 specialized AI agents, each trained on Teresa Torres&apos; Continuous Discovery methodology.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        {/* Project Generator */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">Project Generator</h2>
          </div>
          <p className="text-gray-600">
            Transforms simple research ideas into well-structured projects aligned with Teresa Torres&apos; methodology. Just describe what you want to research, and it creates a complete project framework.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">It generates:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Project Name</strong> — Clear, concise title (3-6 words)</li>
              <li><strong>Research Goals</strong> — Behavior-focused learning objectives</li>
              <li><strong>Target Audience</strong> — Specific segments, not &quot;all users&quot;</li>
              <li><strong>Desired Outcome</strong> — Measurable behavior change (OST root)</li>
            </ul>
          </div>
        </section>

        {/* Planner */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">Planner</h2>
          </div>
          <p className="text-gray-600">
            Creates story-based interview rubrics following Teresa Torres&apos; &quot;Stories over Opinions&quot; principle. Instead of asking what users want, it designs questions that excavate specific past experiences.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">The Planner generates:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>A warm introduction to build rapport</li>
              <li>Story excavation questions with natural follow-ups</li>
              <li>Probes to dig deeper when needed</li>
              <li>Redirect prompts for vague answers</li>
              <li>Closing remarks that leave the door open</li>
            </ul>
          </div>
        </section>

        {/* Interviewer */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">Interviewer</h2>
          </div>
          <p className="text-gray-600">
            Conducts real-time customer interviews using the rubric. It never accepts vague answers—always probing for the specific story arc: context, actions, and outcomes.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Core behaviors:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Asks for specific recent examples, never generalizations</li>
              <li>Uses active listening to build on what&apos;s shared</li>
              <li>Separates facts from opinions</li>
              <li>Redirects &quot;I usually...&quot; to &quot;Tell me about the last time...&quot;</li>
              <li>Knows when to end naturally</li>
            </ul>
          </div>
        </section>

        {/* Synthesizer */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">Synthesizer</h2>
          </div>
          <p className="text-gray-600">
            Creates Interview Snapshots from completed interviews—a structured summary designed to be reviewed in 15 minutes or less, per Teresa Torres&apos; recommendation.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Snapshot components:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Experience Map</strong> — Journey phases with thoughts/feelings</li>
              <li><strong>Quote Reel</strong> — Verbatim quotes categorized by theme</li>
              <li><strong>Facts</strong> — Objective, verifiable data points</li>
              <li><strong>Blind Spots</strong> — Topics that weren&apos;t explored</li>
            </ul>
          </div>
        </section>

        {/* Mapper */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">Mapper</h2>
          </div>
          <p className="text-gray-600">
            Extracts opportunities from approved snapshots and suggests where they fit in your Opportunity Solution Tree. All suggestions require human approval.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">It identifies:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Opportunities</strong> — Unmet needs or desires</li>
              <li><strong>Pain Points</strong> — Problems causing friction</li>
              <li><strong>Workarounds</strong> — Current hacks and solutions</li>
              <li><strong>Potential Duplicates</strong> — Similar existing opportunities</li>
            </ul>
          </div>
        </section>
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
          href="/dashboard/docs/creating-templates"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Creating Templates
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

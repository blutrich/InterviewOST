import Link from "next/link";

export default function AIAgentsPage() {
  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <span>Agents</span>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Overview</span>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Using Agents
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Discovery Co-Pilot uses 5 specialized AI agents, each trained on Teresa Torres&apos; Continuous Discovery methodology. 
          They work together to help you conduct better interviews, synthesize insights faster, and build evidence-backed Opportunity Solution Trees.
        </p>
      </header>

      {/* Content */}
      <div className="space-y-10">
        {/* Project Generator */}
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900 group" id="project-generator">
            Project Generator
            <a href="#project-generator" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Transforms simple research ideas into well-structured projects aligned with Teresa Torres&apos; methodology. 
            Just describe what you want to research, and it creates a complete project framework with clear goals, 
            specific target audience, and measurable desired outcomes.
          </p>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm font-medium text-blue-900 mb-2">Generates:</p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li><strong>Project Name</strong> — Clear, concise title (3-6 words)</li>
              <li><strong>Research Goals</strong> — Behavior-focused learning objectives</li>
              <li><strong>Target Audience</strong> — Specific segments, not &quot;all users&quot;</li>
              <li><strong>Desired Outcome</strong> — Measurable behavior change (OST root)</li>
            </ul>
          </div>
        </section>

        {/* Planner */}
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900" id="planner">
            Planner
            <a href="#planner" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Creates story-based interview rubrics following Teresa Torres&apos; &quot;Stories over Opinions&quot; principle. 
            Instead of asking what users want, it designs questions that excavate specific past experiences—the gold standard for qualitative research.
          </p>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">The Planner generates:</p>
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
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900" id="interviewer">
            Interviewer
            <a href="#interviewer" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Conducts real-time customer interviews using the rubric. It never accepts vague answers—always probing 
            for the specific story arc: context, actions, and outcomes.
          </p>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Core behaviors:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Asks for specific recent examples, never generalizations</li>
              <li>Uses active listening to build on what&apos;s shared</li>
              <li>Separates facts from opinions</li>
              <li>Redirects &quot;I usually...&quot; to &quot;Tell me about the last time...&quot;</li>
              <li>Knows when to end naturally</li>
            </ul>
          </div>
          <blockquote className="border-l-4 border-gray-200 pl-4 text-sm text-gray-500 italic">
            See <Link href="/dashboard/docs/managing-interviews" className="text-landing-forest hover:underline">Managing Interviews</Link> for 
            the full interview workflow.
          </blockquote>
        </section>

        {/* Synthesizer */}
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900" id="synthesizer">
            Synthesizer
            <a href="#synthesizer" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Creates Interview Snapshots from completed interviews—a structured summary designed to be reviewed in 15 minutes or less, 
            per Teresa Torres&apos; recommendation.
          </p>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Snapshot components:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Experience Map</strong> — Journey phases with thoughts/feelings</li>
              <li><strong>Quote Reel</strong> — Verbatim quotes categorized by theme</li>
              <li><strong>Facts</strong> — Objective, verifiable data points</li>
              <li><strong>Blind Spots</strong> — Topics that weren&apos;t explored</li>
            </ul>
          </div>
          <blockquote className="border-l-4 border-gray-200 pl-4 text-sm text-gray-500 italic">
            See <Link href="/dashboard/docs/snapshots" className="text-landing-forest hover:underline">Working with Snapshots</Link> for more information.
          </blockquote>
        </section>

        {/* Mapper */}
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900" id="mapper">
            Mapper
            <a href="#mapper" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Extracts opportunities from approved snapshots and suggests where they fit in your Opportunity Solution Tree. 
            All suggestions require human approval—you&apos;re always in control.
          </p>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">It identifies:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Opportunities</strong> — Unmet needs or desires</li>
              <li><strong>Pain Points</strong> — Problems causing friction</li>
              <li><strong>Workarounds</strong> — Current hacks and solutions</li>
              <li><strong>Potential Duplicates</strong> — Similar existing opportunities</li>
            </ul>
          </div>
          <blockquote className="border-l-4 border-gray-200 pl-4 text-sm text-gray-500 italic">
            See <Link href="/dashboard/docs/ost" className="text-landing-forest hover:underline">Building Your OST</Link> for the complete tree workflow.
          </blockquote>
        </section>

        {/* Related */}
        <section className="space-y-3 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-medium text-gray-900" id="related">
            Related
            <a href="#related" className="ml-2 text-gray-300 hover:text-gray-500">#</a>
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><Link href="/dashboard/docs/creating-templates" className="text-landing-forest hover:underline">Creating Templates</Link></li>
            <li><Link href="/dashboard/docs/managing-interviews" className="text-landing-forest hover:underline">Managing Interviews</Link></li>
            <li><Link href="/dashboard/docs/snapshots" className="text-landing-forest hover:underline">Working with Snapshots</Link></li>
            <li><Link href="/dashboard/docs/ost" className="text-landing-forest hover:underline">Building Your OST</Link></li>
          </ul>
        </section>
      </div>

      {/* Navigation */}
      <nav className="flex justify-between items-center pt-8 border-t border-gray-100">
        <Link
          href="/dashboard/docs/quick-start"
          className="group flex items-center gap-2 text-gray-600 hover:text-landing-forest transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <div className="text-left">
            <div className="text-xs text-gray-400">Previous</div>
            <div className="font-medium group-hover:text-landing-forest">Quick Start</div>
          </div>
        </Link>

        <Link
          href="/dashboard/docs/creating-templates"
          className="group flex items-center gap-2 text-gray-600 hover:text-landing-forest transition-colors"
        >
          <div className="text-right">
            <div className="text-xs text-gray-400">Next</div>
            <div className="font-medium group-hover:text-landing-forest">Creating Templates</div>
          </div>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </nav>
    </div>
  );
}

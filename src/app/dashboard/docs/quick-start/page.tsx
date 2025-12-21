import Link from "next/link";

export default function QuickStartPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Getting Started
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Quick Start
        </h1>
        <p className="text-lg text-gray-600">
          Create your first project, generate an interview template, and run an AI-powered customer interview in 5 minutes.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        {/* Step 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Step 1 | Create a Project
          </h2>
          <p className="text-gray-600">
            From your dashboard, click <strong>&quot;New Project&quot;</strong> and enter your project name and research goal. Be specific about what you want to learn.
          </p>
          
          <Tip>
            A good research goal focuses on understanding behavior, not validating ideas. 
            Example: &quot;Understand how teams currently share project updates&quot; instead of &quot;Validate our new notification feature.&quot;
          </Tip>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Step 2 | Generate Your Template
          </h2>
          <p className="text-gray-600">
            Go to your project&apos;s <strong>Templates</strong> tab and click <strong>&quot;Generate Template&quot;</strong>. The Planner Agent will create a story-based interview rubric following Teresa Torres&apos; methodology.
          </p>
          <p className="text-gray-600">
            Review the generated rubric. It includes an introduction, story excavation questions with follow-ups, and closing remarks. Approve or edit it before using.
          </p>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Step 3 | Create an Interview
          </h2>
          <p className="text-gray-600">
            In your project&apos;s <strong>Interviews</strong> tab, click <strong>&quot;New Interview&quot;</strong>. This generates a unique shareable link that you can send to your participant.
          </p>
          <p className="text-gray-600">
            Each link is single-use. When the participant clicks it, they&apos;ll enter their name and begin the AI-guided conversation.
          </p>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Step 4 | Review the Interview
          </h2>
          <p className="text-gray-600">
            Once complete, open the interview to see the full transcript. Then click <strong>&quot;Generate Snapshot&quot;</strong> to have the Synthesizer Agent extract:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li><strong>Experience Map</strong> — The journey with phases, thoughts, and feelings</li>
            <li><strong>Quote Reel</strong> — Key verbatim quotes with categories</li>
            <li><strong>Facts</strong> — Objective data points from the interview</li>
            <li><strong>Blind Spots</strong> — Topics you might have missed</li>
          </ul>
        </section>

        {/* Step 5 */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Step 5 | Build Your OST
          </h2>
          <p className="text-gray-600">
            After approving a snapshot, go to the <strong>OST</strong> (Opportunity Solution Tree) tab. The Mapper Agent will suggest opportunities based on your interviews.
          </p>
          <p className="text-gray-600">
            Drag opportunities to organize them. Each node shows evidence from real interviews, helping you prioritize based on actual customer needs.
          </p>
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

      {/* Next Page */}
      <Link
        href="/dashboard/docs/ai-agents"
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
      >
        <span className="text-sm text-gray-500">Next</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
            Using AI Agents
          </span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-landing-forest/5 border border-landing-forest/10">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      </div>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  );
}

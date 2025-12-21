import Link from "next/link";

export default function CreatingTemplatesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Creating Templates
        </h1>
        <p className="text-lg text-gray-600">
          Interview templates (rubrics) guide the AI Interviewer. Learn how to generate and customize them for your research goals.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            How Templates Work
          </h2>
          <p className="text-gray-600">
            Each project can have multiple templates, but only one can be active at a time. The active template is used for all new interviews in that project.
          </p>
          <p className="text-gray-600">
            Templates follow Teresa Torres&apos; story-based interviewing approach. Instead of asking &quot;What features do you want?&quot;, they ask &quot;Tell me about the last time you...&quot;
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Generating a Template
          </h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Go to your project&apos;s <strong>Templates</strong> tab</li>
            <li>Click <strong>Generate Template</strong></li>
            <li>The Planner Agent creates a rubric based on your project&apos;s research goal</li>
            <li>Review the generated content</li>
            <li>Click <strong>Approve</strong> to make it available, or <strong>Edit</strong> to customize</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Template Structure
          </h2>
          <p className="text-gray-600">A template contains:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
            <li><strong>Introduction</strong> — How the AI greets participants and sets context</li>
            <li><strong>Story Questions</strong> — Main questions that excavate specific experiences</li>
            <li><strong>Follow-ups</strong> — Natural next questions based on common responses</li>
            <li><strong>Probes</strong> — Deeper questions to uncover details</li>
            <li><strong>Vague Answer Redirects</strong> — How to handle generalizations</li>
            <li><strong>Closing</strong> — How to end the conversation gracefully</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Editing Templates
          </h2>
          <p className="text-gray-600">
            You can edit any template before or after approval. Click the template to view its rubric, then click <strong>Edit Rubric</strong> to modify the JSON structure.
          </p>
          
          <div className="flex gap-3 p-4 rounded-xl bg-landing-forest/5 border border-landing-forest/10">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              Changes to a template don&apos;t affect interviews that have already started. Only new interviews use the updated rubric.
            </p>
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
          href="/dashboard/docs/ai-agents"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              AI Agents
            </span>
          </div>
          <span className="text-sm text-gray-500">Previous</span>
        </Link>

        <Link
          href="/dashboard/docs/managing-interviews"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Managing Interviews
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


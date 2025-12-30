import Link from "next/link";

export default function TroubleshootingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Community & Support
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Troubleshooting
        </h1>
        <p className="text-lg text-gray-600">
          Common issues and how to resolve them.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* FAQs */}
      <div className="space-y-6">
        <FAQ
          question="Interview link not working"
          answer="Make sure the link hasn't already been used. Each interview link is single-use. Create a new interview if the participant needs a fresh link."
        />

        <FAQ
          question="Template generation failed"
          answer="Check that your project has a research goal. The Planner Agent needs this context to create relevant questions. If it still fails, try refreshing the page and generating again."
        />

        <FAQ
          question="Snapshot generation is taking too long"
          answer="Long interviews with many messages take more time to analyze. If it takes more than a minute, refresh the page and try again. The synthesis should appear once complete."
        />

        <FAQ
          question="Opportunities not appearing in OST"
          answer="Make sure you've approved the snapshot first. Only approved snapshots can be analyzed by the Mapper Agent. Check the snapshot status on the interview page."
        />

        <FAQ
          question="AI interviewer ending too early"
          answer="The interviewer is designed to end naturally after covering the core questions. If you need longer interviews, consider adding more topics to your template rubric."
        />

        <FAQ
          question="Participant can't access the interview"
          answer="Verify the participant has a stable internet connection. Interview links work on any modern browser. If issues persist, create a new interview link."
        />

        <FAQ
          question="Experience map looks incomplete"
          answer="The Synthesizer creates maps based on what was discussed. Short interviews or interviews that didn't explore the full journey will have shorter maps. This isn't an error—it reflects the interview content."
        />

        <FAQ
          question="Can't see my projects"
          answer="Make sure you're logged in with the same account you used to create the projects. Projects are tied to your user account."
        />
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
      <Link
        href="/dashboard/docs/board"
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
            PM Board
          </span>
        </div>
        <span className="text-sm text-gray-500">Previous</span>
      </Link>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200">
      <h3 className="font-medium text-gray-900 mb-2">{question}</h3>
      <p className="text-sm text-gray-600">{answer}</p>
    </div>
  );
}


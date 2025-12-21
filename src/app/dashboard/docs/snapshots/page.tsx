import Link from "next/link";

export default function SnapshotsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Working with Snapshots
        </h1>
        <p className="text-lg text-gray-600">
          Interview Snapshots are structured summaries that capture the key insights from each interview, designed to be reviewed in 15 minutes or less.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Generating a Snapshot
          </h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Open a completed interview</li>
            <li>Click <strong>Generate Snapshot</strong></li>
            <li>The Synthesizer Agent analyzes the transcript</li>
            <li>Review the generated snapshot</li>
            <li>Approve it to make it available for the OST</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Snapshot Components
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Experience Map</h3>
              <p className="text-sm text-gray-600">
                A journey through the participant&apos;s story, broken into phases. Each phase includes what happened, what the participant was thinking, and how they were feeling.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Quote Reel</h3>
              <p className="text-sm text-gray-600">
                Verbatim quotes from the interview, organized by category. These preserve the participant&apos;s exact words to avoid researcher interpretation.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Facts</h3>
              <p className="text-sm text-gray-600">
                Objective, verifiable data points extracted from the interview. Examples: &quot;Uses tool X 3 times per week&quot; or &quot;Team has 5 members.&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Blind Spots</h3>
              <p className="text-sm text-gray-600">
                Topics that weren&apos;t explored during the interview. These help you improve future interviews and identify gaps in your understanding.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Approving Snapshots
          </h2>
          <p className="text-gray-600">
            After reviewing a snapshot, you can approve it. Approved snapshots can be used by the Mapper Agent to suggest opportunities for your OST.
          </p>
          
          <div className="flex gap-3 p-4 rounded-xl bg-landing-forest/5 border border-landing-forest/10">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              Always review snapshots before approving. The AI may occasionally misinterpret context or miss nuances that you caught during review.
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
          href="/dashboard/docs/managing-interviews"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Managing Interviews
            </span>
          </div>
          <span className="text-sm text-gray-500">Previous</span>
        </Link>

        <Link
          href="/dashboard/docs/ost"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Building Your OST
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


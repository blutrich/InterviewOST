import Link from "next/link";

export default function ManagingInterviewsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Managing Interviews
        </h1>
        <p className="text-lg text-gray-600">
          Create interview links, track participant progress, and review completed transcripts.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Creating an Interview
          </h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Go to your project&apos;s <strong>Interviews</strong> tab</li>
            <li>Click <strong>New Interview</strong></li>
            <li>Copy the generated link</li>
            <li>Share the link with your participant</li>
          </ol>
          <p className="text-gray-600">
            Each interview link is unique and single-use. When participants click the link, they enter their name and start the AI-guided conversation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Interview Status
          </h2>
          <p className="text-gray-600">Interviews go through these stages:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
            <li><strong>Pending</strong> — Link created, waiting for participant</li>
            <li><strong>Active</strong> — Participant is currently in the interview</li>
            <li><strong>Completed</strong> — Interview finished normally</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Reviewing Transcripts
          </h2>
          <p className="text-gray-600">
            Click any completed interview to see the full transcript. You&apos;ll see every message exchanged between the AI Interviewer and the participant.
          </p>
          <p className="text-gray-600">
            From the transcript view, you can generate an Interview Snapshot to extract insights.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Sharing Interview Links
          </h2>
          <p className="text-gray-600">
            Interview links work on any device. Participants don&apos;t need to create an account—they just click the link, enter their name, and start talking.
          </p>
          
          <div className="flex gap-3 p-4 rounded-xl bg-landing-forest/5 border border-landing-forest/10">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              Brief your participants before sending the link. Let them know they&apos;ll be chatting with an AI and that you&apos;re looking for specific past experiences, not general opinions.
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
          href="/dashboard/docs/creating-templates"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Creating Templates
            </span>
          </div>
          <span className="text-sm text-gray-500">Previous</span>
        </Link>

        <Link
          href="/dashboard/docs/snapshots"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Working with Snapshots
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


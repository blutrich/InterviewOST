import Link from "next/link";

export default function OSTPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Building Your OST
        </h1>
        <p className="text-lg text-gray-600">
          The Opportunity Solution Tree (OST) is a visual framework for organizing customer opportunities and connecting them to solutions.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            What is an OST?
          </h2>
          <p className="text-gray-600">
            Developed by Teresa Torres, the Opportunity Solution Tree helps product teams connect business outcomes to customer opportunities and potential solutions. It starts with a desired outcome at the top and branches down into opportunities discovered through research.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Using the Tree View
          </h2>
          <p className="text-gray-600">
            Go to your project&apos;s <strong>Tree</strong> tab to see your OST. The tree shows:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
            <li><strong>Root</strong> — Your research goal or desired outcome</li>
            <li><strong>Opportunities</strong> — Unmet needs discovered in interviews</li>
            <li><strong>Pain Points</strong> — Problems causing friction</li>
            <li><strong>Workarounds</strong> — How people currently solve problems</li>
          </ul>
          <p className="text-gray-600">
            Each node shows the number of evidence items (quotes from interviews) that support it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Adding Opportunities
          </h2>
          <p className="text-gray-600">
            The Mapper Agent suggests opportunities when you approve a snapshot. You can:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
            <li>Accept suggestions to add them to your tree</li>
            <li>Reject suggestions you don&apos;t find relevant</li>
            <li>Manually create opportunities if needed</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Organizing the Tree
          </h2>
          <p className="text-gray-600">
            Drag opportunities to reorganize them. Parent-child relationships help you understand how opportunities relate to each other. A broad opportunity might have several more specific opportunities beneath it.
          </p>
          
          <div className="flex gap-3 p-4 rounded-xl bg-landing-forest/5 border border-landing-forest/10">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              Look for opportunities that appear across multiple interviews. These are often your most important discoveries—problems that affect many customers.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">
            Viewing Evidence
          </h2>
          <p className="text-gray-600">
            Click any opportunity to see its evidence panel. This shows the verbatim quotes from interviews that support this opportunity, helping you understand the real customer context behind each discovery.
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

      {/* Navigation */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/docs/snapshots"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Working with Snapshots
            </span>
          </div>
          <span className="text-sm text-gray-500">Previous</span>
        </Link>

        <Link
          href="/dashboard/docs/troubleshooting"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <span className="text-sm text-gray-500">Next</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Troubleshooting
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


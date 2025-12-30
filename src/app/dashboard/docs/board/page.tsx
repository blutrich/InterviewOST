import Link from "next/link";

export default function BoardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-block px-2.5 py-1 rounded-md bg-landing-forest/10 text-landing-forest text-xs font-medium">
          Building Your Research
        </div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Using the PM Board
        </h1>
        <p className="text-lg text-gray-600">
          Track your interviews and opportunities with a Kanban-style board.
        </p>
      </header>

      <hr className="border-gray-100" />

      {/* Content */}
      <div className="space-y-8">
        {/* What is the PM Board */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">What is the PM Board?</h2>
          <p className="text-gray-600">
            The PM Board is a Trello-style Kanban board that helps you visualize and manage the progress of your interviews and opportunities. It provides a drag-and-drop interface to move items through different stages.
          </p>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800">
              <strong>Pro tip:</strong> Use the PM Board for a quick overview of your research progress without diving into individual pages.
            </p>
          </div>
        </section>

        {/* Board Columns */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">Board Columns</h2>
          <p className="text-gray-600">
            The board is organized into columns representing different stages:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li><strong>Pending</strong> — Interviews created but not yet started</li>
              <li><strong>Active</strong> — Interviews currently in progress</li>
              <li><strong>Completed</strong> — Finished interviews ready for synthesis</li>
              <li><strong>Synthesized</strong> — Interviews with generated snapshots</li>
            </ul>
          </div>
        </section>

        {/* Using Drag and Drop */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">Drag and Drop</h2>
          <p className="text-gray-600">
            Move cards between columns by dragging them. The board uses the @dnd-kit library for smooth, accessible drag-and-drop interactions.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">To move a card:</p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Click and hold on a card</li>
              <li>Drag it to the desired column</li>
              <li>Release to drop it in place</li>
            </ol>
          </div>
        </section>

        {/* Card Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">Card Information</h2>
          <p className="text-gray-600">
            Each card shows key information at a glance:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>Participant Name</strong> — Who the interview is with</li>
              <li><strong>Status Badge</strong> — Current stage</li>
              <li><strong>Date</strong> — When the interview was created/completed</li>
              <li><strong>Quick Actions</strong> — Links to transcript, snapshot, etc.</li>
            </ul>
          </div>
        </section>

        {/* Accessing the Board */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">Accessing the Board</h2>
          <p className="text-gray-600">
            Navigate to the PM Board from your project:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 ml-4">
            <li>Open your project from the dashboard</li>
            <li>Click the <strong>&quot;Board&quot;</strong> tab in the project navigation</li>
            <li>View and manage all interviews in one place</li>
          </ol>
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
          href="/dashboard/docs/ost"
          className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
              Building Your OST
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


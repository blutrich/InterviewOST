import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="text-center space-y-4 py-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          AI Interviewer Docs
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          AI-powered customer interviews following Teresa Torres&apos; Continuous Discovery methodology.
        </p>
      </header>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/docs/quick-start"
          className="group p-5 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-landing-forest/10">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
                Quick Start
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Run your first AI interview in 5 minutes.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/docs/ai-agents"
          className="group p-5 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-landing-forest/10">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
                AI Agents
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                How the 5 AI agents work together.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/docs/glossary"
          className="group p-5 rounded-xl border border-gray-200 hover:border-landing-forest/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-landing-forest/10">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
                Glossary
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Key terms and Teresa Torres concepts.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <hr className="border-gray-100" />

      {/* All Pages */}
      <div className="space-y-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          All Documentation
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Getting Started
            </h3>
            <div className="space-y-1">
              <PageLink
                href="/dashboard/docs/quick-start"
                title="Quick Start"
                description="Create a project and run your first interview"
              />
              <PageLink
                href="/dashboard/docs/glossary"
                title="Glossary"
                description="Teresa Torres terms and methodology concepts"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Building Your Research
            </h3>
            <div className="space-y-1">
              <PageLink
                href="/dashboard/docs/ai-agents"
                title="Using AI Agents"
                description="5 agents: Project Generator, Planner, Interviewer, Synthesizer, Mapper"
              />
              <PageLink
                href="/dashboard/docs/creating-templates"
                title="Creating Templates"
                description="Story-based interview rubrics"
              />
              <PageLink
                href="/dashboard/docs/managing-interviews"
                title="Managing Interviews"
                description="Share links, track status, review transcripts"
              />
              <PageLink
                href="/dashboard/docs/snapshots"
                title="Working with Snapshots"
                description="Experience maps, quotes, facts, and blind spots"
              />
              <PageLink
                href="/dashboard/docs/ost"
                title="Building Your OST"
                description="Opportunity Solution Tree visualization"
              />
              <PageLink
                href="/dashboard/docs/board"
                title="Using the PM Board"
                description="Kanban-style project management"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Community & Support
            </h3>
            <div className="space-y-1">
              <PageLink
                href="/dashboard/docs/troubleshooting"
                title="Troubleshooting"
                description="Common issues and solutions"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div>
        <span className="text-sm font-medium text-gray-900 group-hover:text-landing-forest transition-colors">
          {title}
        </span>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-landing-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

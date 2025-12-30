"use client";

import { useState, useEffect, useRef, useMemo } from "react";
// useEffect is used in DocsSearchModal below
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  title: string;
  section: string;
  href: string;
  content: string;
  matchedText: string;
}

// All docs content indexed for search
const docsIndex = [
  {
    title: "Quick Start",
    section: "Getting Started",
    href: "/dashboard/docs/quick-start",
    content: "Create project generate interview template run AI-powered customer interview 5 minutes dashboard new project research goal planner agent story-based rubric Teresa Torres methodology interviews tab new interview unique shareable link participant transcript generate snapshot synthesizer agent experience map quote reel facts blind spots OST opportunity solution tree mapper agent",
  },
  {
    title: "AI Agents",
    section: "Building Your Research",
    href: "/dashboard/docs/ai-agents",
    content: "Project Generator Agent transforms simple descriptions structured projects research goals target audience desired outcome OST root behavior-focused measurable behavior change Planner Agent story-based interview rubrics Stories over Opinions Teresa Torres excavate specific past experiences introduction story excavation questions follow-ups probes redirect prompts closing remarks Interviewer Agent real-time customer interviews never accepts vague answers probing story arc context actions outcomes active listening separates facts from opinions Synthesizer Agent Interview Snapshots 15 minutes experience map quote reel facts extraction blind spots Mapper Agent extracts opportunities approved snapshots Opportunity Solution Tree human approval pain points unmet needs workarounds duplicates",
  },
  {
    title: "Glossary",
    section: "Getting Started",
    href: "/dashboard/docs/glossary",
    content: "Continuous Discovery Teresa Torres product discovery framework small research activities every week customers Experience Map visual representation user journey phases actions thoughts feelings Interview Snapshot structured summary 15 minutes experience map quote reel facts blind spots Opportunity unmet need pain point desire customer research OST Opportunity Solution Tree visual framework business outcomes opportunities solutions Quote Reel verbatim quotes categorized theme Rubric interview guide core questions follow-up probes redirects Story Excavation specific past experiences Tell me about the last time Stories Over Opinions specific stories actual behavior Blind Spot topics not explored gaps understanding",
  },
  {
    title: "Creating Templates",
    section: "Building Your Research",
    href: "/dashboard/docs/creating-templates",
    content: "interview templates rubrics guide AI Interviewer project multiple templates active template new interviews Teresa Torres story-based interviewing What features do you want Tell me about the last time Templates tab Generate Template Planner Agent rubric research goal review approve edit Template Structure introduction story questions follow-ups probes vague answer redirects closing editing templates before after approval Edit Rubric JSON structure changes don't affect interviews already started",
  },
  {
    title: "Managing Interviews",
    section: "Building Your Research",
    href: "/dashboard/docs/managing-interviews",
    content: "interview links track participant progress review completed transcripts Interviews tab New Interview copy generated link share participant unique single-use name AI-guided conversation Interview Status pending link created waiting active currently in interview completed finished normally Reviewing Transcripts full transcript every message AI Interviewer participant Generate Snapshot extract insights Sharing links any device modern browser no account needed",
  },
  {
    title: "Working with Snapshots",
    section: "Building Your Research",
    href: "/dashboard/docs/snapshots",
    content: "Interview Snapshots structured summaries key insights 15 minutes Generate Snapshot completed interview Synthesizer Agent analyzes transcript review approve OST Experience Map journey participant story phases actions thoughts feelings Quote Reel verbatim quotes organized category participant exact words Facts objective verifiable data points Blind Spots topics not explored improve future interviews gaps understanding Approving Snapshots Mapper Agent suggest opportunities",
  },
  {
    title: "Building Your OST",
    section: "Building Your Research",
    href: "/dashboard/docs/ost",
    content: "Opportunity Solution Tree OST visual framework organizing customer opportunities connecting solutions Teresa Torres business outcomes customer opportunities potential solutions desired outcome branches opportunities discovered research Tree tab root research goal opportunities unmet needs pain points workarounds evidence items quotes interviews Adding Opportunities Mapper Agent suggests opportunities approve snapshot accept reject manually create Organizing Tree drag reorganize parent-child relationships broad opportunity specific opportunities Viewing Evidence click opportunity evidence panel verbatim quotes customer context",
  },
  {
    title: "Using the PM Board",
    section: "Building Your Research",
    href: "/dashboard/docs/board",
    content: "PM Board Kanban Trello drag drop interviews opportunities progress stages pending active completed synthesized cards columns @dnd-kit participant name status badge date quick actions transcript snapshot project management workflow visualization track research",
  },
  {
    title: "Troubleshooting",
    section: "Community & Support",
    href: "/dashboard/docs/troubleshooting",
    content: "Interview link not working already used single-use create new interview Template generation failed project research goal Planner Agent context refresh page Snapshot generation taking too long long interviews many messages refresh try again Opportunities not appearing OST approve snapshot first approved snapshots Mapper Agent AI interviewer ending too early covers core questions longer interviews add topics template rubric Participant can't access interview stable internet connection modern browser new interview link Experience map looks incomplete Synthesizer creates based on discussed short interviews Can't see projects logged in same account",
  },
];

export function DocsSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Compute search results as derived state (no separate state needed)
  const results = useMemo(() => {
    if (query.length < 2) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(" ").filter(t => t.length > 1);

    const matches: SearchResult[] = [];

    for (const doc of docsIndex) {
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      // Check if any search term matches
      const hasMatch = searchTerms.some(term =>
        titleLower.includes(term) || contentLower.includes(term)
      );

      if (hasMatch) {
        // Find the matched text for preview
        let matchedText = "";
        for (const term of searchTerms) {
          const index = contentLower.indexOf(term);
          if (index !== -1) {
            const start = Math.max(0, index - 30);
            const end = Math.min(doc.content.length, index + term.length + 50);
            matchedText = (start > 0 ? "..." : "") +
              doc.content.slice(start, end) +
              (end < doc.content.length ? "..." : "");
            break;
          }
        }

        matches.push({
          title: doc.title,
          section: doc.section,
          href: doc.href,
          content: doc.content,
          matchedText: matchedText || doc.content.slice(0, 80) + "...",
        });
      }
    }

    return matches;
  }, [query]);

  // Clamp selectedIndex to valid range (derived, not state update)
  const clampedSelectedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[clampedSelectedIndex]) {
      e.preventDefault();
      router.push(results[clampedSelectedIndex].href);
      setQuery("");
      setIsOpen(false);
      onClose?.();
    } else if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
      onClose?.();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search docs..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-landing-forest/20 focus:border-landing-forest/30 transition-all placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <Link
                key={result.href}
                href={result.href}
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                  onClose?.();
                }}
                className={`block px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                  index === clampedSelectedIndex ? "bg-landing-forest/5" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{result.section}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-sm font-medium text-gray-900">{result.title}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{result.matchedText}</p>
              </Link>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>↑↓ to navigate</span>
            <span>Enter to select • Esc to close</span>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50">
          <p className="text-sm text-gray-500 text-center">No results for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

// Modal version for mobile/full-screen search
export function DocsSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div 
        ref={modalRef}
        className="absolute top-4 left-4 right-4 md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl"
      >
        <div className="p-4">
          <DocsSearch onClose={onClose} />
        </div>
      </div>
    </div>
  );
}


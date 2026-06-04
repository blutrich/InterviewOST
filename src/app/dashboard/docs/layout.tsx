"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DocsSearch, DocsSearchModal } from "@/components/docs/DocsSearch";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Quick Start", href: "/dashboard/docs/quick-start" },
      { title: "Glossary", href: "/dashboard/docs/glossary" },
    ],
  },
  {
    title: "Building Your Research",
    items: [
      { title: "Using AI Agents", href: "/dashboard/docs/ai-agents" },
      { title: "Creating Templates", href: "/dashboard/docs/creating-templates" },
      { title: "Managing Interviews", href: "/dashboard/docs/managing-interviews" },
      { title: "Working with Snapshots", href: "/dashboard/docs/snapshots" },
      { title: "Building Your OST", href: "/dashboard/docs/ost" },
      { title: "Using the PM Board", href: "/dashboard/docs/board" },
    ],
  },
  {
    title: "Community & Support",
    items: [
      { title: "Troubleshooting", href: "/dashboard/docs/troubleshooting" },
    ],
  },
];

function getCurrentSection(pathname: string) {
  for (const section of navigation) {
    for (const item of section.items) {
      if (pathname === item.href) {
        return { section: section.title, page: item.title };
      }
    }
  }
  return null;
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const current = getCurrentSection(pathname);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Search Modal */}
      <DocsSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button - visible on mobile/tablet only */}
            <button
              onClick={() => setNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/dashboard/docs" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-landing-forest flex items-center justify-center">
                <span className="text-white font-serif text-sm font-medium">D</span>
              </div>
              <span className="text-sm font-medium text-gray-900 hidden sm:block">Docs</span>
            </Link>

            {/* Current page indicator */}
            {current && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-gray-600">{current.page}</span>
              </div>
            )}
          </div>

          {/* Search bar - desktop */}
          <div className="flex-1 max-w-md hidden md:block">
            <DocsSearch />
          </div>

          <div className="flex items-center gap-3">
            {/* Search button - mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Search docs"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            <span className="hidden sm:block text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">⌘K</span>
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <Link href="/dashboard/docs" className="flex items-center gap-2" onClick={() => setNavOpen(false)}>
                <div className="w-7 h-7 rounded-lg bg-landing-forest flex items-center justify-center">
                  <span className="text-white font-serif text-sm font-medium">D</span>
                </div>
                <span className="text-sm font-medium text-gray-900">AI Interviewer</span>
              </Link>
              <button 
                onClick={() => setNavOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-4 space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h4 className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                    </svg>
                    {section.title}
                  </h4>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setNavOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                            pathname === item.href
                              ? "bg-landing-forest/10 text-landing-forest font-medium"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Desktop Sidebar - always visible on lg+ */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-100 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <h4 className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                          pathname === item.href
                            ? "bg-landing-forest/10 text-landing-forest font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-100 py-6">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Dashboard
                </Link>
              </div>
              <span className="text-xs text-gray-400">AI Interviewer</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

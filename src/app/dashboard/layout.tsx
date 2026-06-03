import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U";

  return (
    <div className="theme-base44 min-h-screen grain">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-landing-charcoal/5 bg-landing-ivory/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/base44-mark.svg"
                alt="Base44"
                className="w-9 h-9 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="text-landing-charcoal font-medium tracking-tight text-sm">
                  Discovery
                </span>
                <span className="text-landing-stone font-light tracking-tight text-sm ml-1">
                  Co-Pilot
                </span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-[13px] text-landing-stone hover:text-landing-charcoal transition-colors uppercase tracking-wider"
              >
                Projects
              </Link>
              <Link
                href="/dashboard/docs"
                className="text-[13px] text-landing-stone hover:text-landing-charcoal transition-colors uppercase tracking-wider"
              >
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* New Project Button */}
            <Link
              href="/dashboard/projects/new"
              className="hidden sm:flex items-center gap-2 h-9 px-4 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Project
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 h-9 pl-3 pr-1 rounded-full border border-landing-charcoal/10 hover:border-landing-charcoal/20 hover:bg-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-landing-forest/20">
                  <span className="text-[13px] text-landing-stone hidden sm:block">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-landing-forest flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{initials}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-landing-charcoal/10 shadow-xl rounded-xl p-1">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-landing-charcoal">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-landing-stone truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-landing-charcoal/5" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-landing-stone hover:text-landing-charcoal hover:bg-landing-mist focus:bg-landing-mist">
                  <Link href="/settings" className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-landing-charcoal/5" />
                <form action={signOut}>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-landing-terracotta hover:text-landing-terracotta hover:bg-landing-terracotta/5 focus:bg-landing-terracotta/5">
                    <button className="w-full flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

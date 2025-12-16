import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header, Hero, Features, CTA, Footer } from "@/components/landing";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is logged in - redirect to dashboard
    redirect("/dashboard");
  }

  // Not logged in - show landing page
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}

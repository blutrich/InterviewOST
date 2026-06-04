import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base44 design system fonts (referenced inside the `.theme-base44` scope)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const stkMiso = localFont({
  variable: "--font-stk-miso",
  src: [
    { path: "./fonts/STKMiso-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/STKMiso-Regular.ttf", weight: "400", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Base44 Interviewer",
  description:
    "AI-powered interview platform for continuous product discovery using Teresa Torres methodology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`theme-base44 ${geistSans.variable} ${geistMono.variable} ${inter.variable} ${stkMiso.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

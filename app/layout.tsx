import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SlimFooter from "./components/SlimFooter";
import ClientProviders from "./components/ClientProviders";
import ImpersonationBanner from "./components/ImpersonationBanner";
import ConsentGatedScripts from "./components/ConsentGatedScripts";
import CookieConsent from "./components/CookieConsent";
import { getImpersonationState } from "@/lib/impersonation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOYA — Global Online Yoga Association",
  description: "Connecting yoga teachers, students, schools, and wellness practitioners worldwide.",
  icons: {
    icon: "/images/Favicon.png",
  },
};

// ─── Analytics settings fetch (cached 1 hour) ─────────────────────────────────

async function getAnalyticsSettings(): Promise<Record<string, string> | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const url = `${supabaseUrl}/rest/v1/site_settings?key=in.(ga4_measurement_id,clarity_project_id,analytics_enabled)&select=key,value`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ key: string; value: string }>;
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value ?? ''; });
    return map;
  } catch {
    return null;
  }
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const hideNav = pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/sign-in") || pathname.startsWith("/forgot-password") || pathname.startsWith("/maintenance");
  const hideFooter = pathname.startsWith("/maintenance") || pathname.startsWith("/members") || pathname.startsWith("/sign-in") || pathname.startsWith("/forgot-password") || pathname.startsWith("/register") || pathname.startsWith("/login") || pathname.startsWith("/onboarding");
  const fullFooterPaths = ["/", "/privacy", "/terms", "/code-of-conduct", "/code-of-ethics"];
  const showFullFooter = !hideFooter && fullFooterPaths.includes(pathname);
  const showSlimFooter = !hideFooter && !showFullFooter;

  const settings = await getAnalyticsSettings();
  const analyticsEnabled = settings?.analytics_enabled === 'true';
  const ga4Id     = analyticsEnabled ? (settings?.ga4_measurement_id     ?? '') : '';
  const clarityId = analyticsEnabled ? (settings?.clarity_project_id     ?? '') : '';

  const impersonationState = await getImpersonationState();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground flex flex-col`}
      >
        <ClientProviders impersonationState={impersonationState}>
          {/* Analytics scripts — gated behind cookie consent */}
          <ConsentGatedScripts ga4Id={ga4Id} clarityId={clarityId} />

          <ImpersonationBanner state={impersonationState} />
          {!hideNav && <Header />}
          <main className={`${!hideNav ? (impersonationState.isImpersonating ? 'pt-26' : 'pt-16') : ''} flex-1`}>
            {children}
          </main>
          {showFullFooter && <Footer />}
          {showSlimFooter && <SlimFooter />}

          {/* Cookie consent banner + floating button */}
          <CookieConsent />
        </ClientProviders>

        {/* Vercel Analytics — always on (necessary/first-party) */}
        <Analytics />
      </body>
    </html>
  );
}

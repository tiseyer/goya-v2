import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers, cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
// SlimFooter removed — footer only on landing + legal pages
import ClientProviders from "./components/ClientProviders";
import ImpersonationBanner from "./components/ImpersonationBanner";
import ConsentGatedScripts from "./components/ConsentGatedScripts";
import CookieConsent from "./components/CookieConsent";
import ChatWidgetLoader from "./components/chat/ChatWidgetLoader";
import { getImpersonationState } from "@/lib/impersonation";
import ThemeColorProvider from "@/app/components/ThemeColorProvider";
import { DeviceFingerprintSetter } from "@/app/components/DeviceFingerprintSetter";

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
  const isAdmin = pathname.startsWith('/admin')
  const hideNav = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/sign-in") || pathname.startsWith("/forgot-password") || pathname.startsWith("/maintenance");
  const footerPaths = ["/", "/privacy", "/terms", "/code-of-conduct", "/code-of-ethics", "/standards"];
  const showFooter = footerPaths.includes(pathname);

  const settings = await getAnalyticsSettings();
  const analyticsEnabled = settings?.analytics_enabled === 'true';
  const ga4Id     = analyticsEnabled ? (settings?.ga4_measurement_id     ?? '') : '';
  const clarityId = analyticsEnabled ? (settings?.clarity_project_id     ?? '') : '';

  const impersonationState = await getImpersonationState();

  const cookieStore = await cookies();
  const isPasswordResetLocked = cookieStore.get('password_reset_pending')?.value === 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <ThemeColorProvider />
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground flex flex-col`}
      >
        <ClientProviders impersonationState={impersonationState}>
          <DeviceFingerprintSetter />
          {/* Analytics scripts — gated behind cookie consent */}
          <ConsentGatedScripts ga4Id={ga4Id} clarityId={clarityId} />

          <ImpersonationBanner state={impersonationState} />
          {isPasswordResetLocked ? (
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e2e56] border-b border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/GOYA Logo White.png" alt="GOYA" className="h-8" />
              </div>
            </header>
          ) : !hideNav ? (
            <Header />
          ) : null}
          <main className={`${isPasswordResetLocked ? 'pt-16' : !hideNav ? (impersonationState.isImpersonating ? 'pt-26' : 'pt-16') : ''} flex-1`}>
            {children}
          </main>
          {!isPasswordResetLocked && showFooter && <Footer />}

          {/* Chat widget — hidden on admin pages and password reset, lazy-loaded */}
          {!isAdmin && !isPasswordResetLocked && <ChatWidgetLoader />}

          {/* Cookie consent banner + floating button */}
          {!isAdmin && !isPasswordResetLocked && <CookieConsent />}
        </ClientProviders>

        {/* Vercel Analytics — always on (necessary/first-party) */}
        <Analytics />
      </body>
    </html>
  );
}

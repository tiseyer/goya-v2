import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ClientProviders from "./components/ClientProviders";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("next-url") || "";
  const hideNav = pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-slate-50 text-slate-900 flex flex-col`}
      >
        <ClientProviders>
          {!hideNav && <Header />}
          <main className={`${!hideNav ? "pt-16" : ""} flex-1`}>
            {children}
          </main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}

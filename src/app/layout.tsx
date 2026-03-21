import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const brandName = settings.brandName || 'Micro License System';
  const description = settings.appDescription || "Advanced license management platform for Windows and Office keys.";
  const themeColor = settings.primaryColor || '#3b82f6';

  return {
    title: {
      default: `${brandName} - Premium Software Keys`,
      template: `%s | ${brandName}`,
    },
    description,
    keywords: ['licencias', 'software', 'Windows', 'Office', 'keys', 'activación', brandName],
    robots: {
      index: false,       // Panel privado — no indexar por defecto
      follow: false,
    },
    openGraph: {
      title: `${brandName} - Premium Software Keys`,
      description,
      type: 'website',
      locale: 'es_MX',
      siteName: brandName,
    },
    twitter: {
      card: 'summary',
      title: `${brandName} - Premium Software Keys`,
      description,
    },
    other: {
      'theme-color': themeColor,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

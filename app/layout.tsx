import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./contexts/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mister White Game - Juego Multijugador Online",
  description: "Juega Mister White con tus amigos. Un emocionante juego de deducción social donde debes descubrir quién es el espía.",
  keywords: ["juego", "multijugador", "online", "deducción", "social", "amigos", "familia"],
  authors: [{ name: "Mister White Game Team" }],
  creator: "Mister White Game Team",
  publisher: "Mister White Game",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Mister White Game",
    description: "Juego multijugador online de deducción social",
    type: "website",
    locale: "es_ES",
    siteName: "Mister White Game",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mister White Game",
    description: "Juego multijugador online de deducción social",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-white dark:bg-slate-950 transition-colors`}>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

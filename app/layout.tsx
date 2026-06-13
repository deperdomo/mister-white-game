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
  title: "Mister White - Juego Multijugador Online Gratis | Deducción Social",
  description: "🎭 Juego GRATIS de deducción social para 3-20 jugadores. ¡Descubre al espía antes de que te descubran! Sin descargas, multijugador en tiempo real. Perfecto para fiestas y reuniones.",
  keywords: ["juego gratis", "multijugador online", "juego de mesa", "deducción", "social", "amigos", "familia", "fiesta", "sin descarga", "navegador", "espía", "mister white", "party game"],
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
    title: "Mister White - Juego Multijugador Online Gratis",
    description: "🎭 El mejor juego de deducción social online. 3-20 jugadores, sin descargas, multijugador en tiempo real. ¡Descubre al espía!",
    type: "website",
    locale: "es_ES",
    siteName: "Mister White Game",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mister White - Juego de deducción social",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mister White - Juego Multijugador Online Gratis",
    description: "🎭 El mejor juego de deducción social online. ¡Descubre al espía antes de que te descubran!",
    images: ["/og-image.png"],
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
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/detective.png', type: 'image/png' },
    ],
    apple: '/detective.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased min-h-screen transition-colors bg-slate-950`}>
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

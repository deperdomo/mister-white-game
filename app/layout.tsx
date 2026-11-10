import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./contexts/ToastContext";
import { NavigationGuardProvider } from "./contexts/NavigationGuardContext";
import { SITE_URL } from "./lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });

const description = "Juego de deducción social gratis para 3 a 20 jugadores. Da pistas, descubre al impostor y juega online o pasando el móvil. Sin descargas.";
const shareTitle = "Mister White: ¿quién está fingiendo?";

export const metadata: Metadata = {
  title: "Mister White: juego de deducción social gratis para móvil",
  description,
  authors: [{ name: "Mister White Game Team" }],
  creator: "Mister White Game Team",
  publisher: "Mister White Game",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: shareTitle,
    description,
    url: "/",
    type: "website",
    locale: "es_ES",
    siteName: "Mister White",
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
    title: shareTitle,
    description,
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
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" data-design="new">
      <body className={`${figtree.variable} ${bricolage.variable} antialiased min-h-screen bg-ink`}>
        <ToastProvider>
          <NavigationGuardProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </NavigationGuardProvider>
        </ToastProvider>
        {/* Cloudflare Web Analytics */}
        <script defer type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "a44ce64460a84a7b84e841641b875e54"}'></script>
        {/* End Cloudflare Web Analytics */}
      </body>
    </html>
  );
}

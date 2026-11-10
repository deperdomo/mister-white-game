import type { Metadata } from "next";

// Vista previa del enlace que comparte el anfitrión (/join-room?code=...)
const title = "Te han invitado a jugar a Mister White";
const description = "Entra en la sala desde tu móvil y descubre quién está fingiendo. Gratis y sin descargas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/join-room" },
  openGraph: {
    title,
    description,
    url: "/join-room",
    type: "website",
    locale: "es_ES",
    siteName: "Mister White",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Mister White - Juego de deducción social" }],
  },
};

export default function JoinRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}

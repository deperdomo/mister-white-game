import { Metadata } from 'next'

type Props = {
  params: Promise<{ roomCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomCode } = await params

  return {
    title: `Sala ${roomCode} - Mister White Game`,
    description: `🎭 Únete a la sala ${roomCode} en Mister White! Juego multijugador online de deducción social. ¡Descubre al espía antes de que te descubran!`,
    openGraph: {
      title: `🕵️ Sala ${roomCode} - Mister White`,
      description: `Únete a esta partida de Mister White! Sala: ${roomCode}. Juego de deducción social multijugador online.`,
      type: 'website',
      locale: 'es_ES',
      siteName: 'Mister White Game',
      images: [
        {
          url: '/detective.png',
          width: 512,
          height: 512,
          alt: `Mister White - Sala ${roomCode}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `🕵️ Sala ${roomCode} - Mister White`,
      description: `Únete a esta partida de Mister White! Código de sala: ${roomCode}`,
      images: ['/detective.png'],
    },
  }
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

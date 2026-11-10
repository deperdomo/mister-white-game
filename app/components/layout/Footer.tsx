'use client';

import { usePathname } from 'next/navigation';
import { Github } from 'lucide-react';
import InvitePanel from './InvitePanel';

const version = process.env.NEXT_PUBLIC_APP_VERSION;

export default function Footer() {
  // Durante la partida solo importa la carta
  const pathname = usePathname();
  if (pathname.startsWith('/local-game') || pathname.startsWith('/room/')) return null;

  // Diseño nuevo: las pantallas de preparación van sin pie, como una app
  const setup = ['/local', '/waiting-room', '/create-room', '/join-room'].includes(pathname);

  return (
    <footer className={`border-t border-white/[0.06] bg-ink ${setup ? 'nd:hidden' : ''}`}>
      <div className="container mx-auto max-w-screen-xl px-4 py-10">
        {/* Invitar a jugar (solo en la página principal) */}
        <InvitePanel />

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Mister White
            <span className="text-faint"> · v{version}</span>
          </p>

          <a
            href="https://github.com/deperdomo/mister-white-game"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Código en GitHub"
            className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

import { Home, Users } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '../ui/logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-fg transition-opacity hover:opacity-80"
        >
          <Logo className="h-8 w-8" />
          <span>Mister White</span>
        </Link>

        {/* Navegación */}
        <nav className="hidden sm:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Inicio
          </Link>
          <Link
            href="/local"
            className="text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Juego local
          </Link>
          <Link
            href="/create-room"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 px-4 text-sm font-medium text-fg ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10"
          >
            <Users className="h-4 w-4" />
            Crear sala
          </Link>
        </nav>

        {/* Navegación móvil */}
        <nav className="flex sm:hidden items-center gap-1">
          <Link
            href="/"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg"
            aria-label="Inicio"
          >
            <Home className="h-5 w-5" />
          </Link>
          <Link
            href="/create-room"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg"
            aria-label="Crear sala"
          >
            <Users className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

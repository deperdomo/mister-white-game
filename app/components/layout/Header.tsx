import { GamepadIcon, Home, Users } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 font-bold text-xl text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <GamepadIcon className="h-6 w-6" />
          <span>Mister White</span>
        </Link>

        {/* Navegación */}
        <nav className="hidden sm:flex items-center space-x-6">
          <Link 
            href="/" 
            className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Inicio</span>
          </Link>
          <Link 
            href="/create-room" 
            className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Crear Sala</span>
          </Link>
        </nav>

        {/* Navegación móvil */}
        <nav className="flex sm:hidden items-center space-x-4">
          <Link 
            href="/" 
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            aria-label="Inicio"
          >
            <Home className="h-5 w-5" />
          </Link>
          <Link 
            href="/create-room" 
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            aria-label="Crear Sala"
          >
            <Users className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container mx-auto max-w-screen-xl px-4 py-8">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          {/* Información del proyecto */}
          <div className="flex flex-col items-center space-y-2 sm:items-start">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2025 Mister White Game. Hecho con{' '}
              <Heart className="inline h-4 w-4 text-red-500" />{' '}
              para la diversión.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Next.js 14 • TypeScript • Tailwind CSS • Supabase • Pusher
            </p>
          </div>

          {/* Enlaces */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Este juego es una versión digital del clásico juego de mesa.
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>
              Disfruta jugando con amigos y familia.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink">
      <div className="container mx-auto max-w-screen-xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Información del proyecto */}
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <p className="text-sm text-muted">
              © 2025 Mister White. Hecho con{' '}
              <Heart className="inline h-4 w-4 text-accent" />{' '}
              para la diversión.
            </p>
            <p className="text-xs text-faint">
              Next.js • TypeScript • Tailwind CSS • Supabase • Pusher
            </p>
          </div>

          {/* Enlaces */}
          <a
            href="https://github.com/deperdomo/mister-white-game"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <p className="text-center text-xs text-faint">
            Una versión digital del clásico juego de mesa.
            <span className="hidden sm:inline"> · </span>
            <br className="sm:hidden" />
            Disfruta jugando con amigos y familia.
          </p>
        </div>
      </div>
    </footer>
  );
}

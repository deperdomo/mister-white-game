'use client';

import type { Role } from '../../lib/game-logic';

const ROLE_INFO: Record<Role, { title: string; description: string; tint: string }> = {
  civil: {
    title: 'Civil',
    description: 'Da pistas de tu palabra sin decirla y descubre a los impostores.',
    tint: 'bg-sky-500/10 text-sky-300',
  },
  undercover: {
    title: 'Undercover',
    description: 'Tu palabra es parecida pero distinta. Que no te descubran.',
    tint: 'bg-purple-500/10 text-purple-300',
  },
  mister_white: {
    title: 'Mr. White',
    description: 'No tienes palabra. Escucha las pistas e intenta deducirla.',
    tint: 'bg-rose-500/10 text-rose-300',
  },
  payaso: {
    title: 'Payaso',
    description: 'Conoces la palabra, pero haz que sospechen de ti como si fueras Mr. White.',
    tint: 'bg-orange-500/10 text-orange-300',
  },
};

interface RoleCardProps {
  name: string;
  role: Role;
  word: string | null;
  flipped: boolean;
  onFlip: () => void;
}

// Tarjeta giratoria: delante el nombre del jugador, detrás su rol y su palabra.
export default function RoleCard({ name, role, word, flipped, onFlip }: RoleCardProps) {
  const info = ROLE_INFO[role];
  const face = 'absolute inset-0 backface-hidden rounded-3xl border overflow-hidden flex flex-col';

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? 'Ocultar rol' : `Ver el rol de ${name}`}
      aria-pressed={flipped}
      className="relative block h-full w-full perspective-[1200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-3xl"
    >
      <div
        className={`relative h-full w-full transform-3d transition-transform duration-500 motion-reduce:transition-none ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* Delante: nombre */}
        <div className={`${face} card-back items-center justify-center gap-4 p-6 border-accent/30 bg-gradient-to-br from-accent/25 via-surface to-iris/20`}>
          <p className="nd-display nd-plate max-w-full text-[clamp(2.25rem,11vw,3.25rem)] font-bold leading-tight text-fg text-center break-words">{name}</p>
          <p className="nd-hint absolute bottom-5 inline-flex items-center rounded-full bg-white/5 px-3 py-1.5 text-sm text-muted">
            Toca para ver tu rol
          </p>
        </div>

        {/* Detrás: rol y palabra */}
        <div className={`${face} rotate-y-180 border-white/10 bg-surface`}>
          <div className={`px-5 py-4 text-center ${info.tint}`}>
            <p className="nd-display text-[2rem] leading-tight font-bold">{info.title}</p>
            <p className="mt-1 text-sm opacity-80">{info.description}</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
            {word ? (
              <>
                <p className="eyebrow">Tu palabra</p>
                <p className="nd-display text-[clamp(1.75rem,9vw,2.75rem)] font-bold leading-tight tracking-tight text-fg break-words">{word}</p>
              </>
            ) : (
              <p className="nd-display nd-tape text-5xl font-bold text-faint">???</p>
            )}
          </div>
          <p className="pb-3 text-center text-xs text-faint">Toca para ocultar</p>
        </div>
      </div>
    </button>
  );
}

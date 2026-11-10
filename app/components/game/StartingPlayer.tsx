import { Megaphone } from 'lucide-react';

// "Empieza X": quién da la primera pista esta ronda.
export default function StartingPlayer({ name }: { name: string }) {
  return (
    <div className="rounded-3xl border border-accent/30 bg-accent/10 p-6 text-center animate-fade-in">
      <Megaphone className="mx-auto mb-2 h-8 w-8 text-accent" />
      <p className="text-sm text-muted">Empieza a dar pistas</p>
      <p className="font-display text-[clamp(2rem,9vw,3rem)] font-extrabold leading-tight text-fg break-words">{name}</p>
    </div>
  );
}

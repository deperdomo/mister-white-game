'use client';

import { usePathname } from 'next/navigation';
import PlayLink from './PlayLink';

export default function InvitePanel() {
  const pathname = usePathname();

  // Solo se muestra en la página principal
  if (pathname !== '/') return null;

  return (
    <div className="mb-8 flex flex-col items-center gap-3 border-b border-white/[0.06] pb-8 text-center">
      <p className="text-sm font-medium text-fg">¿Listo para jugar? Invita a tus amigos</p>
      <PlayLink />
      <p className="text-xs text-faint">Copia el enlace y compártelo para empezar una partida</p>
    </div>
  );
}

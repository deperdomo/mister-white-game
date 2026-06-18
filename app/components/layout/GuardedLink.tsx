'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useNavigationGuard } from '../../contexts/NavigationGuardContext';

type GuardedLinkProps = ComponentProps<typeof Link> & { href: string };

/**
 * Igual que <Link>, pero si hay una partida en curso pide confirmación antes
 * de navegar (evita salir del juego por accidente desde el header).
 */
export function GuardedLink({ href, onClick, children, ...props }: GuardedLinkProps) {
  const router = useRouter();
  const { requestNavigation } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    // Respetar clic con modificadores, botón central, o si ya se canceló
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }

    e.preventDefault();
    requestNavigation(() => router.push(href));
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

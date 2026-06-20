'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

// ponytail: controlled popover instead of native title= because we need tap-to-show on mobile.
export function HelpTip({ text, label = 'Más información' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-faint transition-colors hover:text-fg"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-white/10 bg-elevated px-3 py-2 text-xs text-muted shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

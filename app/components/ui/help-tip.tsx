'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

// ponytail: controlled popover with measured fixed position so it never clips
// against a card edge, an overflow:hidden ancestor, or the viewport. Closes on
// outside click or scroll. Upgrade to CSS anchor positioning when it's broadly supported.
export function HelpTip({ text, label = 'Más información' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 224 });
  const ref = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    window.addEventListener('scroll', () => setOpen(false), { once: true });
    return () => document.removeEventListener('click', close);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = Math.min(224, window.innerWidth - 16);
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
      setPos({ top: r.bottom + 8, left, width });
    }
    setOpen((o) => !o);
  };

  return (
    <span ref={ref} className="inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={toggle}
        className="text-faint transition-colors hover:text-fg"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="fixed z-50 rounded-lg border border-white/10 bg-elevated px-3 py-2 text-xs text-muted shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

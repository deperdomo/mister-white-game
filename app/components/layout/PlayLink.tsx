'use client';

import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';

const PLAY_URL = 'https://mr-white.deiviperdomo.dev/';

export default function PlayLink() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    let ok = false;

    // Vía moderna: solo disponible en contextos seguros (HTTPS o localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(PLAY_URL);
        ok = true;
      } catch {
        ok = false;
      }
    }

    // Fallback para navegadores antiguos o contextos no seguros (http)
    if (!ok) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = PLAY_URL;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar enlace para invitar"
      aria-label="Copiar enlace del juego"
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-panel px-4 py-2 text-sm transition-colors hover:bg-elevated"
    >
      <Link2 className="h-4 w-4 shrink-0 text-accent" />
      <span className="truncate text-muted transition-colors group-hover:text-fg">
        mr-white.deiviperdomo.dev
      </span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-fg" />
      )}
    </button>
  );
}

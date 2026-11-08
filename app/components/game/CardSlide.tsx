'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// Al cambiar `slideKey`, la carta sale por la izquierda y la nueva entra por la derecha.
export default function CardSlide({ slideKey, children }: { slideKey: string | number; children: ReactNode }) {
  const offset = useReducedMotion() ? 0 : '120%';

  return (
    <div className="-mx-5 px-5 overflow-x-clip">
      {/* Altura según la pantalla: el botón de pasar debe verse sin hacer scroll */}
      <div className="relative mx-auto w-full max-w-xs h-[min(calc(100svh-19rem),26rem)] min-h-[17rem]">
        <AnimatePresence initial={false}>
          <motion.div
            key={slideKey}
            className="absolute inset-0"
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: `-${offset}` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

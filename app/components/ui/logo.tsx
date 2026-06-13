import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
}

/**
 * Marca de Mister White: un sombrero fedora minimalista sobre el
 * degradado azul→púrpura de la marca. Se usa en el Header y comparte
 * el mismo diseño que /public/logo.svg (favicon / Open Graph).
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="Mister White"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="mwLogoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#mwLogoBg)" />
      <path
        d="M92 318C150 302 362 302 420 318C430 321 430 332 420 336C380 350 132 350 92 336C82 332 82 321 92 318Z"
        fill="#ffffff"
      />
      <path
        d="M184 314L196 212C198 190 210 180 224 182C238 185 246 198 256 198C266 198 274 185 288 182C302 180 314 190 316 212L328 314Z"
        fill="#ffffff"
      />
      <path d="M188 288L324 288L327 311L185 311Z" fill="#0b1220" opacity="0.16" />
    </svg>
  );
}

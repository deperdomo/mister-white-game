import type { Metadata } from "next";
import { ArrowRight, Hash, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Logo } from "./components/ui/logo";
import { ShareButton } from "./components/ui/share-button";
import { SITE_URL } from "./lib/utils";

const steps = [
  {
    n: "1",
    title: "Recibe tu rol",
    body: "Civil, Undercover o Mister White. Solo tú ves tu carta… y el impostor no conoce la palabra.",
  },
  {
    n: "2",
    title: "Da una pista",
    body: "Una palabra relacionada con la secreta, sin delatarte. Todos a la vez: cuidado con pasarte de obvio.",
  },
  {
    n: "3",
    title: "Vota",
    body: "Señala al sospechoso. ¿Cae el impostor o se sale con la suya adivinando la palabra?",
  },
];

const modes = [
  {
    title: "Online",
    tagline: "Cada uno con su móvil, en tiempo real.",
    features: [
      "Hasta 20 jugadores simultáneos",
      "Salas privadas con código único",
      "Sincronización en tiempo real",
      "Roles avanzados: Undercover y Payaso",
    ],
  },
  {
    title: "En local",
    tagline: "Un solo móvil que pasa de mano en mano.",
    features: [
      "De 3 a 20 jugadores en persona",
      "No necesita conexión a internet",
      "Categorías y dificultad ajustables",
      "Ideal para fiestas y reuniones",
    ],
  },
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Nombre del sitio que Google muestra en los resultados
const websiteJsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Mister White", url: SITE_URL });

export default function HomePage() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] spotlight" />

        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="relative mx-auto max-w-3xl pt-16 pb-10 text-center sm:pt-28">
            <p className="eyebrow animate-fade-in">Juego de deducción social</p>

            <h1 className="nd-display animate-rise mt-5 text-balance text-5xl font-semibold leading-[1.02] tracking-display text-fg sm:text-6xl lg:text-7xl">
              Alguien está{" "}
              <span className="text-gradient">fingiendo</span>.
            </h1>

            <p className="animate-rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Da pistas, detecta al impostor y no dejes que te descubran.
              Mister White es el juego perfecto para fiestas y reuniones,
              de 3 a 20 jugadores.
            </p>

            <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/create-room" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Crear sala online
                </Button>
              </Link>
              <Link href="/local" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Jugar en local
                </Button>
              </Link>
            </div>

            <Link
              href="/join-room"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
            >
              <Hash className="h-4 w-4" />
              ¿Tienes un código? Únete a una sala
            </Link>
          </div>

          {/* Elemento firma: la carta con la palabra censurada */}
          <div className="relative mx-auto max-w-sm pb-12">
            <div className="nd-tilt animate-rise rounded-3xl border border-white/[0.08] bg-surface p-7 shadow-float">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Tu rol</span>
                <Logo className="h-7 w-7" />
              </div>

              <p className="nd-display mt-7 text-3xl font-semibold tracking-tight text-fg">
                Mister White
              </p>
              <p className="mt-1.5 text-sm text-muted">
                No conoces la palabra secreta.
              </p>

              <div className="mt-7">
                <p className="eyebrow mb-2">Palabra</p>
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-panel py-5">
                  <span className="nd-redact select-none text-xl font-semibold tracking-[0.35em] text-faint blur-[7px]">
                    SECRETO
                  </span>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted">
                Disimula. Que no te descubran.
              </p>
            </div>
          </div>

          {/* Línea de confianza, discreta */}
          <p className="pb-6 text-center text-sm text-faint">
            3–20 jugadores · ~15 min por partida · Sin descargas · Gratis
          </p>

        </div>
      </section>

      {/* ───────────────── Cómo se juega ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 py-14 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Cómo se juega
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            Tres pasos y un solo objetivo: que no te descubran.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="relative grid grid-cols-[2.75rem_1fr] gap-x-4 border-t border-white/10 pt-6 md:block">
              <span className="absolute -top-px left-0 h-0.5 w-14 bg-accent" />
              <span className="nd-display row-span-2 block text-6xl leading-none text-accent">
                {step.n}
              </span>
              <h3 className="md:mt-4 text-xl font-semibold tracking-tight text-fg">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────────── Vídeo tutorial ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 pb-14 pt-12 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
            Aprende a jugar en 40 segundos
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Todo lo que necesitas saber antes de tu primera partida. Sube el volumen.
          </p>
        </div>

        {/* Dos formatos: vertical en el móvil (donde se juega) y horizontal a partir de sm.
            preload="none": el que queda oculto no descarga nada. */}
        {[
          { file: "tutorial-vertical", box: "mx-auto max-w-sm sm:hidden", ratio: "aspect-[9/16]" },
          { file: "tutorial", box: "hidden sm:mx-auto sm:block sm:max-w-5xl", ratio: "aspect-video" },
        ].map((v) => (
          <div key={v.file} className={`mt-10 sm:mt-12 ${v.box}`}>
            <div className="overflow-hidden rounded-3xl border border-accent/40 bg-surface shadow-[0_40px_120px_-40px_rgba(255,182,39,0.45)]">
              <video
                className={`block w-full ${v.ratio}`}
                controls
                playsInline
                poster={`/video/${v.file}-poster.jpg`}
                preload="none"
              >
                <source src={`/video/${v.file}.mp4`} type="video/mp4" />
                Tu navegador no soporta videos HTML5.
              </video>
            </div>
          </div>
        ))}
      </section>

      {/* ───────────────── Modos de juego ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 py-14 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Elige cómo jugar
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            En la misma mesa o a distancia.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {modes.map((mode, i) => (
            <Card key={mode.title} className="flex flex-col p-7 sm:p-9">
              <h3 className="nd-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {mode.title}
              </h3>
              <p className="mt-2 text-base text-muted">{mode.tagline}</p>

              <ul className="mt-6 space-y-3 border-t border-white/[0.08] pt-6 text-base text-muted">
                {mode.features.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>

              {i === 0 ? (
                <div className="mt-auto flex gap-3 pt-8">
                  <Link href="/create-room" className="flex-1">
                    <Button size="lg" className="w-full px-4">Crear sala</Button>
                  </Link>
                  <Link href="/join-room" className="flex-1">
                    <Button variant="secondary" size="lg" className="w-full px-4">
                      Unirse
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-auto pt-8">
                  <Link href="/local">
                    <Button variant="secondary" size="lg" className="w-full px-4">
                      Empezar en local
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ───────────────── CTA final ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 pb-24 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface px-6 py-16 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 spotlight" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Reúne a tus amigos y empieza la partida.
            </h2>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/create-room" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Empezar a jugar
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <ShareButton
                className="w-full sm:w-auto"
                title="Mister White - Juego de deducción social"
                text="¡Descubre este juego de deducción social para jugar con amigos!"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

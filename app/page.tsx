import { Users, Monitor, ArrowRight, Hash, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { ShareButton } from "./components/ui/share-button";
import { Logo } from "./components/ui/logo";

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

export default function HomePage() {
  return (
    <div>
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] spotlight" />

        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="relative mx-auto max-w-3xl pt-20 pb-10 text-center sm:pt-28">
            <p className="eyebrow animate-fade-in">Juego de deducción social</p>

            <h1 className="animate-rise mt-5 text-balance text-5xl font-semibold leading-[1.02] tracking-display text-fg sm:text-6xl lg:text-7xl">
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
                  <Users className="h-5 w-5" />
                  Crear sala online
                </Button>
              </Link>
              <Link href="/local" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Monitor className="h-5 w-5" />
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
          <div className="relative mx-auto max-w-sm pb-16">
            <div className="animate-rise rounded-3xl border border-white/[0.08] bg-surface p-7 shadow-float">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Tu rol</span>
                <Logo className="h-7 w-7" />
              </div>

              <p className="mt-7 text-3xl font-semibold tracking-tight text-fg">
                Mister White
              </p>
              <p className="mt-1.5 text-sm text-muted">
                No conoces la palabra secreta.
              </p>

              <div className="mt-7">
                <p className="eyebrow mb-2">Palabra</p>
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-panel py-5">
                  <span className="select-none text-xl font-semibold tracking-[0.35em] text-faint blur-[7px]">
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
          <p className="pb-20 text-center text-sm text-faint">
            3–20 jugadores · ~15 min por partida · Sin descargas · Gratis
          </p>
        </div>
      </section>

      {/* ───────────────── Cómo se juega ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Cómo se juega</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Tres pasos. Una sola mentira que sostener.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-white/[0.06] bg-surface/60 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-sm font-semibold text-fg">
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-fg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Modos de juego ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Dos formas de jugar</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            En la misma mesa o a distancia.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Online */}
          <Card className="flex flex-col p-7">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-fg">
                  Online
                </h3>
                <p className="text-sm text-muted">
                  Cada quien en su pantalla, en tiempo real
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-muted">
              {[
                "Hasta 8 jugadores simultáneos",
                "Salas privadas con código único",
                "Sincronización en tiempo real",
                "Roles avanzados: Undercover y Payaso",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-3 pt-7">
              <Link href="/create-room" className="flex-1">
                <Button className="w-full">Crear sala</Button>
              </Link>
              <Link href="/join-room" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Unirse
                </Button>
              </Link>
            </div>
          </Card>

          {/* Local */}
          <Card className="flex flex-col p-7">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-fg">
                  Local
                </h3>
                <p className="text-sm text-muted">
                  Un solo dispositivo que va pasando de mano en mano
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm text-muted">
              {[
                "De 3 a 20 jugadores en persona",
                "No necesita conexión a internet",
                "Categorías y dificultad ajustables",
                "Ideal para fiestas y reuniones",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Link href="/local">
                <Button variant="secondary" className="w-full">
                  Empezar modo local
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ───────────────── Demo ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">En movimiento</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Míralo en acción
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Una partida completa en modo local, de principio a fin.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-float">
            <video
              className="aspect-video w-full"
              controls
              poster="/detective.jpg"
              preload="metadata"
            >
              <source src="/video/Tutorial_modo_local.mp4" type="video/mp4" />
              Tu navegador no soporta videos HTML5.
            </video>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA final ───────────────── */}
      <section className="container mx-auto max-w-screen-xl px-4 pb-24 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface px-6 py-16 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 spotlight" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Reúne a tus amigos y descubre quién sabe mentir mejor.
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

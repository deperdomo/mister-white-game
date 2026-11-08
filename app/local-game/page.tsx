'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { ArrowLeft, RotateCcw, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import RoleCard from "../components/game/RoleCard";
import CardSlide from "../components/game/CardSlide";
import StartingPlayer from "../components/game/StartingPlayer";
import { assignRoles, fetchWordPairs, pickStarter, wordFor, DEFAULT_SETTINGS, GameSettings, Role, WordPair } from "../lib/game-logic";
import { useNavigationGuard } from "../contexts/NavigationGuardContext";

interface RoundPlayer {
  name: string;
  role: Role;
  word: string | null;
}

interface Round {
  number: number;
  players: RoundPlayer[];
  starter: string;
}

function LocalGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGuard, requestNavigation } = useNavigationGuard();

  const [config, setConfig] = useState<{ players: string[]; settings: GameSettings } | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(false);
  const wordQueue = useRef<WordPair[]>([]);

  useEffect(() => {
    setGuard(!!round);
    return () => setGuard(false);
  }, [round, setGuard]);

  const startRound = useCallback(async (cfg: { players: string[]; settings: GameSettings }, number: number) => {
    const { difficulty, category } = cfg.settings;
    if (!wordQueue.current.length) wordQueue.current = await fetchWordPairs(difficulty, category);
    const pair = wordQueue.current.shift()!;

    const roles = assignRoles(cfg.players.length, cfg.settings);
    const players = cfg.players.map((name, i) => ({ name, role: roles[i], word: wordFor(roles[i], pair) }));

    setRound({
      number,
      players,
      starter: pickStarter(players, number - 1)?.name ?? players[0].name,
    });
    setRevealIndex(0);
    setFlipped(false);
    setSeen(false);
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(searchParams.get('config') ?? '');
      if (!Array.isArray(parsed.players) || parsed.players.length < 3) throw new Error('config');
      const cfg = { players: parsed.players as string[], settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
      setConfig(cfg);
      wordQueue.current = [];
      startRound(cfg, Number(parsed.nextRound) || 1);
    } catch {
      router.push('/local');
    }
  }, [searchParams, router, startRound]);

  const flip = () => {
    setFlipped((f) => !f);
    setSeen(true);
  };

  const next = () => {
    setRevealIndex((i) => i + 1);
    setFlipped(false);
    setSeen(false);
  };

  const editSettings = () => {
    if (!config || !round) return;
    const params = new URLSearchParams({ config: JSON.stringify({ ...config, nextRound: round.number + 1, isEditing: true }) });
    router.push(`/local?${params.toString()}`);
  };

  if (!round || !config) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-muted">Repartiendo roles…</p>
      </div>
    );
  }

  const revealing = revealIndex < round.players.length;
  const current = round.players[revealIndex];
  const nextPlayer = round.players[revealIndex + 1];

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2 h-11 w-11 p-0" onClick={() => requestNavigation(() => router.push('/local'))} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-fg">Ronda {round.number}</h1>
        {revealing && (
          <span className="ml-auto text-sm text-muted tabular-nums">
            {revealIndex + 1}/{round.players.length}
          </span>
        )}
      </div>

      {revealing ? (
        <div className="space-y-6">
          <p className="text-center text-muted">
            Pasa el móvil a <strong className="text-fg">{current.name}</strong>
          </p>
          <CardSlide slideKey={`${round.number}-${revealIndex}`}>
            <RoleCard name={current.name} role={current.role} word={current.word} flipped={flipped} onFlip={flip} />
          </CardSlide>
          {seen && !flipped && (
            <Button size="lg" className="w-full" onClick={next}>
              {nextPlayer ? `Pasar a ${nextPlayer.name}` : 'Empezar la ronda'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <StartingPlayer name={round.starter} />
          <Button size="lg" className="w-full" onClick={() => startRound(config, round.number + 1)}>
            <RotateCcw className="h-4 w-4" />
            Nueva ronda
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={editSettings}>
            <Settings className="h-4 w-4" />
            Cambiar jugadores o ajustes
          </Button>
        </div>
      )}
    </div>
  );
}

export default function LocalGamePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-md text-center text-muted">Cargando…</div>}>
      <LocalGameContent />
    </Suspense>
  );
}

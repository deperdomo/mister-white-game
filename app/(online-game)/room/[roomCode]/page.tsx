'use client';

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, RotateCcw, Settings } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { LoadingState } from "../../../components/ui/loading";
import RoleCard from "../../../components/game/RoleCard";
import CardSlide from "../../../components/game/CardSlide";
import StartingPlayer from "../../../components/game/StartingPlayer";
import { useOnlineGame } from "../../../hooks/useOnlineGame";
import { loadOnlineSettings, pickStarter, wordFor } from "../../../lib/game-logic";

function OnlineGameContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const playerName = searchParams.get('name') || '';

  const { room, players, loadRoomAndSubscribe, roomClosed, startRound, backToLobby, leaveRoom } = useOnlineGame();
  const [flippedRound, setFlippedRound] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadRoomAndSubscribe(roomCode);
    // Respaldo por si se pierde algún evento de Pusher
    const id = setInterval(() => loadRoomAndSubscribe(roomCode), 10000);
    return () => clearInterval(id);
  }, [roomCode, loadRoomAndSubscribe]);

  // El host volvió a la sala de espera
  useEffect(() => {
    if (room?.status === 'waiting') {
      router.replace(`/waiting-room?code=${roomCode}&name=${encodeURIComponent(playerName)}`);
    }
  }, [room?.status, router, roomCode, playerName]);

  if (roomClosed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="mb-4 text-muted">La sala se ha cerrado porque el anfitrión se desconectó</p>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    );
  }

  const me = players.find((p) => p.name === playerName);
  if (!room || !me || room.status !== 'playing') {
    return <LoadingState message="Cargando partida..." />;
  }

  if (!me.role) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-muted">Te has unido a mitad de ronda. Entrarás en la siguiente.</p>
      </div>
    );
  }

  const starter = pickStarter(players, room.currentRound - 1);
  const flipped = flippedRound === room.currentRound;

  const hostAction = async (action: () => Promise<boolean>) => {
    setBusy(true);
    await action();
    setBusy(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 h-11 w-11 p-0"
          onClick={() => {
            leaveRoom();
            router.push('/');
          }}
          aria-label="Salir"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-fg">Ronda {room.currentRound}</h1>
        <span className="ml-auto font-mono text-sm text-muted">{roomCode}</span>
      </div>

      <div className="space-y-6">
        <CardSlide slideKey={room.currentRound}>
          <RoleCard
            name={me.name}
            role={me.role}
            word={wordFor(me.role, { civilian: room.currentWord, undercover: room.undercoverWord })}
            flipped={flipped}
            onFlip={() => setFlippedRound(flipped ? null : room.currentRound)}
          />
        </CardSlide>

        {starter && <StartingPlayer name={starter.name} />}

        {me.isHost && (
          <div className="space-y-3">
            <Button size="lg" className="w-full" disabled={busy} onClick={() => hostAction(() => startRound(loadOnlineSettings()))}>
              <RotateCcw className="h-4 w-4" />
              Nueva ronda
            </Button>
            <Button size="lg" variant="secondary" className="w-full" disabled={busy} onClick={() => hostAction(backToLobby)}>
              <Settings className="h-4 w-4" />
              Cambiar ajustes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnlineGamePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OnlineGameContent />
    </Suspense>
  );
}

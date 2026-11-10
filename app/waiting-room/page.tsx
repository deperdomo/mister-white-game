'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Copy, Crown, Users, Share2, UserPlus, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useOnlineGame } from "../hooks/useOnlineGame";
import { LoadingState } from "../components/ui/loading";
import { useToast } from "../hooks/useToast";
import GameSettingsForm from "../components/game/GameSettingsForm";
import { loadOnlineSettings, saveOnlineSettings, GameSettings, MIN_PLAYERS } from "../lib/game-logic";

// Diseño nuevo en móvil: la acción principal siempre a mano
const BOTTOM_BAR = 'nd:max-lg:fixed nd:max-lg:inset-x-0 nd:max-lg:bottom-0 nd:max-lg:z-40 nd:max-lg:border-t-0 nd:max-lg:bg-gradient-to-t nd:max-lg:from-ink nd:max-lg:via-ink nd:max-lg:to-transparent nd:max-lg:px-5 nd:max-lg:pb-[max(1rem,env(safe-area-inset-bottom))] nd:max-lg:pt-8';

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';
  const playerName = searchParams.get('name') || '';
  
  const { room, players, startRound, leaveRoom, loadRoomAndSubscribe, isLoading, roomClosed, removed, joinRequests, respondJoinRequest } = useOnlineGame();
  const { success: showSuccess, error: showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadOnlineSettings);

  // Buscar el jugador actual
  const currentPlayer = players.find(p => p.name === playerName);
  const isHost = currentPlayer?.isHost || false;

  // Debug logging
  useEffect(() => {
    if (players.length > 0) {
      console.log('Players in waiting room:', players);
      console.log('Current player name:', playerName);
      console.log('Current player:', currentPlayer);
      console.log('Is host:', isHost);
      console.log('Room status:', room?.status);
      console.log('Player count:', players.length);
    }
  }, [players, playerName, currentPlayer, isHost, room?.status]);

  // Actualizar datos de la sala
  useEffect(() => {
    if (roomCode) {
      loadRoomAndSubscribe(roomCode);
      
      // Polling como respaldo para asegurar sincronización
      const pollingInterval = setInterval(() => {
        console.log('Polling room data as backup...');
        loadRoomAndSubscribe(roomCode);
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollingInterval);
    }
  }, [roomCode, loadRoomAndSubscribe]);

  // Redirigir al juego cuando empiece
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/room/${roomCode}?name=${encodeURIComponent(playerName)}`);
    }
  }, [room?.status, router, roomCode, playerName]);

  const handleStartGame = async () => {
    if (players.length < MIN_PLAYERS) {
      showError(`Se necesitan al menos ${MIN_PLAYERS} jugadores para empezar`);
      return;
    }
    setIsStarting(true);
    saveOnlineSettings(settings);
    await startRound(settings);
    setIsStarting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRoomLink = () => {
    const roomUrl = `${window.location.origin}/join-room?code=${roomCode}`;
    navigator.clipboard.writeText(roomUrl);
    setLinkCopied(true);
    showSuccess('¡Enlace copiado! Compártelo con tus amigos');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    leaveRoom(playerName);
    router.push('/');
  };

  if (!roomCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="mb-4 text-muted">Código de sala no válido</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  if (roomClosed || removed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="mb-4 text-muted">
          {roomClosed ? 'La sala se ha cerrado porque el anfitrión se desconectó' : 'Ya no estás en esta sala'}
        </p>
        <Link href="/join-room">
          <Button>Buscar otra sala</Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !room) {
    return <LoadingState message="Cargando sala..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl nd:max-lg:pb-40">
      {/* Solicitudes de entrada (solo host) */}
      {isHost && joinRequests.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2" aria-live="assertive">
          {joinRequests.map((req) => (
            <div key={req.requestId} className="mx-auto max-w-md p-4 rounded-2xl border border-accent/40 bg-elevated shadow-2xl">
              <p className="flex items-center gap-2 mb-3 text-fg">
                <UserPlus className="h-5 w-5 text-accent flex-shrink-0" />
                <span><strong>{req.playerName}</strong> quiere unirse</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => respondJoinRequest(req, false)}>Rechazar</Button>
                <Button variant="success" onClick={() => respondJoinRequest(req, true)}>Aceptar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="space-y-4 mb-6">
        {/* Primera fila: Botón salir y título */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={handleLeaveRoom}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Salir
            </Button>
            <h1 className="text-2xl font-bold text-fg">
              Sala de Espera
            </h1>
          </div>
        </div>
        
        {/* Código y compartir */}
        <div className={`grid gap-3 ${isHost ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Button variant="outline" onClick={handleCopyCode} title="Copiar código de sala" className="nd:col-span-2 nd:h-20 nd:-rotate-1 nd:border-transparent nd:bg-fg nd:text-ink nd:hover:bg-fg">
            <Copy className="h-4 w-4" />
            <span className="nd-display font-mono tracking-wider nd:text-4xl nd:tracking-[0.1em]">{copied ? '¡Copiado!' : roomCode}</span>
          </Button>
          {isHost && (
            <Button onClick={handleCopyRoomLink} title="Copiar enlace de la sala para compartir" className="nd:col-span-2 nd:h-12">
              <Share2 className="h-4 w-4" />
              {linkCopied ? '¡Copiado!' : 'Compartir'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de jugadores */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Jugadores ({players.length}/{room.maxPlayers})</span>
                <div className="flex items-center space-x-1 text-green-400 nd:text-muted">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded-lg nd:rounded-xl nd:px-4 ${
                      player.name === playerName 
                        ? 'border-blue-500 bg-blue-900/20 nd:border-accent nd:bg-accent/10' 
                        : 'border-white/10 nd:bg-panel'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold flex items-center nd:text-lg">
                          {player.name}
                          {player.isHost && <Crown className="ml-2 h-4 w-4 text-yellow-500 nd:text-accent" />}
                          {player.name === playerName && <span className="ml-2 text-blue-500 text-sm nd:text-accent">(Tú)</span>}
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500 nd:hidden" />
                    </div>
                  </div>
                ))}
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de control */}
        <div className="space-y-6">
          {/* Estado del juego (diseño nuevo en móvil: solo la barra fija inferior) */}
          <Card className="nd:max-lg:contents">
            <CardHeader className="nd:max-lg:hidden">
              <CardTitle className="text-lg">Estado del Juego</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 nd:max-lg:contents">
              <div className="space-y-2 nd:max-lg:hidden">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Jugadores mínimos:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Jugadores actuales:</span>
                  <span className="font-medium">{players.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Máximo:</span>
                  <span className="font-medium">{room.maxPlayers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Estado:</span>
                  <span className="font-medium capitalize">
                    {room.status === 'waiting' ? 'Esperando' : room.status}
                  </span>
                </div>
              </div>

              {isHost && (
                <div className={`pt-4 border-t ${BOTTOM_BAR}`}>
                  <Button 
                    onClick={handleStartGame}
                    disabled={players.length < 3 || isStarting}
                    size="lg"
                    className="w-full"
                  >
                    {isStarting ? 'Iniciando...' : 'Iniciar Juego'}
                  </Button>
                  {players.length < 3 && (
                    <p className="text-xs mt-2 text-center text-muted">
                      Se necesitan al menos 3 jugadores
                    </p>
                  )}
                </div>
              )}

              {!isHost && (
                <div className={`pt-4 border-t ${BOTTOM_BAR}`}>
                  <p className="text-sm text-center text-muted nd:max-lg:text-base">
                    Esperando a que el host inicie el juego...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isHost ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Ajustes de la partida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GameSettingsForm value={settings} onChange={setSettings} playerCount={Math.max(players.length, MIN_PLAYERS)} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cómo jugar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted">
                  <li>• Cada jugador ve su rol y su palabra en su móvil</li>
                  <li>• Los civiles comparten palabra; Mr. White no tiene</li>
                  <li>• Por turnos, decid en voz alta una pista de vuestra palabra</li>
                  <li>• ¡Descubrid quién es Mr. White!</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WaitingRoomContent />
    </Suspense>
  );
}

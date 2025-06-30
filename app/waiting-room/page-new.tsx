'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Copy, Crown, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useOnlineGame } from "../hooks/useOnlineGame";
import { LoadingState } from "../components/ui/loading";
import { useToast } from "../hooks/useToast";

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';
  const playerName = searchParams.get('name') || '';
  
  const { room, players, startGame, leaveRoom, refreshRoom, isLoading } = useOnlineGame();
  const { success: showSuccess, error: showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Buscar el jugador actual
  const currentPlayer = players.find(p => p.name === playerName);
  const isHost = currentPlayer?.isHost || false;

  // Actualizar datos de la sala
  useEffect(() => {
    if (roomCode) {
      refreshRoom();
    }
  }, [roomCode, refreshRoom]);

  // Redirigir al juego cuando empiece
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/room/${roomCode}?name=${encodeURIComponent(playerName)}`);
    }
  }, [room?.status, router, roomCode, playerName]);

  const handleStartGame = async () => {
    if (players.length < 3) {
      showError('Se necesitan al menos 3 jugadores para empezar');
      return;
    }

    setIsStarting(true);
    try {
      // Las palabras se obtienen automáticamente en startGame
      const success = await startGame({ currentWord: '', undercoverWord: '' });
      if (success) {
        showSuccess('¡Juego iniciado!');
      }
    } catch (error) {
      console.error('Error al iniciar juego:', error);
      showError('Error al iniciar el juego. Inténtalo de nuevo.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  if (!roomCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Código de sala no válido</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !room) {
    return <LoadingState message="Cargando sala..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleLeaveRoom}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Salir
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Sala de Espera
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyCode}
            className="flex items-center space-x-2"
          >
            <Copy className="h-4 w-4" />
            <span>{copied ? 'Copiado!' : roomCode}</span>
          </Button>
        </div>
      </div>

      {/* Código de sala */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg text-slate-600 dark:text-slate-400">
            Código de sala:
          </span>
          <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-lg font-mono font-bold tracking-wider">
            {roomCode}
          </code>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
          Comparte este código con tus amigos para que se unan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de jugadores */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Jugadores ({players.length}/{room.maxPlayers})</span>
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded-lg ${
                      player.name === playerName 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold flex items-center">
                          {player.name}
                          {player.isHost && <Crown className="ml-2 h-4 w-4 text-yellow-500" />}
                          {player.name === playerName && <span className="ml-2 text-blue-500 text-sm">(Tú)</span>}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Jugador #{index + 1}
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>
                ))}
                
                {/* Slots vacíos */}
                {Array.from({ length: room.maxPlayers - players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center justify-center">
                      <p className="text-slate-400 dark:text-slate-500">
                        Esperando jugador #{players.length + index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de control */}
        <div className="space-y-6">
          {/* Estado del juego */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Juego</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jugadores mínimos:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jugadores actuales:</span>
                  <span className="font-medium">{players.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Máximo:</span>
                  <span className="font-medium">{room.maxPlayers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Estado:</span>
                  <span className="font-medium capitalize">
                    {room.status === 'waiting' ? 'Esperando' : room.status}
                  </span>
                </div>
              </div>

              {isHost && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleStartGame}
                    disabled={players.length < 3 || isStarting}
                    className="w-full"
                  >
                    {isStarting ? 'Iniciando...' : 'Iniciar Juego'}
                  </Button>
                  {players.length < 3 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                      Se necesitan al menos 3 jugadores
                    </p>
                  )}
                </div>
              )}

              {!isHost && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Esperando a que el host inicie el juego...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del juego */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cómo Jugar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li>• Cada jugador recibe un rol secreto</li>
                <li>• Los civiles conocen la palabra</li>
                <li>• Mister White no la conoce</li>
                <li>• Todos dan pistas al mismo tiempo</li>
                <li>• Luego votan para eliminar sospechosos</li>
                <li>• ¡Encuentra a Mister White!</li>
              </ul>
            </CardContent>
          </Card>
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

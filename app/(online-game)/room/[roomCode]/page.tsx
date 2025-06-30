'use client';

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Users, Clock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useOnlineGame } from "../../../hooks/useOnlineGame";
import { useToast } from "../../../hooks/useToast";
import { LoadingState } from "../../../components/ui/loading";

interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  role: string | null;
  isAlive: boolean;
  description: string | null;
  votedFor: string | null;
}

interface OnlineRoom {
  id: string;
  roomCode: string;
  status: string;
  currentRound: number;
  maxPlayers: number;
  currentWord: string | null;
  undercoverWord: string | null;
  hostId: string;
}

function OnlineGameContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = params.roomCode as string;
  const playerName = searchParams.get('name') || '';
  
  const { room, players, submitDescription, submitVote, loadRoom, refreshRoom, isLoading } = useOnlineGame();
  const { success: showSuccess, error: showError } = useToast();
  
  const [currentPlayer, setCurrentPlayer] = useState<OnlinePlayer | null>(null);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'role-reveal' | 'describing' | 'voting' | 'results'>('waiting');
  const [description, setDescription] = useState('');
  const [selectedVote, setSelectedVote] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Buscar el jugador actual
  useEffect(() => {
    if (players.length > 0 && playerName) {
      const player = players.find(p => p.name === playerName);
      setCurrentPlayer(player || null);
    }
  }, [players, playerName]);

  // Actualizar datos de la sala
  useEffect(() => {
    if (roomCode) {
      loadRoom(roomCode);
    }
  }, [roomCode, loadRoom]);

  // Determinar la fase del juego basada en el estado de la sala
  useEffect(() => {
    if (!room) return;

    switch (room.status) {
      case 'waiting':
        setGamePhase('waiting');
        break;
      case 'playing':
        // Determinar subfase basada en el estado de los jugadores
        const allDescribed = players.every(p => p.description !== null);
        const allVoted = players.every(p => p.votedFor !== null);
        
        if (!allDescribed) {
          setGamePhase('describing');
        } else if (!allVoted) {
          setGamePhase('voting');
        } else {
          setGamePhase('results');
        }
        break;
      case 'finished':
        setGamePhase('results');
        break;
      default:
        setGamePhase('role-reveal');
    }
  }, [room, players]);

  // Funciones de manejo de acciones
  const handleSubmitDescription = async () => {
    if (!description.trim() || !currentPlayer) return;

    const success = await submitDescription(description.trim(), currentPlayer.name);
    if (success) {
      showSuccess('Descripción enviada exitosamente');
      setDescription('');
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVote || !currentPlayer) return;

    const success = await submitVote(selectedVote, currentPlayer.name);
    if (success) {
      showSuccess('Voto enviado exitosamente');
      setSelectedVote('');
    }
  };

  // Timer para fases del juego
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gamePhase === 'describing' || gamePhase === 'voting') {
      setTimeLeft(120); // 2 minutos por fase
      
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Tiempo agotado - enviar acción automática
            if (gamePhase === 'describing' && !currentPlayer?.description) {
              handleSubmitDescription(); // Enviar descripción vacía
            } else if (gamePhase === 'voting' && !currentPlayer?.votedFor) {
              // Votar por alguien aleatorio
              const availablePlayers = players.filter(p => p.name !== currentPlayer?.name && p.isAlive);
              if (availablePlayers.length > 0) {
                const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
                setSelectedVote(randomPlayer.name);
                setTimeout(() => handleSubmitVote(), 100);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gamePhase, currentPlayer, players, handleSubmitDescription, handleSubmitVote]);

  const handleLeaveRoom = () => {
    router.push('/');
  };

  if (!roomCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Código de sala no válido</p>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    );
  }

  if (isLoading || !room || !currentPlayer) {
    return <LoadingState message="Cargando juego..." />;
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
            Sala: {roomCode}
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4" />
          <span>{players.length}/{room.maxPlayers}</span>
        </div>
      </div>

      {/* Información del jugador */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tu Información</span>
            {gamePhase !== 'waiting' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRole(!showRole)}
              >
                {showRole ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showRole ? 'Ocultar' : 'Ver'} Rol
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-slate-600 dark:text-slate-400">Nombre</Label>
              <p className="font-semibold">{currentPlayer.name}</p>
            </div>
            {gamePhase !== 'waiting' && (
              <>
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Rol</Label>
                  <p className="font-semibold">
                    {showRole ? (
                      currentPlayer.role === 'civil' ? 'Civil' :
                      currentPlayer.role === 'mister_white' ? 'Mister White' :
                      currentPlayer.role === 'undercover' ? 'Undercover' :
                      currentPlayer.role === 'payaso' ? 'Payaso' : 'Desconocido'
                    ) : '***'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Palabra</Label>
                  <p className="font-semibold">
                    {showRole ? (
                      currentPlayer.role === 'mister_white' ? '???' :
                      currentPlayer.role === 'undercover' ? room.undercoverWord :
                      room.currentWord
                    ) : '***'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicador de tiempo */}
      {(gamePhase === 'describing' || gamePhase === 'voting') && timeLeft > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-sm text-orange-600 dark:text-orange-400">
                restantes
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido según la fase del juego */}
      {gamePhase === 'waiting' && (
        <Card>
          <CardHeader>
            <CardTitle>Esperando que comience el juego...</CardTitle>
            <CardDescription>
              El host iniciará el juego cuando todos los jugadores estén listos.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {gamePhase === 'describing' && (
        <Card>
          <CardHeader>
            <CardTitle>Fase de Descripción</CardTitle>
            <CardDescription>
              Todos los jugadores deben dar una pista de una palabra relacionada con su palabra secreta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentPlayer.description ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Tu descripción (una palabra)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escribe una pista..."
                    maxLength={50}
                  />
                </div>
                <Button onClick={handleSubmitDescription} disabled={!description.trim()}>
                  Enviar Descripción
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-green-600 dark:text-green-400">
                  ✓ Tu descripción ha sido enviada: "{currentPlayer.description}"
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Esperando a que los demás jugadores envíen sus descripciones...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {gamePhase === 'voting' && (
        <Card>
          <CardHeader>
            <CardTitle>Fase de Votación</CardTitle>
            <CardDescription>
              Vota por el jugador que crees que es Mister White.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentPlayer.votedFor ? (
              <div className="space-y-4">
                <div>
                  <Label>Selecciona a quién votar:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {players
                      .filter(p => p.name !== currentPlayer.name && p.isAlive)
                      .map(player => (
                        <Button
                          key={player.id}
                          variant={selectedVote === player.name ? "default" : "outline"}
                          onClick={() => setSelectedVote(player.name)}
                          className="justify-start"
                        >
                          {player.name}
                          {player.description && (
                            <span className="ml-2 text-sm opacity-70">
                              - "{player.description}"
                            </span>
                          )}
                        </Button>
                      ))}
                  </div>
                </div>
                <Button onClick={handleSubmitVote} disabled={!selectedVote}>
                  Confirmar Voto
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-green-600 dark:text-green-400">
                  ✓ Has votado por: {currentPlayer.votedFor}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Esperando a que los demás jugadores voten...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {gamePhase === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Juego</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg">
              El juego ha terminado. Revisando resultados...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de jugadores */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Jugadores en la Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map(player => (
              <div
                key={player.id}
                className={`p-3 border rounded-lg ${
                  player.name === currentPlayer.name 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700'
                } ${!player.isAlive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center">
                      {player.name}
                      {player.isHost && <span className="ml-2 text-yellow-500">👑</span>}
                      {player.name === currentPlayer.name && <span className="ml-2 text-blue-500">(Tú)</span>}
                    </p>
                    {gamePhase === 'describing' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {player.description ? `Descripción: "${player.description}"` : 'Pensando...'}
                      </p>
                    )}
                    {gamePhase === 'voting' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {player.votedFor ? 'Votó' : 'Votando...'}
                      </p>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${player.isAlive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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

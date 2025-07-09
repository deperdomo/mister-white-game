'use client';

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { ArrowLeft, Users, Clock, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useOnlineGame } from "../../../hooks/useOnlineGame";
import { useToast } from "../../../hooks/useToast";
import { LoadingState } from "../../../components/ui/loading";
import { calculateOnlineGameResults, getRoleEmoji, getRoleName, OnlineGameResults } from "../../../lib/game-logic";

interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  role: string | null;
  isAlive: boolean;
  description: string | null;
  votedFor: string | null;
}



function OnlineGameContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = params.roomCode as string;
  const playerName = searchParams.get('name') || '';
  
  const { room, players, submitDescription, submitVote, loadRoomAndSubscribe, isLoading } = useOnlineGame();
  const { success: showSuccess, error: showError } = useToast();
  
  const [currentPlayer, setCurrentPlayer] = useState<OnlinePlayer | null>(null);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'role-reveal' | 'describing' | 'voting' | 'results'>('waiting');
  const [description, setDescription] = useState('');
  const [selectedVote, setSelectedVote] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameResults, setGameResults] = useState<OnlineGameResults | null>(null);
  const [previousPhase, setPreviousPhase] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [copied, setCopied] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar el jugador actual
  useEffect(() => {
    if (players.length > 0 && playerName) {
      const player = players.find(p => p.name === playerName);
      console.log('Looking for player:', playerName);
      console.log('Available players:', players.map(p => p.name));
      console.log('Found player:', player);
      
      if (player) {
        setCurrentPlayer(player);
      } else if (!currentPlayer) {
        // Solo recargar si no tenemos un jugador actual y es la primera vez
        console.warn('Player not found in players list, this might be the sync issue');
        if (roomCode) {
          console.log('Forcing room reload due to missing player - one time only');
          loadRoomAndSubscribe(roomCode);
        }
      }
    }
  }, [players, playerName, roomCode, loadRoomAndSubscribe, currentPlayer]);

  // Debug logging para el estado del juego
  useEffect(() => {
    console.log('Game room state:', {
      room,
      currentWord: room?.currentWord,
      undercoverWord: room?.undercoverWord,
      players: players.length,
      currentPlayer,
      gamePhase,
      roomStatus: room?.status
    });
  }, [room, players, currentPlayer, gamePhase]);

  // Actualizar datos de la sala
  useEffect(() => {
    if (roomCode) {
      loadRoomAndSubscribe(roomCode);
      
      // Polling menos agresivo para reducir carga del servidor
      const pollingInterval = setInterval(() => {
        console.log('Polling game room data as backup...');
        loadRoomAndSubscribe(roomCode);
      }, 10000); // Reducido a 10 segundos fijos para todas las fases
      
      return () => clearInterval(pollingInterval);
    }
  }, [roomCode, loadRoomAndSubscribe]); // Removido gamePhase de las dependencias

  // Determinar la fase del juego basada en el estado de la sala
  useEffect(() => {
    if (!room) return;

    // No interferir con la lógica de cambio directo durante nueva ronda
    if (isStartingNextRound) {
      console.log('Skipping phase determination during round start');
      return;
    }

    console.log('Determining game phase:', {
      roomStatus: room.status,
      playersCount: players.length,
      playersWithDescription: players.filter(p => p.description !== null).length,
      playersWithVote: players.filter(p => p.votedFor !== null).length,
      currentPhase: gamePhase
    });

    switch (room.status) {
      case 'waiting':
        if (gamePhase !== 'waiting') {
          console.log('Switching to waiting phase');
          setGamePhase('waiting');
        }
        break;
      case 'playing':
        // Determinar subfase basada en el estado de los jugadores
        const allDescribed = players.length > 0 && players.every(p => p.description !== null);
        const allVoted = players.length > 0 && players.every(p => p.votedFor !== null);
        
        if (!allDescribed) {
          if (gamePhase !== 'describing') {
            console.log('Switching to describing phase');
            setGamePhase('describing');
          }
        } else if (!allVoted) {
          if (gamePhase !== 'voting') {
            console.log('Switching to voting phase');
            setGamePhase('voting');
          }
        } else {
          if (gamePhase !== 'results') {
            console.log('Switching to results phase');
            setGamePhase('results');
            // Calcular resultados cuando todos han votado
            if (players.length > 0 && allVoted) {
              const results = calculateOnlineGameResults(players);
              setGameResults(results);
            }
          }
        }
        break;
      case 'finished':
        if (gamePhase !== 'results') {
          console.log('Switching to finished/results phase');
          setGamePhase('results');
          // Calcular resultados si no se han calculado ya
          if (players.length > 0 && !gameResults) {
            const results = calculateOnlineGameResults(players);
            setGameResults(results);
          }
        }
        break;
      default:
        if (gamePhase !== 'role-reveal') {
          console.log('Switching to role-reveal phase');
          setGamePhase('role-reveal');
        }
    }
  }, [room, players, gameResults, gamePhase, isStartingNextRound]);

  // Funciones de manejo de acciones con debounce
  const handleSubmitDescription = useCallback(async () => {
    if (!description.trim() || !currentPlayer || isSubmitting) return;

    // Limpiar timeout anterior si existe
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    setIsSubmitting(true);

    try {
      const success = await submitDescription(description.trim(), currentPlayer.name);
      if (success) {
        showSuccess('Descripción enviada exitosamente');
        setDescription('');
      }
    } finally {
      // Debounce para evitar múltiples envíos rápidos
      submitTimeoutRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  }, [description, currentPlayer, submitDescription, showSuccess, isSubmitting]);

  const handleSubmitVote = useCallback(async () => {
    if (!selectedVote || !currentPlayer || isSubmitting) return;

    // Limpiar timeout anterior si existe
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    setIsSubmitting(true);

    try {
      const success = await submitVote(selectedVote, currentPlayer.name);
      if (success) {
        showSuccess('Voto enviado exitosamente');
        setSelectedVote('');
      }
    } finally {
      // Debounce para evitar múltiples envíos rápidos
      submitTimeoutRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  }, [selectedVote, currentPlayer, submitVote, showSuccess, isSubmitting]);

  // Timer para fases del juego - solo se reinicia cuando cambia la fase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gamePhase === 'describing' || gamePhase === 'voting') {
      // Solo resetear el timer si es una nueva fase
      if (previousPhase !== gamePhase) {
        console.log(`Starting timer for ${gamePhase} phase`);
        setTimeLeft(120); // 2 minutos por fase
        setPreviousPhase(gamePhase);
      }
      
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Si no estamos en una fase con timer, resetear a 0
      if (timeLeft > 0) {
        setTimeLeft(0);
      }
      setPreviousPhase(gamePhase);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gamePhase, previousPhase, timeLeft]);

  // Manejar acciones automáticas cuando se acaba el tiempo
  useEffect(() => {
    if (timeLeft === 0 && (gamePhase === 'describing' || gamePhase === 'voting')) {
      if (gamePhase === 'describing' && currentPlayer && !currentPlayer.description) {
        // Solo auto-enviar si no hay nada escrito y el usuario no está interactuando
        if (!description.trim()) {
          console.log('Time up - auto-submitting empty description');
          handleSubmitDescription();
        }
      } else if (gamePhase === 'voting' && currentPlayer && !currentPlayer.votedFor) {
        // Solo auto-votar si no se ha seleccionado nada
        if (!selectedVote) {
          console.log('Time up - auto-submitting random vote');
          const availablePlayers = players.filter(p => p.name !== currentPlayer?.name && p.isAlive);
          if (availablePlayers.length > 0) {
            const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
            setSelectedVote(randomPlayer.name);
            setTimeout(() => handleSubmitVote(), 100);
          }
        }
      }
    }
  }, [timeLeft, gamePhase, currentPlayer, players, description, selectedVote, handleSubmitDescription, handleSubmitVote]);

  const handleLeaveRoom = () => {
    router.push('/');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      showSuccess('¡Código de sala copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Error al copiar el código');
    }
  };

  const handleNextRound = async () => {
    if (!room || !currentPlayer?.isHost || isStartingNextRound) return;
    
    try {
      console.log('Starting next round...');
      setIsStartingNextRound(true);
      
      // Limpiar estados locales primero
      setDescription('');
      setSelectedVote('');
      setShowRole(false);
      setGameResults(null);
      setTimeLeft(0);
      setPreviousPhase('');
      
      // Llamar a la API para reiniciar la ronda
      const response = await fetch(`/api/rooms/${room.roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next_round',
        }),
      });

      if (response.ok) {
        showSuccess('¡Nueva ronda iniciada!');
        
        // Cambiar inmediatamente a la fase de descripción
        console.log('Switching immediately to describing phase');
        setGamePhase('describing');
        setIsStartingNextRound(false);
        
        // Recarga en paralelo para sincronizar datos del servidor
        loadRoomAndSubscribe(roomCode);
      } else {
        const data = await response.json();
        showError(data.error || 'Error al iniciar nueva ronda');
        setIsStartingNextRound(false);
      }
    } catch (error) {
      console.error('Error al iniciar nueva ronda:', error);
      showError('Error al iniciar nueva ronda');
      setIsStartingNextRound(false);
    }
  };

  // Escuchar eventos de nueva ronda para limpiar estados locales
  useEffect(() => {
    const handleRoundStarted = (event: CustomEvent) => {
      console.log('Handling round-started event:', event.detail);
      // Limpiar estados locales cuando comience una nueva ronda
      setDescription('');
      setSelectedVote('');
      setShowRole(false);
      setGameResults(null);
      setTimeLeft(0);
      setPreviousPhase('');
      setIsStartingNextRound(false); // Limpiar el estado de carga
      
      // Cambiar inmediatamente a la fase de descripción
      console.log('Switching immediately to describing phase from round-started event');
      setGamePhase('describing');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('round-started', handleRoundStarted as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('round-started', handleRoundStarted as EventListener);
      }
    };
  }, []);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyCode}
            className="ml-3 flex items-center space-x-2"
            title="Copiar código de sala"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
          </Button>
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
                      currentPlayer.role === 'undercover' ? (room.undercoverWord || 'Error: Palabra no encontrada') :
                      (room.currentWord || 'Error: Palabra no encontrada')
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
                <Button onClick={handleSubmitDescription} disabled={!description.trim() || isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar Descripción'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-green-600 dark:text-green-400">
                  ✓ Tu descripción ha sido enviada: &quot;{currentPlayer.description}&quot;
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
                              - &quot;{player.description}&quot;
                            </span>
                          )}
                        </Button>
                      ))}
                  </div>
                </div>
                <Button onClick={handleSubmitVote} disabled={!selectedVote || isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Confirmar Voto'}
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
          <CardContent className="space-y-6">
            {gameResults ? (
              <>
                {/* Resultado principal */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-lg font-bold mb-4 ${
                    gameResults.winner === 'civilians' ? 'bg-blue-500' :
                    gameResults.winner === 'mister_white' ? 'bg-red-500' :
                    gameResults.winner === 'undercover' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}>
                    {gameResults.winner === 'civilians' && '👥 ¡Civiles Ganaron!'}
                    {gameResults.winner === 'mister_white' && '🕵️ ¡Mister White Ganó!'}
                    {gameResults.winner === 'undercover' && '🥸 ¡Undercover Ganó!'}
                    {gameResults.winner === 'payaso' && '🤡 ¡Payaso Ganó!'}
                  </div>
                  <p className="text-lg mb-4">{gameResults.reason}</p>
                </div>

                {/* Información de votación */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">📊 Resultados de la Votación</h4>
                  {gameResults.eliminated ? (
                    <p className="mb-2">
                      <span className="font-semibold text-red-600">Eliminado:</span> {gameResults.eliminated} 
                      ({gameResults.votes[gameResults.eliminated]} votos)
                    </p>
                  ) : (
                    <p className="mb-2 text-yellow-600">Hubo empate en la votación</p>
                  )}
                  
                  <div className="space-y-1">
                    {Object.entries(gameResults.votes).map(([playerName, voteCount]) => (
                      <div key={playerName} className="flex justify-between">
                        <span>{playerName}</span>
                        <span className="font-semibold">{voteCount} votos</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revelación de roles */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">🎭 Revelación de Roles</h4>
                  <div className="space-y-2">
                    {players.map(player => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getRoleEmoji(player.role)}</span>
                          <span className="font-semibold">{player.name}</span>
                          {player.name === currentPlayer.name && (
                            <span className="text-blue-500 text-sm">(Tú)</span>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-sm font-semibold ${
                          player.role === 'civil' ? 'bg-blue-100 text-blue-800' :
                          player.role === 'mister_white' ? 'bg-red-100 text-red-800' :
                          player.role === 'undercover' ? 'bg-purple-100 text-purple-800' :
                          player.role === 'payaso' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleName(player.role)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Palabras del juego */}
                {room.currentWord && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">📝 Palabras del Juego</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Palabra Civil:</span>
                        <p className="font-semibold">{room.currentWord}</p>
                      </div>
                      {room.undercoverWord && (
                        <div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Palabra Undercover:</span>
                          <p className="font-semibold">{room.undercoverWord}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-lg">
                Calculando resultados...
              </p>
            )}
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {currentPlayer?.isHost ? (
                <>
                  <Button 
                    onClick={handleNextRound}
                    className="flex-1 sm:flex-none"
                    size="lg"
                    disabled={isStartingNextRound}
                  >
                    {isStartingNextRound ? 'Iniciando Ronda...' : 'Siguiente Ronda'}
                  </Button>
                  <Button 
                    onClick={handleLeaveRoom}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    size="lg"
                  >
                    Salir del Juego
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-center text-slate-600 dark:text-slate-400 mb-3">
                    Esperando a que el host decida...
                  </p>
                  <Button 
                    onClick={handleLeaveRoom}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    size="lg"
                  >
                    Salir del Juego
                  </Button>
                </>
              )}
            </div>
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

      {/* Indicador de carga para nueva ronda */}
      {isStartingNextRound && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border shadow-lg">
            <LoadingState message="Iniciando nueva ronda..." size="lg" />
          </div>
        </div>
      )}
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

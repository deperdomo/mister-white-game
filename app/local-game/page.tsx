'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import DescriptionInput from "../components/game/DescriptionInput";
import { assignRoles, selectRandomWord, getRoleInfo, checkWinCondition, calculateVotingResult } from "../lib/game-logic";
import { Player } from "../lib/types";

function LocalGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameWord, setGameWord] = useState<{ word: string; undercoverWord: string; category: string } | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<'setup' | 'reveal-roles' | 'describing' | 'voting' | 'finished'>('setup');
  const [showRole, setShowRole] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [descriptions, setDescriptions] = useState<{ playerId: string; description: string }[]>([]);
  const [votes, setVotes] = useState<{ voterId: string; targetId: string }[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<string[]>([]);
  const [winner, setWinner] = useState<'civilians' | 'mister_white' | 'undercover' | null>(null);

  useEffect(() => {
    // Obtener datos de los parámetros de URL
    const playersParam = searchParams.get('players');
    const difficultyParam = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard';
    
    if (playersParam) {
      try {
        const playerNames = JSON.parse(playersParam) as string[];
        setDifficulty(difficultyParam || 'medium');
        
        // Crear objetos Player
        const initialPlayers: Player[] = playerNames.map((name, index) => ({
          id: (index + 1).toString(),
          name: name.trim(),
          role: 'civil', // Se asignará después
          isHost: index === 0,
          isAlive: true,
          joinedAt: new Date().toISOString(),
        }));
        
        // Asignar roles
        const playersWithRoles = assignRoles(initialPlayers);
        setPlayers(playersWithRoles);
        
        // Seleccionar palabra
        const selectedWord = selectRandomWord(difficultyParam || 'medium');
        setGameWord({
          word: selectedWord.word,
          undercoverWord: selectedWord.undercoverWord,
          category: selectedWord.category,
        });
        
        setGamePhase('reveal-roles');
        
      } catch (error) {
        console.error('Error al parsear datos del juego:', error);
        router.push('/local');
      }
    } else {
      router.push('/local');
    }
  }, [searchParams, router]);

  const handleNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setShowRole(false);
    } else {
      // Todos los jugadores han visto sus roles
      setGamePhase('describing');
    }
  };

  const handleStartGame = () => {
    setGamePhase('describing');
    setCurrentPlayerIndex(0);
  };

  const handleSubmitDescription = (description: string) => {
    const currentPlayer = getAlivePlayers()[currentPlayerIndex];
    setDescriptions(prev => [...prev, { playerId: currentPlayer.id, description }]);
    
    if (currentPlayerIndex < getAlivePlayers().length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // Todas las descripciones completadas, ir a votación
      setGamePhase('voting');
      setCurrentPlayerIndex(0);
    }
  };

  const handleVote = (targetId: string) => {
    const currentPlayer = getAlivePlayers()[currentPlayerIndex];
    setVotes(prev => [...prev, { voterId: currentPlayer.id, targetId }]);
    
    if (currentPlayerIndex < getAlivePlayers().length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // Todas las votaciones completadas, calcular resultado
      processVotingResult();
    }
  };

  const processVotingResult = () => {
    const eliminatedPlayerId = calculateVotingResult(votes.map(v => ({ targetId: v.targetId })));
    
    if (eliminatedPlayerId) {
      setEliminatedPlayers(prev => [...prev, eliminatedPlayerId]);
    }
    
    // Actualizar estado de jugadores y verificar condición de victoria
    const updatedPlayers = players.map(p => ({
      ...p,
      isAlive: !eliminatedPlayers.includes(p.id) && p.id !== eliminatedPlayerId
    }));
    
    const winCondition = checkWinCondition(updatedPlayers);
    
    if (winCondition) {
      setWinner(winCondition);
      setGamePhase('finished');
    } else {
      // Continuar al siguiente round
      setCurrentRound(prev => prev + 1);
      setDescriptions([]);
      setVotes([]);
      setCurrentPlayerIndex(0);
      setGamePhase('describing');
    }
  };

  const getAlivePlayers = () => {
    return players.filter(p => !eliminatedPlayers.includes(p.id));
  };

  const resetGame = () => {
    router.push('/local');
  };

  const handleGoBack = () => {
    router.push('/local');
  };

  if (!players.length || !gameWord) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Cargando juego...</p>
        <Button onClick={handleGoBack}>Volver atrás</Button>
      </div>
    );
  }

  if (gamePhase === 'reveal-roles') {
    const currentPlayer = players[currentPlayerIndex];
    const roleInfo = getRoleInfo(currentPlayer.role, gameWord.word, gameWord.undercoverWord);

    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Revelar Roles
          </h1>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle>Turno de {currentPlayer.name}</CardTitle>
            <CardDescription>
              Jugador {currentPlayerIndex + 1} de {players.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {!showRole ? (
              <>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>{currentPlayer.name}</strong>, es tu turno de ver tu rol secreto.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Asegúrate de que otros jugadores no puedan ver la pantalla.
                  </p>
                </div>
                
                <Button onClick={() => setShowRole(true)} size="lg" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver mi rol
                </Button>
              </>
            ) : (
              <>
                <div className={`p-6 rounded-lg ${roleInfo.color} text-white`}>
                  <h3 className="text-xl font-bold mb-2">{roleInfo.title}</h3>
                  <p className="text-sm mb-4">{roleInfo.description}</p>
                  <div className="bg-black bg-opacity-20 rounded p-3">
                    <p className="text-xs mb-1">Tu palabra:</p>
                    <p className="text-2xl font-bold">{roleInfo.word}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p><strong>Categoría:</strong> {gameWord.category}</p>
                  <p><strong>Dificultad:</strong> {difficulty}</p>
                </div>

                <Button onClick={handleNextPlayer} size="lg" className="w-full">
                  <EyeOff className="h-4 w-4 mr-2" />
                  {currentPlayerIndex < players.length - 1 ? 'Siguiente jugador' : 'Comenzar juego'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progreso */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Progreso</span>
            <span>{currentPlayerIndex + 1}/{players.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPlayerIndex + 1) / players.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fase de descripciones
  if (gamePhase === 'describing') {
    const alivePlayers = getAlivePlayers();
    const currentPlayer = alivePlayers[currentPlayerIndex];

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Ronda {currentRound} - Descripciones
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Turno de {currentPlayer.name}</CardTitle>
            <CardDescription>
              Describe tu palabra sin mencionarla directamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Jugador {currentPlayerIndex + 1} de {alivePlayers.length}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Categoría: <strong>{gameWord.category}</strong>
              </p>
            </div>

            <DescriptionInput
              playerName={currentPlayer.name}
              onSubmit={handleSubmitDescription}
            />

            {/* Descripciones anteriores en esta ronda */}
            {descriptions.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Descripciones de esta ronda:</h3>
                <div className="space-y-2">
                  {descriptions.map((desc, index) => {
                    const player = players.find(p => p.id === desc.playerId);
                    return (
                      <div key={index} className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                        <p className="text-sm font-medium">{player?.name}:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">&ldquo;{desc.description}&rdquo;</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fase de votación
  if (gamePhase === 'voting') {
    const alivePlayers = getAlivePlayers();
    const currentPlayer = alivePlayers[currentPlayerIndex];

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Ronda {currentRound} - Votación
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Turno de {currentPlayer.name}</CardTitle>
            <CardDescription>
              Vota por el jugador que crees que es sospechoso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Votación {currentPlayerIndex + 1} de {alivePlayers.length}
              </p>
            </div>

            {/* Mostrar todas las descripciones de esta ronda */}
            <div className="space-y-3">
              <h3 className="font-medium">Descripciones de esta ronda:</h3>
              {descriptions.map((desc, index) => {
                const player = players.find(p => p.id === desc.playerId);
                return (
                  <div key={index} className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-sm font-medium">{player?.name}:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">&ldquo;{desc.description}&rdquo;</p>
                  </div>
                );
              })}
            </div>

            {/* Opciones de votación */}
            <div className="space-y-3">
              <h3 className="font-medium">¿A quién votas?</h3>
              <div className="grid grid-cols-1 gap-2">
                {alivePlayers
                  .filter(p => p.id !== currentPlayer.id) // No puede votar por sí mismo
                  .map(player => (
                    <Button
                      key={player.id}
                      variant="outline"
                      onClick={() => handleVote(player.id)}
                      className="justify-start"
                    >
                      Votar por {player.name}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Votos anteriores en esta ronda */}
            {votes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Votos emitidos:</h3>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {votes.map((vote, index) => {
                    const voter = players.find(p => p.id === vote.voterId);
                    const target = players.find(p => p.id === vote.targetId);
                    return (
                      <p key={index}>{voter?.name} votó por {target?.name}</p>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fase de juego terminado
  if (gamePhase === 'finished' && winner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={resetGame}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Nuevo juego
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            ¡Juego terminado!
          </h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {winner === 'civilians' && '🎉 ¡Ganaron los Civiles!'}
              {winner === 'mister_white' && '🕵️ ¡Ganó Mister White!'}
              {winner === 'undercover' && '🥸 ¡Ganaron los Undercover!'}
            </CardTitle>
            <CardDescription>
              Rondas jugadas: {currentRound}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revelación de roles */}
            <div className="space-y-3">
              <h3 className="font-medium">Revelación de roles:</h3>
              {players.map(player => {
                const roleInfo = getRoleInfo(player.role, gameWord?.word, gameWord?.undercoverWord);
                const isEliminated = eliminatedPlayers.includes(player.id);
                return (
                  <div 
                    key={player.id} 
                    className={`p-3 rounded border ${isEliminated ? 'opacity-50 border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {player.name} {isEliminated && '❌'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs text-white ${roleInfo.color}`}>
                        {roleInfo.title.replace('Eres ', '')}
                      </span>
                    </div>
                    {player.role !== 'mister_white' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Palabra: {roleInfo.word}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Información de la palabra */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
              <h3 className="font-medium mb-2">Palabras del juego:</h3>
              <p><strong>Palabra civil:</strong> {gameWord?.word}</p>
              <p><strong>Palabra undercover:</strong> {gameWord?.undercoverWord}</p>
              <p><strong>Categoría:</strong> {gameWord?.category}</p>
            </div>

            <Button onClick={resetGame} size="lg" className="w-full">
              Jugar otra vez
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fase de setup/resumen antes de comenzar el juego
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Juego Local - {gameWord.category}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>¡Todos los roles han sido revelados!</CardTitle>
          <CardDescription>
            Es hora de comenzar el juego. Cada jugador describir su palabra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Jugadores</p>
              <p className="text-2xl font-bold">{players.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Categoría</p>
              <p className="text-lg font-semibold">{gameWord.category}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Jugadores:</h3>
            <div className="grid grid-cols-2 gap-2">
              {players.map((player) => (
                <div key={player.id} className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-center">
                  <span className="text-sm">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleStartGame} size="lg" className="w-full">
            Comenzar descripciones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LocalGamePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400">Preparando juego local...</p>
      </div>
    }>
      <LocalGameContent />
    </Suspense>
  );
}

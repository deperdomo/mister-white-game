'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Eye, EyeOff, Send, Vote as VoteIcon, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { initializeGame, initializeGameWithDatabaseWords, allPlayersRevealed, processVote, getRoleInfo } from "../lib/game-logic";
import { Player, LocalGameData, LocalGameConfig } from "../lib/types";

function LocalGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [gameData, setGameData] = useState<LocalGameData | null>(null);
  const [showRole, setShowRole] = useState(false);
  const [selectedVotedPlayer, setSelectedVotedPlayer] = useState<string>('');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  useEffect(() => {
    // Get configuration from URL parameters
    const configParam = searchParams.get('config');
    
    if (configParam) {
      const initializeGameAsync = async () => {
        try {
          const config: LocalGameConfig = JSON.parse(configParam);
          
          // Initialize game with database words if enabled
          let newGameData;
          if (config.useDatabase) {
            newGameData = await initializeGameWithDatabaseWords(
              config.players,
              config.difficulty,
              config.includeUndercover,
              config.maxMisterWhites,
              config.category
            );
          } else {
            newGameData = initializeGame(
              config.players,
              config.difficulty,
              config.includeUndercover,
              config.maxMisterWhites
            );
          }
          
          setGameData(newGameData);
          
        } catch (error) {
          console.error('Error parsing game configuration:', error);
          router.push('/local');
        }
      };

      initializeGameAsync();
    } else {
      router.push('/local');
    }
  }, [searchParams, router]);

  // Handle player seeing their role/word
  const handleRevealWord = () => {
    if (!gameData) return;
    setShowRole(true);
  };

  const handleWordSeen = () => {
    if (!gameData) return;
    
    const currentPlayer = gameData.players[gameData.currentPlayerIndex];
    const updatedPlayers = gameData.players.map(p => 
      p.id === currentPlayer.id ? { ...p, wordRevealed: true } : p
    );
    
    const nextPlayerIndex = gameData.currentPlayerIndex + 1;
    const allRevealed = allPlayersRevealed(updatedPlayers);
    
    setGameData({
      ...gameData,
      players: updatedPlayers,
      currentPlayerIndex: allRevealed ? 0 : nextPlayerIndex,
      gamePhase: allRevealed ? 'clues' : 'wordReveal',
    });
    
    setShowRole(false);
  };

  // Handle clue submission
  const handleAllCluesSubmit = () => {
    if (!gameData) return;
    
    // Check that all players have clues
    const allHaveClues = gameData.players.every(p => p.clue && p.clue.trim() !== '');
    if (!allHaveClues) return;
    
    setGameData({
      ...gameData,
      allCluesSubmitted: true,
      gamePhase: 'voting',
    });
  };

  // Handle individual clue change
  const handleClueChange = (playerId: string, clue: string) => {
    if (!gameData) return;
    
    const updatedPlayers = gameData.players.map(p => 
      p.id === playerId ? { ...p, clue: clue.trim() } : p
    );
    
    setGameData({
      ...gameData,
      players: updatedPlayers,
    });
  };

  // Handle voting
  const handleVote = () => {
    if (!gameData || !selectedVotedPlayer) return;
    
    const finalGameData = processVote(gameData, selectedVotedPlayer);
    setGameData(finalGameData);
  };

  const resetGame = () => {
    router.push('/local');
  };

  const handleGoBack = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    router.push('/local');
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const continueWithSameConfig = async () => {
    if (!gameData) return;
    
    // Reiniciar el juego con la misma configuración
    let newGameData;
    if (gameData.originalConfig.useDatabase) {
      newGameData = await initializeGameWithDatabaseWords(
        gameData.originalConfig.players,
        gameData.originalConfig.difficulty,
        gameData.originalConfig.includeUndercover,
        gameData.originalConfig.maxMisterWhites,
        gameData.originalConfig.category
      );
    } else {
      newGameData = initializeGame(
        gameData.originalConfig.players,
        gameData.originalConfig.difficulty,
        gameData.originalConfig.includeUndercover,
        gameData.originalConfig.maxMisterWhites
      );
    }
    
    setGameData(newGameData);
    setShowRole(false);
    setSelectedVotedPlayer('');
  };

  const handleEditPlayers = () => {
    if (!gameData) return;
    
    // Redirigir a la página de configuración con los datos actuales precargados
    const currentConfig = {
      players: gameData.originalConfig.players,
      difficulty: gameData.originalConfig.difficulty,
      includeUndercover: gameData.originalConfig.includeUndercover,
      maxMisterWhites: gameData.originalConfig.maxMisterWhites,
      isEditing: true // Indicar que estamos editando una configuración existente
    };
    
    const params = new URLSearchParams({
      config: JSON.stringify(currentConfig),
    });
    
    router.push(`/local?${params.toString()}`);
  };



  if (!gameData) {
    return (
      <>
        {/* Modal de confirmación para salir */}
        {showExitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={cancelExit}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-10">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900/20">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                  ¿Estás seguro de que quieres salir?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Se perderán todos los datos de la partida actual y tendrás que empezar de nuevo.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={cancelExit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmExit}
                  className="flex-1"
                >
                  Salir de todas formas
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8 max-w-md text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Cargando juego...</p>
          <Button onClick={handleGoBack}>Volver atrás</Button>
        </div>
      </>
    );
  }

  // Word Reveal Phase - Each player sees their role and word
  if (gameData.gamePhase === 'wordReveal') {
    const currentPlayer = gameData.players[gameData.currentPlayerIndex];
    const roleInfo = getRoleInfo(currentPlayer);

    return (
      <>
        {/* Modal de confirmación para salir */}
        {showExitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={cancelExit}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-10">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900/20">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                  ¿Estás seguro de que quieres salir?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Se perderán todos los datos de la partida actual y tendrás que empezar de nuevo.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={cancelExit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmExit}
                  className="flex-1"
                >
                  Salir de todas formas
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8 max-w-md">
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
              Jugador {gameData.currentPlayerIndex + 1} de {gameData.players.length}
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
                
                <Button onClick={handleRevealWord} size="lg" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver mi rol
                </Button>
              </>
            ) : (
              <>
                <div className={`p-6 rounded-lg ${roleInfo.color} text-white`}>
                  <div className="text-4xl mb-2">{roleInfo.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{roleInfo.title}</h3>
                  <p className="text-sm mb-4">{roleInfo.description}</p>
                  <div className="bg-black bg-opacity-20 rounded p-3">
                    <p className="text-xs mb-1">Tu palabra:</p>
                    <p className="text-2xl font-bold">{roleInfo.word}</p>
                  </div>
                </div>

                {gameData.category && (
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p><strong>Categoría:</strong> {gameData.category}</p>
                  </div>
                )}

                <Button onClick={handleWordSeen} size="lg" className="w-full">
                  <EyeOff className="h-4 w-4 mr-2" />
                  {gameData.currentPlayerIndex < gameData.players.length - 1 ? 'Siguiente jugador' : 'Comenzar ronda de pistas'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Progreso</span>
            <span>{gameData.currentPlayerIndex + 1}/{gameData.players.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((gameData.currentPlayerIndex + 1) / gameData.players.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      </>
    );
  }

  // Clues Phase - All players submit their clues
  if (gameData.gamePhase === 'clues') {
    return (
      <>
        {/* Modal de confirmación para salir */}
        {showExitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={cancelExit}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-10">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900/20">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                  ¿Estás seguro de que quieres salir?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Se perderán todos los datos de la partida actual y tendrás que empezar de nuevo.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={cancelExit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmExit}
                  className="flex-1"
                >
                  Salir de todas formas
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Ronda {gameData.round} - Pistas
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los jugadores deben dar una pista</CardTitle>
            <CardDescription>
              Da una pista de una palabra relacionada con tu palabra secreta (sin mencionarla directamente)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {gameData.category && (
              <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Categoría: <strong>{gameData.category}</strong>
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {gameData.players.map((player) => (
                <ClueInput
                  key={player.id}
                  player={player}
                  onClueChange={handleClueChange}
                  disabled={gameData.allCluesSubmitted}
                />
              ))}
            </div>

            {!gameData.allCluesSubmitted && (
              <div className="text-center mt-6">
                <Button 
                  size="lg" 
                  onClick={handleAllCluesSubmit}
                  disabled={!gameData.players.every(p => p.clue && p.clue.trim() !== '')}
                  className="px-8"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Enviar pistas
                </Button>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Todos los jugadores deben escribir una pista antes de continuar
                </p>
              </div>
            )}

            {gameData.allCluesSubmitted && (
              <div className="text-center">
                <Button size="lg" onClick={() => setGameData({...gameData, gamePhase: 'voting'})}>
                  Continuar a la votación
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  // Voting Phase - Vote for who to eliminate
  if (gameData.gamePhase === 'voting') {
    return (
      <>
        {/* Modal de confirmación para salir */}
        {showExitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={cancelExit}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-10">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900/20">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                  ¿Estás seguro de que quieres salir?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Se perderán todos los datos de la partida actual y tendrás que empezar de nuevo.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={cancelExit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmExit}
                  className="flex-1"
                >
                  Salir de todas formas
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Ronda {gameData.round} - Votación
          </h1>
        </div>

        <div className="space-y-6">
          {/* Show all clues */}
          <Card>
            <CardHeader>
              <CardTitle>Pistas de esta ronda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {gameData.players.map((player) => (
                  <div key={player.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-sm font-medium">{player.name}:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">&ldquo;{player.clue}&rdquo;</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Voting */}
          <Card>
            <CardHeader>
              <CardTitle>¿A quién votas?</CardTitle>
              <CardDescription>
                Selecciona al jugador que crees que es sospechoso (Mr. White, Undercover, o Payaso)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {gameData.players.map(player => (
                  <label key={player.id} className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="vote"
                      value={player.id}
                      checked={selectedVotedPlayer === player.id}
                      onChange={(e) => setSelectedVotedPlayer(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="flex-1">{player.name}</span>
                  </label>
                ))}
              </div>

              <Button 
                onClick={handleVote} 
                disabled={!selectedVotedPlayer}
                size="lg" 
                className="w-full"
              >
                <VoteIcon className="h-4 w-4 mr-2" />
                Confirmar voto y ver resultados
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </>
    );
  }

  // Results Phase
  if (gameData.gamePhase === 'results' && gameData.winner) {
    const votedPlayer = gameData.players.find(p => p.id === gameData.votedPlayerId);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={resetGame}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Nuevo juego
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            ¡Juego terminado!
          </h1>
        </div>

        <div className="space-y-6">
          {/* Winner announcement */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">
                {gameData.winner === 'civilians' && '🎉 ¡Ganaron los Civiles!'}
                {gameData.winner === 'mister_white' && '🕵️ ¡Ganó Mr. White!'}
                {gameData.winner === 'undercover' && '🥸 ¡Ganó el Undercover!'}
                {gameData.winner === 'payaso' && '🤡 ¡Ganó el Payaso!'}
              </CardTitle>
              <CardDescription>
                {votedPlayer && `Jugador votado: ${votedPlayer.name}`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Role revelation */}
          <Card>
            <CardHeader>
              <CardTitle>Revelación de roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameData.players.map(player => {
                  const roleInfo = getRoleInfo(player);
                  const wasVoted = player.id === gameData.votedPlayerId;
                  return (
                    <div 
                      key={player.id} 
                      className={`p-4 rounded border ${wasVoted ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {roleInfo.icon} {player.name} {wasVoted && '🗳️'}
                        </span>
                        <span className={`px-3 py-1 rounded text-xs text-white ${roleInfo.color}`}>
                          {roleInfo.title.replace('Eres ', '').replace('el ', '')}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <p>Palabra: <strong>{player.word !== '???' ? player.word : 'No conocía la palabra'}</strong></p>
                        <p>Pista: <em>&ldquo;{player.clue}&rdquo;</em></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Game info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del juego</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Palabra civil:</strong> {gameData.civilianWord}</p>
              {gameData.undercoverWord && (
                <p><strong>Palabra undercover:</strong> {gameData.undercoverWord}</p>
              )}
              {gameData.category && (
                <p><strong>Categoría:</strong> {gameData.category}</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={continueWithSameConfig} variant="outline" size="lg" className="w-full">
                Continuar con la misma configuración
              </Button>
              <Button onClick={resetGame} size="lg" className="w-full">
                Jugar con nueva configuración
              </Button>
            </div>
            <Button onClick={handleEditPlayers} variant="secondary" size="lg" className="w-full">
              Modificar jugadores
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de confirmación para salir */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={cancelExit}
          ></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-10">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900/20">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">
                ¿Estás seguro de que quieres salir?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Se perderán todos los datos de la partida actual y tendrás que empezar de nuevo.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={cancelExit}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmExit}
                className="flex-1"
              >
                Salir de todas formas
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Component for clue input
function ClueInput({ 
  player, 
  onClueChange, 
  disabled 
}: { 
  player: Player; 
  onClueChange: (playerId: string, clue: string) => void;
  disabled: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newClue = e.target.value;
    onClueChange(player.id, newClue);
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">{player.name}</Label>
        {disabled && <span className="text-xs text-green-600">✓ Pista enviada</span>}
      </div>
      <Input
        value={player.clue || ''}
        onChange={handleChange}
        placeholder="Escribe tu pista aquí..."
        disabled={disabled}
        maxLength={50}
        className="w-full"
      />
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

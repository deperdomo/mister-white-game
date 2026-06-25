'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Eye, EyeOff, Send, Vote as VoteIcon, SkipForward, Lock, Check, PartyPopper, VenetianMask, Glasses, Drama } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { initializeGame, initializeGameWithDatabaseWords, initializeGameWithRotation, initializeGameWithDatabaseWordsAndRotation, allPlayersRevealed, processVote, getRoleInfo } from "../lib/game-logic";
import { Player, LocalGameData, LocalGameConfig, PLAYER_ROLES } from "../lib/types";
import { useNavigationGuard } from "../contexts/NavigationGuardContext";

function LocalGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGuard, requestNavigation } = useNavigationGuard();

  const [gameData, setGameData] = useState<LocalGameData | null>(null);
  const [showRole, setShowRole] = useState(false);
  const [selectedVotedPlayer, setSelectedVotedPlayer] = useState<string>('');

  // Proteger contra salidas accidentales mientras haya una partida cargada
  // (incluida la pantalla de resultados: salir ahí también pierde la configuración).
  useEffect(() => {
    setGuard(!!gameData);
    return () => setGuard(false);
  }, [gameData, setGuard]);

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
          
          // Ensure all required fields are present to avoid hydration issues
          const gameDataWithDefaults = {
            ...newGameData,
            startingPlayerIndex: newGameData.startingPlayerIndex ?? 0,
            currentPlayerIndex: newGameData.currentPlayerIndex ?? 0,
            players: newGameData.players || [],
            // Explicitly preserve pre-fetched words properties
            preFetchedWords: newGameData.preFetchedWords,
            currentWordIndex: newGameData.currentWordIndex
          };
          
          // Additional validation to ensure we have valid data
          if (gameDataWithDefaults.players.length === 0) {
            console.error('No players found in game data');
            router.push('/local');
            return;
          }
          
          setGameData(gameDataWithDefaults);
          
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
    
    // Calculate the actual player index based on starting player rotation
    const actualPlayerIndex = (gameData.currentPlayerIndex + gameData.startingPlayerIndex) % gameData.players.length;
    const currentPlayer = gameData.players[actualPlayerIndex];
    
    // Assign revelation order to the current player
    const updatedPlayers = gameData.players.map(p => 
      p.id === currentPlayer.id ? { 
        ...p, 
        wordRevealed: true,
        revelationOrder: gameData.currentPlayerIndex // Use currentPlayerIndex as the revelation order
      } : p
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

  // Skip clues phase and go directly to voting
  const handleSkipClues = () => {
    if (!gameData) return;
    
    // Set default clues for players who haven't written any
    const updatedPlayers = gameData.players.map(p => ({
      ...p,
      clue: p.clue && p.clue.trim() !== '' ? p.clue : '(Sin pista)'
    }));
    
    setGameData({
      ...gameData,
      players: updatedPlayers,
      allCluesSubmitted: true,
      gamePhase: 'voting',
    });
  };

  // Handle voting
  const handleVote = () => {
    if (!gameData || !selectedVotedPlayer) return;

    const finalGameData = processVote(gameData, selectedVotedPlayer);
    setGameData(finalGameData);
  };

  // Skip voting and go straight to revealing the roles (no one eliminated)
  const handleSkipVoting = () => {
    if (!gameData) return;

    setGameData({
      ...gameData,
      votedPlayerId: undefined,
      winner: null,
      gamePhase: 'results',
    });
  };

  const resetGame = () => {
    router.push('/local');
  };

  const handleGoBack = () => {
    // Si hay una partida en curso, el guardia global muestra el aviso de salida
    requestNavigation(() => router.push('/local'));
  };

  const continueWithSameConfig = async () => {
    if (!gameData) return;
    
    // Calcular el siguiente jugador que debe empezar
    const nextStartingPlayerIndex = (gameData.startingPlayerIndex + 1) % gameData.originalConfig.players.length;
    const nextRound = gameData.round + 1;

    // Debug: Log the current game state before proceeding
    console.log(`🔍 [DEBUG] continueWithSameConfig Round ${nextRound}:`, {
      useDatabase: gameData.originalConfig.useDatabase,
      hasPreFetchedWords: !!gameData.preFetchedWords,
      preFetchedWordsLength: gameData.preFetchedWords?.length || 0,
      currentWordIndex: gameData.currentWordIndex,
      nextWordIndex: gameData.currentWordIndex !== undefined ? gameData.currentWordIndex + 1 : 'undefined',
      firstWord: gameData.preFetchedWords?.[0]?.civilian || 'none',
      currentWord: gameData.preFetchedWords?.[gameData.currentWordIndex || 0]?.civilian || 'none',
      nextWord: gameData.preFetchedWords?.[gameData.currentWordIndex !== undefined ? gameData.currentWordIndex + 1 : 1]?.civilian || 'none',
      entireOriginalConfig: gameData.originalConfig
    });
    
    // Reiniciar el juego con la misma configuración pero rotando el jugador inicial
    let newGameData;
    if (gameData.originalConfig.useDatabase) {
      // Check if we have pre-fetched words available
      if (gameData.preFetchedWords && gameData.currentWordIndex !== undefined) {
        const nextWordIndex = gameData.currentWordIndex + 1;
        
        console.log(`✅ [DEBUG] Round ${nextRound}: Pre-fetched words check passed, nextWordIndex: ${nextWordIndex}, available words: ${gameData.preFetchedWords.length}`);
        
        // If we still have words available, use them
        if (nextWordIndex < gameData.preFetchedWords.length) {
          console.log(`✅ [DEBUG] Round ${nextRound}: Using pre-fetched word at index ${nextWordIndex}: "${gameData.preFetchedWords[nextWordIndex]?.civilian}"`);
          newGameData = await initializeGameWithDatabaseWordsAndRotation(
            gameData.originalConfig.players,
            gameData.originalConfig.difficulty,
            gameData.originalConfig.includeUndercover,
            gameData.originalConfig.maxMisterWhites,
            gameData.originalConfig.category,
            nextStartingPlayerIndex,
            nextRound,
            gameData.preFetchedWords,
            nextWordIndex
          );
        } else {
          // No more pre-fetched words, fetch new batch
          console.log(`⚠️ [DEBUG] Round ${nextRound}: No more pre-fetched words available, fetching new batch...`);
          newGameData = await initializeGameWithDatabaseWordsAndRotation(
            gameData.originalConfig.players,
            gameData.originalConfig.difficulty,
            gameData.originalConfig.includeUndercover,
            gameData.originalConfig.maxMisterWhites,
            gameData.originalConfig.category,
            nextStartingPlayerIndex,
            nextRound
          );
        }
      } else {
        // No pre-fetched words available, make regular call
        console.log(`❌ [DEBUG] Round ${nextRound}: Pre-fetched words check failed - preFetchedWords: ${!!gameData.preFetchedWords}, currentWordIndex: ${gameData.currentWordIndex}`);
        newGameData = await initializeGameWithDatabaseWordsAndRotation(
          gameData.originalConfig.players,
          gameData.originalConfig.difficulty,
          gameData.originalConfig.includeUndercover,
          gameData.originalConfig.maxMisterWhites,
          gameData.originalConfig.category,
          nextStartingPlayerIndex,
          nextRound
        );
      }
    } else {
      newGameData = initializeGameWithRotation(
        gameData.originalConfig.players,
        gameData.originalConfig.difficulty,
        gameData.originalConfig.includeUndercover,
        gameData.originalConfig.maxMisterWhites,
        undefined,
        nextStartingPlayerIndex,
        nextRound
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
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="mb-4 text-muted">Cargando juego...</p>
        <Button onClick={handleGoBack}>Volver atrás</Button>
      </div>
    );
  }

  // Word Reveal Phase - Each player sees their role and word
  if (gameData.gamePhase === 'wordReveal') {
    // Calculate the actual player index based on starting player rotation
    const actualPlayerIndex = (gameData.currentPlayerIndex + gameData.startingPlayerIndex) % gameData.players.length;
    const currentPlayer = gameData.players[actualPlayerIndex];
    
    // Defensive check to prevent errors
    if (!currentPlayer) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-md text-center">
          <p className="mb-4 text-muted">Error: Jugador no encontrado. Reiniciando...</p>
          <Button onClick={() => router.push('/local')}>Volver al inicio</Button>
        </div>
      );
    }
    
    const roleInfo = getRoleInfo(currentPlayer);
    const RoleIcon = roleInfo.icon;

    return (
      <>
        
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack} aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-fg">
              Ronda {gameData.round} · Revelar Roles
            </h1>
          </div>

          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent ring-1 ring-accent/20">
                {currentPlayer.name.charAt(0).toUpperCase()}
              </div>
              <CardTitle>Turno de {currentPlayer.name}</CardTitle>
              <CardDescription>
                Jugador {gameData.currentPlayerIndex + 1} de {gameData.players.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showRole ? (
                <>
                  <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-panel p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
                      <Eye className="h-6 w-6 text-accent" />
                    </div>
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-faint">
                      <Lock className="h-3.5 w-3.5" /> Que nadie más vea la pantalla
                    </p>
                  </div>

                  <Button onClick={handleRevealWord} size="lg" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver mi rol
                  </Button>
                </>
              ) : (
                <>
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className={`px-6 py-6 text-center ${roleInfo.tint}`}>
                      <RoleIcon className="mx-auto mb-2 h-12 w-12" />
                      <h3 className="text-xl font-bold">{roleInfo.title}</h3>
                      <p className="mt-1 text-sm opacity-80">{roleInfo.description}</p>
                    </div>
                    <div className="bg-surface px-6 py-5 text-center">
                      <p className="eyebrow mb-2">Tu palabra</p>
                      <p className="text-3xl font-bold tracking-tight text-fg">{roleInfo.word}</p>
                    </div>
                  </div>

                  {gameData.category && (
                    <p className="text-center text-sm text-muted">
                      Categoría: <strong className="text-fg">{gameData.category}</strong>
                    </p>
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
            <div className="flex justify-between text-sm mb-2 text-muted">
              <span>Progreso</span>
              <span className="tabular-nums">{gameData.currentPlayerIndex + 1}/{gameData.players.length}</span>
            </div>
            <div className="w-full rounded-full h-2 bg-elevated">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
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
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-fg">
            Ronda {gameData.round} - Pistas
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los jugadores deben dar una pista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {gameData.category && (
              <div className="text-center p-4 rounded bg-panel">
                <p className="text-sm text-muted">
                  Categoría: <strong>{gameData.category}</strong>
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {gameData.players
                .slice() // Create a copy to avoid mutating the original array
                .sort((a, b) => {
                  // Sort by revelation order, putting players who revealed first at the top
                  // Players without revelationOrder (shouldn't happen) go to the end
                  if (a.revelationOrder === undefined && b.revelationOrder === undefined) return 0;
                  if (a.revelationOrder === undefined) return 1;
                  if (b.revelationOrder === undefined) return -1;
                  return a.revelationOrder - b.revelationOrder;
                })
                .map((player) => (
                <ClueInput
                  key={player.id}
                  player={player}
                  onClueChange={handleClueChange}
                  disabled={gameData.allCluesSubmitted}
                />
              ))}
            </div>

            {!gameData.allCluesSubmitted && (
              <div className="text-center mt-6 space-y-4">
                <Button 
                  size="lg" 
                  onClick={handleAllCluesSubmit}
                  disabled={!gameData.players.every(p => p.clue && p.clue.trim() !== '')}
                  className="px-8"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Enviar pistas
                </Button>

                {/* Botón para saltar pistas */}
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSkipClues}
                    className="text-muted"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Saltar pistas e ir a votación
                  </Button>
                </div>
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
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-fg">
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
                  <div key={player.id} className="p-3 rounded bg-panel">
                    <p className="text-sm font-medium">{player.name}:</p>
                    <p className="text-sm text-muted">&ldquo;{player.clue}&rdquo;</p>
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
                {gameData.players
                  .slice() // Create a copy to avoid mutating the original array
                  .sort((a, b) => {
                    // Sort by revelation order, putting players who revealed first at the top
                    // Players without revelationOrder (shouldn't happen) go to the end
                    if (a.revelationOrder === undefined && b.revelationOrder === undefined) return 0;
                    if (a.revelationOrder === undefined) return 1;
                    if (b.revelationOrder === undefined) return -1;
                    return a.revelationOrder - b.revelationOrder;
                  })
                  .map(player => (
                  <label key={player.id} className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-panel">
                    <input
                      type="radio"
                      name="vote"
                      value={player.id}
                      checked={selectedVotedPlayer === player.id}
                      onChange={(e) => setSelectedVotedPlayer(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span>{player.name}</span>
                    </div>
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

              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipVoting}
                  className="text-muted"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Saltar votación y revelar roles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </>
    );
  }

  // Results Phase
  if (gameData.gamePhase === 'results') {
    const votedPlayer = gameData.players.find(p => p.id === gameData.votedPlayerId);
    const votingSkipped = !gameData.winner;

    // Solo se revelan los roles importantes (no civiles): Mr. White, Undercover y Payaso
    const specialPlayers = gameData.players
      .filter(p => p.role !== PLAYER_ROLES.CIVIL)
      .sort((a, b) => {
        if (a.revelationOrder === undefined && b.revelationOrder === undefined) return 0;
        if (a.revelationOrder === undefined) return 1;
        if (b.revelationOrder === undefined) return -1;
        return a.revelationOrder - b.revelationOrder;
      });

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-fg">
            ¡Juego terminado!
          </h1>
        </div>

        <div className="space-y-6">
          {/* Winner announcement */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-3xl">
                {votingSkipped && <><Drama className="h-7 w-7" /> Roles revelados</>}
                {gameData.winner === 'civilians' && <><PartyPopper className="h-7 w-7" /> ¡Ganaron los Civiles!</>}
                {gameData.winner === 'mister_white' && <><VenetianMask className="h-7 w-7" /> ¡Ganó Mr. White!</>}
                {gameData.winner === 'undercover' && <><Glasses className="h-7 w-7" /> ¡Ganó el Undercover!</>}
                {gameData.winner === 'payaso' && <><Drama className="h-7 w-7" /> ¡Ganó el Payaso!</>}
              </CardTitle>
              <CardDescription>
                {votingSkipped
                  ? 'Se saltó la votación: nadie fue eliminado'
                  : votedPlayer && `Jugador votado: ${votedPlayer.name}`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Role revelation — solo roles importantes (no civiles) */}
          <Card>
            <CardHeader>
              <CardTitle>Roles ocultos</CardTitle>
            </CardHeader>
            <CardContent>
              {specialPlayers.length === 0 ? (
                <p className="text-sm text-muted">No había roles especiales en esta ronda.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {specialPlayers.map(player => {
                    const roleInfo = getRoleInfo(player);
                    const RoleIcon = roleInfo.icon;
                    const wasVoted = player.id === gameData.votedPlayerId;
                    const roleLabel = roleInfo.title.replace('Eres ', '').replace('el ', '');
                    return (
                      <div
                        key={player.id}
                        className={`rounded-2xl border p-4 ${wasVoted ? 'border-rose-500/30 bg-rose-500/[0.06]' : 'border-white/[0.08] bg-panel'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${roleInfo.tint}`}>
                            <RoleIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-fg">{player.name}</span>
                              {wasVoted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                                  <VoteIcon className="h-3 w-3" /> Eliminado
                                </span>
                              )}
                            </div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${roleInfo.tint}`}>
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-sm text-muted">
                          <p>
                            Palabra:{' '}
                            <strong className="text-fg">
                              {player.word !== '???' ? player.word : 'No la conocía'}
                            </strong>
                          </p>
                          <p>
                            Pista: <em>&ldquo;{player.clue}&rdquo;</em>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <Button onClick={resetGame} variant="outline" size="lg" className="w-full">
                Jugar con nueva configuración
              </Button>
              <Button onClick={continueWithSameConfig} size="lg" className="w-full">
                Siguiente ronda
              </Button>
            </div>
            <Button onClick={handleEditPlayers} variant="secondary" size="lg" className="w-full">
              Editar configuración
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
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
        <div className="flex items-center gap-2">
          <Label className="font-medium">{player.name}</Label>
        </div>
        {disabled && <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Pista enviada</span>}
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
        <p className="text-muted">Preparando juego local...</p>
      </div>
    }>
      <LocalGameContent />
    </Suspense>
  );
}

import { Player, LocalGameData, PLAYER_ROLES, PreFetchedWord, LocalGameConfig } from './types';
import { shuffleArrayWithSeed } from './utils';
import { GAME_WORDS } from './static-words';

// Interface para palabras desde la base de datos
interface DatabaseWord {
  id: string;
  category: string;
  civilWord: string;
  undercoverWord: string;
  difficulty: string;
}

// Función para obtener palabras desde la base de datos
export async function getWordFromDatabase(difficulty: string, category?: string): Promise<DatabaseWord | null> {
  try {
    const params = new URLSearchParams({ difficulty });
    if (category && category !== 'all') {
      params.append('category', category);
    }

    const response = await fetch(`/api/words?${params}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching word from database:', data.error);
      return null;
    }

    return data.word;
  } catch (error) {
    console.error('Failed to fetch word from database:', error);
    return null;
  }
}

// Función para obtener múltiples palabras desde la base de datos
export async function getMultipleWordsFromDatabase(
  difficulty: string, 
  category?: string, 
  count: number = 10
): Promise<PreFetchedWord[]> {
  console.log(`🔍 [DEBUG] Fetching ${count} words from database - difficulty: ${difficulty}, category: ${category || 'all'}`);
  
  try {
    const params = new URLSearchParams({ 
      difficulty,
      count: count.toString()
    });
    if (category && category !== 'all') {
      params.append('category', category);
    }

    const response = await fetch(`/api/words?${params}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [DEBUG] Error fetching words from database:', data.error);
      return [];
    }

    // If the API returns multiple words, map them to our format
    if (Array.isArray(data.words)) {
      const mappedWords = data.words.map((word: DatabaseWord) => ({
        civilian: word.civilWord,
        undercover: word.undercoverWord,
        category: word.category
      }));
      console.log(`✅ [DEBUG] Successfully fetched ${mappedWords.length} words from database:`, mappedWords.map((w: PreFetchedWord) => w.civilian));
      return mappedWords;
    }
    
    // If the API returns a single word, wrap it in an array
    if (data.word) {
      const singleWord = {
        civilian: data.word.civilWord,
        undercover: data.word.undercoverWord,
        category: data.word.category
      };
      console.log(`✅ [DEBUG] Successfully fetched 1 word from database:`, singleWord.civilian);
      return [singleWord];
    }

    console.log(`⚠️ [DEBUG] No words returned from database`);
    return [];
  } catch (error) {
    console.error('❌ [DEBUG] Failed to fetch words from database:', error);
    return [];
  }
}

export const MR_WHITE_MESSAGE = "Eres Mr. White";
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

// Initialize game with new mechanics from referenced repository
export function initializeGame(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  customWord?: { civilian: string; undercover: string; category?: string },
  seedValue?: number
): LocalGameData {
  const numPlayers = playerNames.length;
  
  if (numPlayers < MIN_PLAYERS || numPlayers > MAX_PLAYERS) {
    throw new Error(`Number of players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }

  // Use a deterministic seed based on player names and game config if no seed provided
  const gameSeed = seedValue ?? (
    playerNames.join('').length + 
    (includeUndercover ? 1 : 0) + 
    maxMisterWhites + 
    difficulty.length
  );

  // Select word pair - use custom word if provided, otherwise fallback to static words
  let selectedWord;
  if (customWord) {
    selectedWord = {
      category: customWord.category || 'Custom',
      civilian: customWord.civilian,
      undercover: customWord.undercover,
      difficulty
    };
    console.log(`🎯 [DEBUG] Using custom word: "${selectedWord.civilian}"`);
  } else {
    const availableWords = GAME_WORDS.filter(w => w.difficulty === difficulty);
    const wordIndex = gameSeed % availableWords.length;
    selectedWord = availableWords[wordIndex] || GAME_WORDS[0];
    console.log(`📚 [DEBUG] Using STATIC word: "${selectedWord.civilian}" (from static-words.ts)`);
  }
  
  // Determine roles
  const includePayaso = numPlayers >= 8;
  let actualMisterWhites = Math.min(maxMisterWhites, Math.floor(numPlayers / 3));
  
  // Ensure we don't have too many special roles
  const specialRolesCount = actualMisterWhites + (includeUndercover ? 1 : 0) + (includePayaso ? 1 : 0);
  if (specialRolesCount >= numPlayers) {
    if (includePayaso) {
      actualMisterWhites = Math.max(0, numPlayers - (includeUndercover ? 1 : 0) - 1 - 1); // Leave at least 1 civilian
    } else {
      actualMisterWhites = Math.max(0, numPlayers - (includeUndercover ? 1 : 0) - 1); // Leave at least 1 civilian
    }
  }

  // Create shuffled indices for role assignment
  const indices = Array.from(Array(numPlayers).keys());
  const shuffledIndices = shuffleArrayWithSeed(indices, gameSeed);
  
  let undercoverIndex: number | undefined;
  let payasoIndex: number | undefined;
  const misterWhiteIndices = new Set<number>();
  
  let currentIndex = 0;
  
  // Assign undercover if enabled
  if (includeUndercover && shuffledIndices.length > currentIndex) {
    undercoverIndex = shuffledIndices[currentIndex++];
  }
  
  // Assign payaso if enabled (8+ players)
  if (includePayaso && shuffledIndices.length > currentIndex) {
    payasoIndex = shuffledIndices[currentIndex++];
  }
  
  // Assign mister whites
  for (let i = 0; i < actualMisterWhites && currentIndex < shuffledIndices.length; i++) {
    misterWhiteIndices.add(shuffledIndices[currentIndex++]);
  }

  // Create players with assigned roles and words
  const players: Player[] = playerNames.map((name, index) => {
    let role: Player['role'] = PLAYER_ROLES.CIVIL;
    let word = selectedWord.civilian;
    
    if (index === undercoverIndex) {
      role = PLAYER_ROLES.UNDERCOVER;
      word = selectedWord.undercover;
    } else if (index === payasoIndex) {
      role = PLAYER_ROLES.PAYASO;
      word = selectedWord.civilian; // Payaso knows the civilian word
    } else if (misterWhiteIndices.has(index)) {
      role = PLAYER_ROLES.MISTER_WHITE;
      word = MR_WHITE_MESSAGE;
    }
    
    return {
      id: `player-${index}-${Date.now()}`,
      name: name.trim(),
      role,
      word,
      isHost: index === 0,
      isAlive: true,
      joinedAt: new Date().toISOString(),
      wordRevealed: false,
      clue: '',
      revelationOrder: undefined, // Reset revelation order for each new game
    };
  });

  return {
    players,
    civilianWord: selectedWord.civilian,
    undercoverWord: includeUndercover ? selectedWord.undercover : undefined,
    category: difficulty === 'easy' ? selectedWord.category : undefined, // Only show category on easy
    gamePhase: 'wordReveal',
    currentPlayerIndex: 0,
    allCluesSubmitted: false,
    includeUndercover,
    round: 1,
    originalConfig: {
      players: playerNames,
      difficulty,
      includeUndercover,
      maxMisterWhites,
      useDatabase: false, // This function doesn't use database
    },
    startingPlayerIndex: 0, // First game always starts with player 0
  };
}

// Initialize game with rotation support for subsequent rounds
export function initializeGameWithRotation(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  customWord?: { civilian: string; undercover: string; category?: string },
  startingPlayerIndex: number = 0,
  roundNumber: number = 1,
  preserveOriginalConfig?: LocalGameConfig
): LocalGameData {
  // Use round number as part of the seed to ensure different games each round
  const seed = (
    playerNames.join('').length + 
    (includeUndercover ? 1 : 0) + 
    maxMisterWhites + 
    difficulty.length +
    roundNumber * 1000 // Multiply to create significant difference
  );

  const gameData = initializeGame(
    playerNames,
    difficulty,
    includeUndercover,
    maxMisterWhites,
    customWord,
    seed
  );

  return {
    ...gameData,
    currentPlayerIndex: 0, // Always start counting from 0
    startingPlayerIndex,
    round: roundNumber,
    // Preserve original config if provided, otherwise create a basic one
    originalConfig: preserveOriginalConfig || {
      players: playerNames,
      difficulty,
      includeUndercover,
      maxMisterWhites,
      useDatabase: false // Default to false since this is the non-database path
    }
  };
}

// Función asíncrona para inicializar juego con palabras de la base de datos
export async function initializeGameWithDatabaseWords(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  category?: string
): Promise<LocalGameData> {
  try {
    // Create deterministic seed
    const seed = (
      playerNames.join('').length + 
      (includeUndercover ? 1 : 0) + 
      maxMisterWhites + 
      difficulty.length
    );

    // Pre-fetch multiple words from database for subsequent rounds
    const preFetchedWords = await getMultipleWordsFromDatabase(difficulty, category, 15);
    
    if (preFetchedWords.length > 0) {
      // Use first word from the pre-fetched batch
      const firstWord = preFetchedWords[0];
      console.log(`🎯 [DEBUG] Round 1: Using first pre-fetched word from database: "${firstWord.civilian}"`);
      const gameData = initializeGame(
        playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        {
          civilian: firstWord.civilian,
          undercover: firstWord.undercover,
          category: firstWord.category
        },
        seed
      );
      
      // Add pre-fetched words to game data
      return {
        ...gameData,
        startingPlayerIndex: 0,
        preFetchedWords,
        currentWordIndex: 0,
        originalConfig: {
          players: playerNames,
          difficulty,
          includeUndercover,
          maxMisterWhites,
          useDatabase: true,
          category
        }
      };
    } else {
      // Fallback a palabras estáticas si no hay conexión con la BD
      console.warn('⚠️ [DEBUG] Round 1: Could not fetch words from database, falling back to STATIC WORDS');
      const gameData = initializeGame(playerNames, difficulty, includeUndercover, maxMisterWhites, undefined, seed);
      return {
        ...gameData,
        startingPlayerIndex: 0,
        originalConfig: {
          players: playerNames,
          difficulty,
          includeUndercover,
          maxMisterWhites,
          useDatabase: true,
          category
        }
      };
    }
  } catch (error) {
    console.error('❌ [DEBUG] Round 1: Error initializing game with database words:', error);
    // Fallback a palabras estáticas en caso de error
    console.warn('⚠️ [DEBUG] Round 1: Falling back to STATIC WORDS due to error');
    const seed = (
      playerNames.join('').length + 
      (includeUndercover ? 1 : 0) + 
      maxMisterWhites + 
      difficulty.length
    );
    const gameData = initializeGame(playerNames, difficulty, includeUndercover, maxMisterWhites, undefined, seed);
    return {
      ...gameData,
      startingPlayerIndex: 0,
      originalConfig: {
        players: playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        useDatabase: true,
        category
      }
    };
  }
}

// Initialize game with database words and rotation support
export async function initializeGameWithDatabaseWordsAndRotation(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  category?: string,
  startingPlayerIndex: number = 0,
  roundNumber: number = 1,
  preFetchedWords?: PreFetchedWord[],
  currentWordIndex?: number
): Promise<LocalGameData> {
  // Debug: Log what we received
  console.log(`🔍 [DEBUG] Round ${roundNumber}: initializeGameWithDatabaseWordsAndRotation called with:`, {
    preFetchedWords: preFetchedWords ? `${preFetchedWords.length} words` : 'none',
    currentWordIndex,
    firstWord: preFetchedWords?.[0]?.civilian || 'none',
    wordAtIndex: preFetchedWords?.[currentWordIndex || 0]?.civilian || 'none'
  });

  // If we have pre-fetched words and a valid index, use them
  if (preFetchedWords && currentWordIndex !== undefined && preFetchedWords[currentWordIndex]) {
    console.log(`✅ [DEBUG] Round ${roundNumber}: Using pre-fetched words path`);
    return initializeGameWithPreFetchedWords(
      playerNames,
      difficulty,
      includeUndercover,
      maxMisterWhites,
      preFetchedWords,
      currentWordIndex,
      startingPlayerIndex,
      roundNumber
    );
  } else {
    console.log(`⚠️ [DEBUG] Round ${roundNumber}: Pre-fetched words check failed:`, {
      hasPrefetched: !!preFetchedWords,
      hasIndex: currentWordIndex !== undefined,
      wordExists: !!(preFetchedWords && currentWordIndex !== undefined && preFetchedWords[currentWordIndex])
    });
  }

  try {
    // Intentar obtener palabra de la base de datos
    console.log(`🔍 [DEBUG] Round ${roundNumber}: Attempting to fetch single word from database (no pre-fetched words available)`);
    const databaseWord = await getWordFromDatabase(difficulty, category);
    
    if (databaseWord) {
      // Usar palabra de la base de datos
      console.log(`✅ [DEBUG] Round ${roundNumber}: Using single word from database: "${databaseWord.civilWord}"`);
      return initializeGameWithRotation(
        playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        {
          civilian: databaseWord.civilWord,
          undercover: databaseWord.undercoverWord,
          category: databaseWord.category
        },
        startingPlayerIndex,
        roundNumber,
        // Preserve the original config with useDatabase: true
        {
          players: playerNames,
          difficulty,
          includeUndercover,
          maxMisterWhites,
          useDatabase: true,
          category
        }
      );
    } else {
      // Fallback a palabras estáticas si no hay conexión con la BD
      console.warn(`⚠️ [DEBUG] Round ${roundNumber}: Could not fetch word from database, falling back to STATIC WORDS`);
      return initializeGameWithRotation(
        playerNames, 
        difficulty, 
        includeUndercover, 
        maxMisterWhites, 
        undefined, 
        startingPlayerIndex, 
        roundNumber
      );
    }
  } catch (error) {
    console.error(`❌ [DEBUG] Round ${roundNumber}: Error initializing game with database words:`, error);
    // Fallback a palabras estáticas en caso de error
    console.warn(`⚠️ [DEBUG] Round ${roundNumber}: Falling back to STATIC WORDS due to error`);
    return initializeGameWithRotation(
      playerNames, 
      difficulty, 
      includeUndercover, 
      maxMisterWhites, 
      undefined, 
      startingPlayerIndex, 
      roundNumber
    );
  }
}

// Initialize game with database words and rotation support using pre-fetched words
export function initializeGameWithPreFetchedWords(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  preFetchedWords: PreFetchedWord[],
  currentWordIndex: number,
  startingPlayerIndex: number = 0,
  roundNumber: number = 1,
  category?: string
): LocalGameData {
  // Get the next word from pre-fetched words
  const wordToUse = preFetchedWords[currentWordIndex] || null;
  
  if (wordToUse) {
    // Use pre-fetched word
    console.log(`🎯 [DEBUG] Round ${roundNumber}: Using pre-fetched word from database: "${wordToUse.civilian}" (index ${currentWordIndex})`);
    const gameData = initializeGameWithRotation(
      playerNames,
      difficulty,
      includeUndercover,
      maxMisterWhites,
      {
        civilian: wordToUse.civilian,
        undercover: wordToUse.undercover,
        category: wordToUse.category
      },
      startingPlayerIndex,
      roundNumber,
      // Pass the correct originalConfig to preserve useDatabase: true
      {
        players: playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        useDatabase: true,
        category
      }
    );
    
    return {
      ...gameData,
      preFetchedWords,
      currentWordIndex
    };
  } else {
    // Fallback to static words if we run out of pre-fetched words
    console.warn(`⚠️ [DEBUG] Round ${roundNumber}: No more pre-fetched words available (index ${currentWordIndex}), falling back to STATIC WORDS`);
    return initializeGameWithRotation(
      playerNames, 
      difficulty, 
      includeUndercover, 
      maxMisterWhites, 
      undefined, 
      startingPlayerIndex, 
      roundNumber,
      // Even in fallback, preserve the original database config
      {
        players: playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        useDatabase: true,
        category
      }
    );
  }
}

// Check if all players have revealed their words/roles
export function allPlayersRevealed(players: Player[]): boolean {
  return players.every(p => p.wordRevealed);
}

// Check if all players have submitted clues
export function allCluesSubmitted(players: Player[]): boolean {
  return players.every(p => p.clue && p.clue.trim() !== '');
}

// Process voting and determine winner
export function processVote(gameData: LocalGameData, votedPlayerId: string): LocalGameData {
  const votedPlayer = gameData.players.find(p => p.id === votedPlayerId);
  if (!votedPlayer) {
    return gameData;
  }

  let winner: LocalGameData['winner'] = null;
  
  // Check win conditions based on who was voted
  if (votedPlayer.role === PLAYER_ROLES.PAYASO) {
    // Payaso wins if voted (regardless of being voted as Mr. White or not)
    winner = 'payaso';
  } else if (votedPlayer.role === PLAYER_ROLES.MISTER_WHITE) {
    // Civilians win if they voted out Mr. White
    winner = 'civilians';
  } else if (votedPlayer.role === PLAYER_ROLES.UNDERCOVER) {
    // Civilians win if they voted out undercover
    winner = 'civilians';
  } else {
    // Voted a civilian - check who else is still in game
    const hasUndercover = gameData.includeUndercover;
    const hasMisterWhite = gameData.players.some(p => p.role === PLAYER_ROLES.MISTER_WHITE);
    const hasPayaso = gameData.players.some(p => p.role === PLAYER_ROLES.PAYASO);
    
    if (hasMisterWhite) {
      winner = 'mister_white'; // Mr. White wins
    } else if (hasUndercover) {
      winner = 'undercover'; // Undercover wins
    } else if (hasPayaso) {
      winner = 'payaso'; // Payaso wins if not voted out
    } else {
      winner = 'civilians'; // Shouldn't happen, but civilians win as fallback
    }
  }

  return {
    ...gameData,
    votedPlayerId,
    winner,
    gamePhase: 'results',
  };
}

// Get role information for display
export function getRoleInfo(player: Player) {
  switch (player.role) {
    case PLAYER_ROLES.CIVIL:
      return {
        title: 'Eres un Civil',
        description: 'Conoces la palabra secreta. Da una pista relacionada sin mencionarla directamente.',
        word: player.word || '',
        color: 'bg-blue-500',
        icon: '👥',
      };
    case PLAYER_ROLES.UNDERCOVER:
      return {
        title: 'Eres Undercover',
        description: 'Tienes una palabra diferente pero relacionada. Da una pista sin ser descubierto.',
        word: player.word || '',
        color: 'bg-purple-500',
        icon: '🥸',
      };
    case PLAYER_ROLES.MISTER_WHITE:
      return {
        title: 'Eres Mr. White',
        description: '¡No conoces la palabra! Escucha las pistas e intenta deducirla.',
        word: '???',
        color: 'bg-red-500',
        icon: '🕵️',
      };
    case PLAYER_ROLES.PAYASO:
      return {
        title: 'Eres el Payaso',
        description: '¡Tu objetivo es que te voten como si fueras Mr. White! Conoces la palabra civil.',
        word: player.word || '',
        color: 'bg-orange-500',
        icon: '🤡',
      };
    default:
      return {
        title: 'Rol desconocido',
        description: '',
        word: '',
        color: 'bg-gray-500',
        icon: '❓',
      };
  }
}

// Interface para los resultados del juego online
export interface OnlineGameResults {
  winner: 'civilians' | 'mister_white' | 'undercover' | 'payaso';
  eliminated: string | null; // nombre del jugador eliminado
  misterWhite: string; // nombre del jugador que era Mister White
  undercover: string | null; // nombre del jugador que era Undercover (si existe)
  payaso: string | null; // nombre del jugador que era Payaso (si existe)
  votes: Record<string, number>; // votos recibidos por cada jugador
  reason: string; // razón de la victoria
}

// Interface para jugador online
interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  role: string | null;
  isAlive: boolean;
  description: string | null;
  votedFor: string | null;
}

// Calcular resultados del juego online
export function calculateOnlineGameResults(players: OnlinePlayer[]): OnlineGameResults {
  // Contar votos
  const votes: Record<string, number> = {};
  players.forEach(player => {
    if (player.votedFor) {
      votes[player.votedFor] = (votes[player.votedFor] || 0) + 1;
    }
  });

  // Encontrar al jugador más votado
  let maxVotes = 0;
  let eliminated: string | null = null;
  Object.entries(votes).forEach(([playerName, voteCount]) => {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      eliminated = playerName;
    }
  });

  // Encontrar jugadores por rol
  const misterWhite = players.find(p => p.role === 'mister_white')?.name || '';
  const undercover = players.find(p => p.role === 'undercover')?.name || null;
  const payaso = players.find(p => p.role === 'payaso')?.name || null;

  // Determinar ganador y razón
  let winner: OnlineGameResults['winner'];
  let reason: string;

  if (!eliminated) {
    // Empate - ganan los civiles por defecto
    winner = 'civilians';
    reason = 'Hubo empate en la votación. Los civiles ganan por defecto.';
  } else if (eliminated === payaso) {
    // Si eliminaron al payaso, el payaso gana
    winner = 'payaso';
    reason = `¡${payaso} (Payaso) fue eliminado y gana la partida!`;
  } else if (eliminated === misterWhite) {
    // Si eliminaron a Mister White, los civiles ganan
    winner = 'civilians';
    reason = `¡Los civiles ganaron! Eliminaron correctamente a ${misterWhite} (Mister White).`;
  } else if (eliminated === undercover) {
    // Si eliminaron al undercover, los civiles ganan
    winner = 'civilians';
    reason = `Los civiles ganaron eliminando a ${undercover} (Undercover).`;
  } else {
    // Si eliminaron a un civil, Mister White gana
    winner = 'mister_white';
    reason = `¡${misterWhite} (Mister White) ganó! Los civiles eliminaron a ${eliminated} por error.`;
  }

  return {
    winner,
    eliminated,
    misterWhite,
    undercover,
    payaso,
    votes,
    reason
  };
}

// Función para obtener el emoji del rol
export function getRoleEmoji(role: string | null): string {
  switch (role) {
    case 'civil': return '👤';
    case 'mister_white': return '🕵️';
    case 'undercover': return '🥸';
    case 'payaso': return '🤡';
    default: return '❓';
  }
}

// Función para obtener el nombre del rol en español
export function getRoleName(role: string | null): string {
  switch (role) {
    case 'civil': return 'Civil';
    case 'mister_white': return 'Mister White';
    case 'undercover': return 'Undercover';
    case 'payaso': return 'Payaso';
    default: return 'Desconocido';
  }
}

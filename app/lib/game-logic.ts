import { Player, LocalGameData, PLAYER_ROLES } from './types';
import { shuffleArray } from './utils';

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

// Expanded word database similar to the referenced repository
export const GAME_WORDS = [
  // Easy difficulty - shows category
  {
    category: 'Comida',
    civilian: 'Pizza',
    undercover: 'Hamburguesa',
    difficulty: 'easy' as const,
  },
  {
    category: 'Animales',
    civilian: 'Gato',
    undercover: 'Perro',
    difficulty: 'easy' as const,
  },
  {
    category: 'Colores',
    civilian: 'Rojo',
    undercover: 'Azul',
    difficulty: 'easy' as const,
  },
  {
    category: 'Frutas',
    civilian: 'Manzana',
    undercover: 'Naranja',
    difficulty: 'easy' as const,
  },
  {
    category: 'Vehículos',
    civilian: 'Coche',
    undercover: 'Moto',
    difficulty: 'easy' as const,
  },
  {
    category: 'Deportes',
    civilian: 'Fútbol',
    undercover: 'Baloncesto',
    difficulty: 'easy' as const,
  },
  
  // Medium difficulty - no category shown
  {
    category: 'Bebidas',
    civilian: 'Café',
    undercover: 'Té',
    difficulty: 'medium' as const,
  },
  {
    category: 'Instrumentos',
    civilian: 'Guitarra',
    undercover: 'Piano',
    difficulty: 'medium' as const,
  },
  {
    category: 'Estaciones',
    civilian: 'Verano',
    undercover: 'Invierno',
    difficulty: 'medium' as const,
  },
  {
    category: 'Profesiones',
    civilian: 'Doctor',
    undercover: 'Enfermero',
    difficulty: 'medium' as const,
  },
  {
    category: 'Tecnología',
    civilian: 'Smartphone',
    undercover: 'Tablet',
    difficulty: 'medium' as const,
  },
  {
    category: 'Lugares',
    civilian: 'Playa',
    undercover: 'Piscina',
    difficulty: 'medium' as const,
  },
  
  // Hard difficulty - no category shown
  {
    category: 'Emociones',
    civilian: 'Felicidad',
    undercover: 'Alegría',
    difficulty: 'hard' as const,
  },
  {
    category: 'Conceptos',
    civilian: 'Libertad',
    undercover: 'Independencia',
    difficulty: 'hard' as const,
  },
  {
    category: 'Materiales',
    civilian: 'Madera',
    undercover: 'Bambú',
    difficulty: 'hard' as const,
  },
  {
    category: 'Ciencias',
    civilian: 'Química',
    undercover: 'Física',
    difficulty: 'hard' as const,
  },
  {
    category: 'Arte',
    civilian: 'Pintura',
    undercover: 'Dibujo',
    difficulty: 'hard' as const,
  },
  {
    category: 'Naturaleza',
    civilian: 'Montaña',
    undercover: 'Colina',
    difficulty: 'hard' as const,
  },
];

export const MR_WHITE_MESSAGE = "Eres Mr. White";
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

// Initialize game with new mechanics from referenced repository
export function initializeGame(
  playerNames: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  includeUndercover: boolean = false,
  maxMisterWhites: number = 1,
  customWord?: { civilian: string; undercover: string; category?: string }
): LocalGameData {
  const numPlayers = playerNames.length;
  
  if (numPlayers < MIN_PLAYERS || numPlayers > MAX_PLAYERS) {
    throw new Error(`Number of players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }

  // Select word pair - use custom word if provided, otherwise fallback to static words
  let selectedWord;
  if (customWord) {
    selectedWord = {
      category: customWord.category || 'Custom',
      civilian: customWord.civilian,
      undercover: customWord.undercover,
      difficulty
    };
  } else {
    const availableWords = GAME_WORDS.filter(w => w.difficulty === difficulty);
    selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)] || GAME_WORDS[0];
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
  const shuffledIndices = shuffleArray(indices);
  
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
    },
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
    // Intentar obtener palabra de la base de datos
    const databaseWord = await getWordFromDatabase(difficulty, category);
    
    if (databaseWord) {
      // Usar palabra de la base de datos
      return initializeGame(
        playerNames,
        difficulty,
        includeUndercover,
        maxMisterWhites,
        {
          civilian: databaseWord.civilWord,
          undercover: databaseWord.undercoverWord,
          category: databaseWord.category
        }
      );
    } else {
      // Fallback a palabras estáticas si no hay conexión con la BD
      console.warn('Could not fetch word from database, using static words');
      return initializeGame(playerNames, difficulty, includeUndercover, maxMisterWhites);
    }
  } catch (error) {
    console.error('Error initializing game with database words:', error);
    // Fallback a palabras estáticas en caso de error
    return initializeGame(playerNames, difficulty, includeUndercover, maxMisterWhites);
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

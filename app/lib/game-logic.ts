import { Player, GameRoom, PLAYER_ROLES } from './types';
import { shuffleArray } from './utils';

// Palabras predefinidas para el juego local
export const GAME_WORDS = [
  {
    category: 'Comida',
    word: 'Pizza',
    undercoverWord: 'Hamburguesa',
    difficulty: 'easy' as const,
  },
  {
    category: 'Animales',
    word: 'Gato',
    undercoverWord: 'Perro',
    difficulty: 'easy' as const,
  },
  {
    category: 'Deportes',
    word: 'Fútbol',
    undercoverWord: 'Baloncesto',
    difficulty: 'medium' as const,
  },
  {
    category: 'Tecnología',
    word: 'Smartphone',
    undercoverWord: 'Tablet',
    difficulty: 'medium' as const,
  },
  {
    category: 'Transporte',
    word: 'Avión',
    undercoverWord: 'Helicóptero',
    difficulty: 'hard' as const,
  },
  {
    category: 'Profesiones',
    word: 'Doctor',
    undercoverWord: 'Enfermero',
    difficulty: 'hard' as const,
  },
] as const;

// Asignar roles aleatoriamente
export function assignRoles(players: Player[]): Player[] {
  const playerCount = players.length;
  
  if (playerCount < 3) {
    throw new Error('Se necesitan al menos 3 jugadores');
  }

  // Lógica de asignación de roles basada en el número de jugadores
  const misterWhiteCount = 1;
  let undercoverCount = Math.floor(playerCount / 3); // Aproximadamente 1/3 de los jugadores
  
  // Ajustar para partidas pequeñas
  if (playerCount === 3) {
    undercoverCount = 1;
  } else if (playerCount === 4) {
    undercoverCount = 1;
  }

  const civilCount = playerCount - misterWhiteCount - undercoverCount;

  // Crear array de roles
  const roles: Player['role'][] = [
    ...Array(civilCount).fill(PLAYER_ROLES.CIVIL),
    ...Array(undercoverCount).fill(PLAYER_ROLES.UNDERCOVER),
    ...Array(misterWhiteCount).fill(PLAYER_ROLES.MISTER_WHITE),
  ];

  // Mezclar roles aleatoriamente
  const shuffledRoles = shuffleArray(roles);

  // Asignar roles a jugadores
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
  }));
}

// Seleccionar palabra aleatoria
export function selectRandomWord(difficulty?: 'easy' | 'medium' | 'hard') {
  const filteredWords = difficulty 
    ? GAME_WORDS.filter(word => word.difficulty === difficulty)
    : GAME_WORDS;
  
  if (filteredWords.length === 0) {
    // Fallback a todas las palabras si no hay ninguna de la dificultad seleccionada
    return GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
  }

  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
}

// Verificar si el juego puede comenzar
export function canStartGame(room: GameRoom): boolean {
  return room.players.length >= 3 && room.status === 'waiting';
}

// Verificar si todos los jugadores han enviado su descripción
export function allPlayersDescribed(players: Player[], descriptions: string[]): boolean {
  const alivePlayers = players.filter(p => p.isAlive);
  return descriptions.length >= alivePlayers.length;
}

// Calcular resultado de votación
export function calculateVotingResult(votes: { targetId: string }[]): string | null {
  if (votes.length === 0) return null;

  const voteCounts: Record<string, number> = {};
  
  votes.forEach(vote => {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  });

  // Encontrar al jugador con más votos
  const maxVotes = Math.max(...Object.values(voteCounts));
  const playersWithMaxVotes = Object.keys(voteCounts).filter(
    playerId => voteCounts[playerId] === maxVotes
  );

  // Si hay empate, no se elimina a nadie
  if (playersWithMaxVotes.length > 1) {
    return null;
  }

  return playersWithMaxVotes[0];
}

// Verificar condiciones de victoria
export function checkWinCondition(players: Player[]): 'civilians' | 'mister_white' | 'undercover' | null {
  const alivePlayers = players.filter(p => p.isAlive);
  const aliveCivils = alivePlayers.filter(p => p.role === PLAYER_ROLES.CIVIL);
  const aliveMisterWhite = alivePlayers.filter(p => p.role === PLAYER_ROLES.MISTER_WHITE);
  const aliveUndercover = alivePlayers.filter(p => p.role === PLAYER_ROLES.UNDERCOVER);

  // Mister White eliminado = Civiles ganan
  if (aliveMisterWhite.length === 0) {
    return 'civilians';
  }

  // Solo queda Mister White y Undercover = Mister White gana
  if (aliveCivils.length === 0 && aliveMisterWhite.length > 0) {
    return 'mister_white';
  }

  // Solo quedan Undercover = Undercover gana
  if (aliveCivils.length === 0 && aliveMisterWhite.length === 0 && aliveUndercover.length > 0) {
    return 'undercover';
  }

  // Juego continúa
  return null;
}

// Obtener próximo jugador para describir
export function getNextPlayer(players: Player[], currentPlayerIndex: number): Player | null {
  const alivePlayers = players.filter(p => p.isAlive);
  if (alivePlayers.length === 0) return null;

  const nextIndex = (currentPlayerIndex + 1) % alivePlayers.length;
  return alivePlayers[nextIndex];
}

// Validar descripción del jugador
export function isValidDescription(description: string): boolean {
  const trimmed = description.trim();
  return trimmed.length >= 3 && trimmed.length <= 200;
}

// Obtener información del rol para mostrar al jugador
export function getRoleInfo(role: Player['role'], word?: string, undercoverWord?: string) {
  switch (role) {
    case PLAYER_ROLES.CIVIL:
      return {
        title: 'Eres un Civil',
        description: 'Conoces la palabra secreta. Describe la palabra sin mencionarla directamente.',
        word: word || '',
        color: 'bg-blue-500',
      };
    case PLAYER_ROLES.UNDERCOVER:
      return {
        title: 'Eres Undercover',
        description: 'Tienes una palabra diferente pero relacionada. Mantente alerta.',
        word: undercoverWord || '',
        color: 'bg-orange-500',
      };
    case PLAYER_ROLES.MISTER_WHITE:
      return {
        title: 'Eres Mister White',
        description: '¡No conoces la palabra! Escucha las descripciones e intenta deducirla.',
        word: '???',
        color: 'bg-red-500',
      };
    default:
      return {
        title: 'Rol desconocido',
        description: '',
        word: '',
        color: 'bg-gray-500',
      };
  }
}

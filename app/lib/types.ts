// Tipos principales para el juego Mister White
export interface Player {
  id: string;
  name: string;
  role: 'civil' | 'mister_white' | 'undercover' | 'payaso';
  isHost: boolean;
  isAlive: boolean;
  joinedAt: string;
  word?: string; // The word this player knows
  clue?: string; // The clue given by this player
  wordRevealed?: boolean; // Whether the player has seen their role/word
}

export interface GameRoom {
  id: string;
  roomCode: string;
  status: 'waiting' | 'assigning' | 'describing' | 'voting' | 'finished';
  players: Player[];
  currentRound: number;
  maxPlayers: number;
  currentWord?: string;
  undercoverWord?: string;
  hostId: string;
  createdAt: string;
}

export interface GameTurn {
  id: string;
  roomId: string;
  playerId: string;
  description: string;
  roundNumber: number;
  createdAt: string;
}

export interface Vote {
  id: string;
  roomId: string;
  voterId: string;
  targetId: string;
  roundNumber: number;
  createdAt: string;
}

export interface GameWord {
  id: string;
  category: string;
  word: string;
  undercoverWord: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Tipos para formularios
export interface CreateRoomFormData {
  playerName: string;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface JoinRoomFormData {
  playerName: string;
  roomCode: string;
}

export interface PlayerNameFormData {
  playerName: string;
  numberOfPlayers: number;
}

// Tipos para el juego local
export interface LocalGameConfig {
  players: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  includeUndercover: boolean;
  maxMisterWhites: number;
}

export interface LocalGameData {
  players: Player[];
  civilianWord: string;
  undercoverWord?: string;
  category?: string; // Only shown on easy difficulty
  gamePhase: 'wordReveal' | 'clues' | 'voting' | 'results';
  currentPlayerIndex: number;
  allCluesSubmitted: boolean;
  votedPlayerId?: string;
  winner?: 'civilians' | 'mister_white' | 'undercover' | 'payaso' | null;
  includeUndercover: boolean;
  round: number;
  originalConfig: LocalGameConfig; // Configuration used to create this game
}

// Tipos para eventos Pusher
export type PusherEventData = 
  | { type: 'player-joined'; player: Player }
  | { type: 'player-left'; playerId: string }
  | { type: 'game-started'; gameRoom: GameRoom }
  | { type: 'role-assigned'; playerId: string; role: Player['role'] }
  | { type: 'turn-submitted'; turn: GameTurn }
  | { type: 'vote-cast'; vote: Vote }
  | { type: 'game-ended'; winner: 'civilians' | 'mister_white' | 'undercover'; gameRoom: GameRoom }
  | { type: 'room-deleted'; roomId: string };

// Constantes
export const MAX_PLAYERS = 20;
export const MIN_PLAYERS = 3;
export const ROOM_CODE_LENGTH = 6;

export const PUSHER_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  ROLE_ASSIGNED: 'role-assigned',
  TURN_SUBMITTED: 'turn-submitted',
  VOTE_CAST: 'vote-cast',
  GAME_ENDED: 'game-ended',
  ROOM_DELETED: 'room-deleted',
} as const;

export const GAME_STATUS = {
  WAITING: 'waiting',
  ASSIGNING: 'assigning',
  DESCRIBING: 'describing',
  VOTING: 'voting',
  FINISHED: 'finished',
} as const;

export const PLAYER_ROLES = {
  CIVIL: 'civil',
  MISTER_WHITE: 'mister_white',
  UNDERCOVER: 'undercover',
  PAYASO: 'payaso',
} as const;

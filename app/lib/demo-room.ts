// Sala online simulada para revisar el diseño en /demo: vive en memoria, sin BD ni Pusher.
import { assignRoles, GameSettings, Role } from './game-logic';
import { GAME_WORDS } from './static-words';

// 4 caracteres: una sala real siempre tiene 6, así que no puede coincidir.
export const DEMO_CODE = 'DEMO';
export const DEMO_REQUEST = { requestId: 'demo-request', playerName: 'Marta' };

const NAMES = ['Ana', 'Luis', 'María de los Ángeles', 'Pablo', 'Sofía', 'Carlos', 'Lucía', 'Diego'];
const FULL_ROLES: GameSettings = { difficulty: 'easy', includeUndercover: true, misterWhites: 1, category: 'all' };

type DemoPlayer = { id: string; name: string; isHost: boolean; role: Role | null; isAlive: boolean };
const initialPlayers = (): DemoPlayer[] =>
  NAMES.map((name, i) => ({ id: `demo-${i}`, name, isHost: i === 0, role: null, isAlive: true }));

let status = 'waiting';
let round = 0;
let pair: (typeof GAME_WORDS)[number] | null = null;
let players = initialPlayers();

export function demoReset() {
  status = 'waiting';
  round = 0;
  pair = null;
  players = initialPlayers();
}

export function demoStartRound(settings: GameSettings) {
  const pool = GAME_WORDS.filter((w) => w.difficulty === settings.difficulty);
  pair = pool[Math.floor(Math.random() * pool.length)];
  const roles = assignRoles(players.length, settings);
  players = players.map((p, i) => ({ ...p, role: roles[i] }));
  status = 'playing';
  round += 1;
}

export function demoBackToLobby() {
  status = 'waiting';
}

export function demoAddPlayer(name: string) {
  if (!players.some((p) => p.name === name)) {
    players = [...players, { id: `demo-${players.length}`, name, isHost: false, role: null, isAlive: true }];
  }
}

// `inGame`: se ha abierto directamente la pantalla de partida, así que se reparte la primera ronda.
export function demoSnapshot(inGame: boolean) {
  if (inGame && round === 0) demoStartRound(FULL_ROLES);
  return {
    room: {
      id: 'demo',
      roomCode: DEMO_CODE,
      status,
      currentRound: round,
      maxPlayers: 20,
      currentWord: pair?.civilian ?? null,
      undercoverWord: pair?.undercover ?? null,
      createdAt: new Date(0).toISOString(),
    },
    players,
  };
}

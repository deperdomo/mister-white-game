// Lógica común a juego local y online: reparto de roles, palabra de cada rol, quién empieza.
// Sin dependencias de cliente: se usa también en las rutas de la API.
import { GAME_WORDS } from './static-words';
import { shuffleArray } from './utils';

export type Role = 'civil' | 'mister_white' | 'undercover' | 'payaso';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  difficulty: Difficulty;
  includeUndercover: boolean;
  misterWhites: number;
  category: string; // 'all' = todas
}

export interface WordPair {
  civilian: string;
  undercover: string;
  category: string;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  includeUndercover: false,
  misterWhites: 1,
  category: 'all',
};

// Ajustes del host online: se recuerdan entre rondas y salas (solo cliente).
const SETTINGS_KEY = 'mw-online-settings';
export function loadOnlineSettings(): GameSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export const saveOnlineSettings = (s: GameSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

export const hasPayaso = (playerCount: number) => playerCount >= 8;

// Máximo de Mr. White: ~60% de los jugadores, dejando siempre al menos 1 civil.
export function maxMisterWhites(playerCount: number, includeUndercover: boolean): number {
  if (playerCount < MIN_PLAYERS) return 1;
  const others = (includeUndercover ? 1 : 0) + (hasPayaso(playerCount) ? 1 : 0);
  return Math.max(1, Math.min(playerCount - 1 - others, Math.floor(playerCount * 0.6)));
}

// Roles barajados para `playerCount` jugadores (el índice i es el rol del jugador i).
export function assignRoles(playerCount: number, settings: GameSettings): Role[] {
  const mw = Math.min(Math.max(1, settings.misterWhites), maxMisterWhites(playerCount, settings.includeUndercover));
  const roles: Role[] = Array(mw).fill('mister_white');
  if (settings.includeUndercover) roles.push('undercover');
  if (hasPayaso(playerCount)) roles.push('payaso');
  while (roles.length < playerCount) roles.push('civil');
  return shuffleArray(roles);
}

// Palabra que ve cada rol (Mr. White no tiene).
export function wordFor(role: Role | null, pair: { civilian: string | null; undercover: string | null }): string | null {
  if (role === 'undercover') return pair.undercover;
  if (role === 'civil' || role === 'payaso') return pair.civilian;
  return null;
}

// Quién empieza a dar pistas: el primero desde `index` que no sea Mr. White.
export function starterFrom<T extends { role: Role | null }>(players: T[], index: number): T | undefined {
  for (let i = 0; i < players.length; i++) {
    const player = players[(index + i) % players.length];
    if (player.role !== 'mister_white') return player;
  }
}

// Posición del primer jugador que entró después de `lastJoinedAt` (online: orden de llegada).
// Funciona aunque quien empezó ya no esté en la sala.
export function indexAfter(players: { created_at: string }[], lastJoinedAt: string | null): number {
  if (!lastJoinedAt) return 0;
  const last = new Date(lastJoinedAt).getTime();
  return Math.max(0, players.findIndex((p) => new Date(p.created_at).getTime() > last));
}

// Presencia online. Se juega en persona con el móvil bloqueado, así que si la mayoría lleva
// un rato sin señal no se puede saber quién se ha ido de verdad: entonces no se descarta a nadie.
const IDLE_MS = 2 * 60_000;
const GONE_MS = 10 * 60_000;
type Seen = { is_host: boolean; last_seen: string };
const seenWithin = (p: Seen, ms: number, now: number) => p.is_host || now - new Date(p.last_seen).getTime() < ms;
const mostlyActive = (players: Seen[], now: number) =>
  players.filter((p) => seenWithin(p, IDLE_MS, now)).length * 2 >= players.length;

// Quienes pueden empezar la ronda.
export const presentPlayers = <T extends Seen>(players: T[], now = Date.now()): T[] =>
  mostlyActive(players, now) ? players.filter((p) => seenWithin(p, IDLE_MS, now)) : players;

// Quienes se dan por ido y se sacan de la sala.
export const abandonedPlayers = <T extends Seen>(players: T[], now = Date.now()): T[] =>
  mostlyActive(players, now) ? players.filter((p) => !seenWithin(p, GONE_MS, now)) : [];

// Turno siguiente por persona, no por posición: quien iba detrás de `lastStarter` en el orden
// en que jugó (`lastOrder`), aunque ahora esté en otro sitio. Si se ha ido, el siguiente que siga.
export function nextStarter<T extends { name: string; role: Role | null }>(
  players: T[],
  lastStarter?: string | null,
  lastOrder: string[] = players.map((p) => p.name),
): T | undefined {
  const names = players.map((p) => p.name);
  const from = lastStarter ? lastOrder.indexOf(lastStarter) : -1;
  if (from >= 0) {
    for (let i = 1; i <= lastOrder.length; i++) {
      const index = names.indexOf(lastOrder[(from + i) % lastOrder.length]);
      if (index >= 0) return starterFrom(players, index);
    }
  }
  return starterFrom(players, 0);
}

// Palabras para varias rondas (sin repetir) desde la BD; si falla, palabras estáticas.
export async function fetchWordPairs(difficulty: Difficulty, category: string, count = 15): Promise<WordPair[]> {
  try {
    const params = new URLSearchParams({ difficulty, count: String(count) });
    if (category !== 'all') params.set('category', category);
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    const words = data.words ?? (data.word ? [data.word] : []);
    if (res.ok && words.length) {
      return words.map((w: { civilWord: string; undercoverWord: string; category: string }) => ({
        civilian: w.civilWord,
        undercover: w.undercoverWord,
        category: w.category,
      }));
    }
  } catch {
    // sin conexión: palabras estáticas
  }
  return shuffleArray(GAME_WORDS.filter((w) => w.difficulty === difficulty)).slice(0, count);
}

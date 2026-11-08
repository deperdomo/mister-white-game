// Comprobación de presencia online: npx tsx scripts/check-presence.ts
import assert from 'node:assert/strict';
import { abandonedPlayers, indexAfter, presentPlayers, starterFrom } from '../app/lib/game-logic';

const now = Date.parse('2026-01-01T12:00:00Z');
const ago = (min: number) => new Date(now - min * 60_000).toISOString();
const player = (name: string, idleMin: number, is_host = false) => ({
  name,
  is_host,
  last_seen: ago(idleMin),
  created_at: ago(100 - name.charCodeAt(0)),
  role: 'civil' as const,
});
const names = (list: { name: string }[]) => list.map((p) => p.name);

const host = player('A', 60, true);

// Con la mayoría activa, quien lleva más de 2 min sin señal no puede empezar, pero sigue en la sala
const oneIdle = [host, player('B', 3), player('C', 0), player('D', 1)];
assert.deepEqual(names(presentPlayers(oneIdle, now)), ['A', 'C', 'D']);
assert.deepEqual(abandonedPlayers(oneIdle, now), []);

// El turno salta a quien sigue presente aunque le tocara al que no da señal
const present = presentPlayers(oneIdle, now);
assert.equal(starterFrom(present, indexAfter(present, host.created_at))?.name, 'C');

// A los 10 min se le saca; el host nunca
const oneGone = [host, player('B', 11), player('C', 0), player('D', 1)];
assert.deepEqual(names(abandonedPlayers(oneGone, now)), ['B']);

// Móviles bloqueados: la mayoría sin señal, no se descarta ni se saca a nadie
const allLocked = [host, player('B', 15), player('C', 15), player('D', 15)];
assert.deepEqual(names(presentPlayers(allLocked, now)), ['A', 'B', 'C', 'D']);
assert.deepEqual(abandonedPlayers(allLocked, now), []);

console.log('presencia ok');

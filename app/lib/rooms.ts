import { supabase } from './supabase';
import { pusherServer } from './pusher';
import { createHmac, timingSafeEqual } from 'crypto';

// El host manda un latido cada 20s (HEARTBEAT_MS en useOnlineGame); sin latido en STALE_MS, la sala se borra.
// ponytail: margen amplio para que el host pueda salir a WhatsApp a compartir sin perder la sala.
export const STALE_MS = 2 * 60_000;
// Con partida en curso se juega en persona y el móvil del host puede estar bloqueado un buen rato.
const PLAYING_STALE_MS = 30 * 60_000;

// Token de jugador sin guardar nada: se firma la sala y el nombre con un secreto del servidor.
export const playerToken = (roomCode: string, playerName: string) =>
  createHmac('sha256', process.env.PUSHER_SECRET!).update(`player:${roomCode}:${playerName}`).digest('hex');

export function isPlayerToken(token: string, roomCode: string, playerName: string) {
  const a = Buffer.from(token);
  const b = Buffer.from(playerToken(roomCode, playerName));
  return a.length === b.length && timingSafeEqual(a, b);
}

type JoinCheck =
  | { ok: true; roomId: string; maxPlayers: number; playerCount: number }
  | { ok: false; status: number; error: string };

// Comprueba que la sala admite a este jugador (existe, en espera, hay hueco, nombre libre).
export async function checkCanJoin(roomCode: string, playerName: string): Promise<JoinCheck> {
  const { data: room } = await supabase
    .from('game_rooms')
    .select('id, status, max_players')
    .eq('room_code', roomCode)
    .maybeSingle();

  if (!room) return { ok: false, status: 404, error: 'La sala no existe' };
  if (room.status !== 'waiting') return { ok: false, status: 400, error: 'La partida ya ha empezado' };

  const { data: players, error } = await supabase
    .from('game_players')
    .select('player_name')
    .eq('room_id', room.id);

  if (error) return { ok: false, status: 500, error: 'No se pudo comprobar la sala' };
  if (players.length >= room.max_players) return { ok: false, status: 400, error: 'La sala está llena' };
  if (players.some((p) => p.player_name.toLowerCase() === playerName.toLowerCase())) {
    return { ok: false, status: 400, error: 'Ese nombre ya está en la sala' };
  }

  return { ok: true, roomId: room.id, maxPlayers: room.max_players, playerCount: players.length };
}

export async function addPlayerToRoom(roomCode: string, playerName: string) {
  const check = await checkCanJoin(roomCode, playerName);
  if (!check.ok) return check;

  const { error } = await supabase.from('game_players').insert({
    room_id: check.roomId,
    player_name: playerName,
    is_host: false,
    role: null,
    is_alive: true,
  });
  if (error) return { ok: false as const, status: 500, error: 'No se pudo unir a la sala' };

  const playerCount = check.playerCount + 1;
  await pusherServer.trigger(`room-${roomCode}`, 'player-joined', {
    playerName,
    playerCount,
    maxPlayers: check.maxPlayers,
  });

  return { ...check, playerCount, playerToken: playerToken(roomCode, playerName) };
}

// Borra salas cuyo host lleva STALE_MS sin dar señales y avisa a quien siga dentro.
export async function sweepStaleRooms() {
  const before = (ms: number) => new Date(Date.now() - ms).toISOString();
  const [waiting, any] = await Promise.all([
    supabase.from('game_rooms').delete().eq('status', 'waiting').lt('last_seen', before(STALE_MS)).select('room_code'),
    supabase.from('game_rooms').delete().lt('last_seen', before(PLAYING_STALE_MS)).select('room_code'),
  ]);
  const stale = [...(waiting.data ?? []), ...(any.data ?? [])];

  if (stale.length) {
    const channels = stale.map((r) => `room-${r.room_code}`);
    // Pusher admite hasta 100 canales por trigger
    for (let i = 0; i < channels.length; i += 100) {
      await pusherServer.trigger(channels.slice(i, i + 100), 'room-deleted', {});
    }
  }
}

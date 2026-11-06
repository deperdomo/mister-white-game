import { supabase } from './supabase';
import { pusherServer } from './pusher';

// El host manda un latido cada 20s (HEARTBEAT_MS en useOnlineGame); sin latido en STALE_MS, la sala se borra.
// ponytail: margen amplio para que el host pueda salir a WhatsApp a compartir sin perder la sala.
export const STALE_MS = 2 * 60_000;

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

  return { ...check, playerCount };
}

// Borra salas cuyo host lleva STALE_MS sin dar señales y avisa a quien siga dentro.
export async function sweepStaleRooms() {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: stale } = await supabase
    .from('game_rooms')
    .delete()
    .lt('last_seen', cutoff)
    .select('room_code');

  if (stale?.length) {
    const channels = stale.map((r) => `room-${r.room_code}`);
    // Pusher admite hasta 100 canales por trigger
    for (let i = 0; i < channels.length; i += 100) {
      await pusherServer.trigger(channels.slice(i, i + 100), 'room-deleted', {});
    }
  }
}

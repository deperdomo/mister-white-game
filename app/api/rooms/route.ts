import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { sweepStaleRooms } from '../../lib/rooms';

export const dynamic = 'force-dynamic';

// GET: salas abiertas (en espera y con host activo)
export async function GET() {
  try {
    await sweepStaleRooms();

    const { data, error } = await supabase
      .from('game_rooms')
      .select('room_code, max_players, created_at, game_players(player_name, is_host)')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rooms = data.map((r) => ({
      roomCode: r.room_code,
      maxPlayers: r.max_players,
      playerCount: r.game_players.length,
      hostName: r.game_players.find((p) => p.is_host)?.player_name ?? '—',
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error listing rooms:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las salas' }, { status: 500 });
  }
}

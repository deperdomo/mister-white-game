import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { pusherServer } from '../../../../lib/pusher';
import { isPlayerToken } from '../../../../lib/rooms';
import { abandonedPlayers } from '../../../../lib/game-logic';

const notFound = () => NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });

// POST: el host o un invitado avisan de que siguen conectados. 404 = ya no está en la sala.
export async function POST(request: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = (await params).roomCode.toUpperCase();
  const { hostToken, playerName, playerToken } = await request.json().catch(() => ({}));
  const last_seen = new Date().toISOString();

  if (typeof playerToken === 'string' && typeof playerName === 'string') {
    if (!isPlayerToken(playerToken, roomCode, playerName)) {
      return NextResponse.json({ error: 'Token no válido' }, { status: 403 });
    }
    const { data: room } = await supabase.from('game_rooms').select('id').eq('room_code', roomCode).maybeSingle();
    if (!room) return notFound();
    const { data } = await supabase
      .from('game_players')
      .update({ last_seen })
      .eq('room_id', room.id)
      .eq('player_name', playerName)
      .select('id');
    return data?.length ? NextResponse.json({ success: true }) : notFound();
  }

  if (typeof hostToken !== 'string') {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  const { data: rooms } = await supabase
    .from('game_rooms')
    .update({ last_seen })
    .eq('room_code', roomCode)
    .eq('host_id', hostToken)
    .select('id');
  if (!rooms?.length) return notFound();

  // Si el host se va, la sala entera se barre: basta con revisar a los invitados desde su latido.
  const { data: players } = await supabase
    .from('game_players')
    .select('id, is_host, last_seen')
    .eq('room_id', rooms[0].id);
  const gone = abandonedPlayers(players ?? []).map((p) => p.id);
  if (gone.length) {
    await supabase.from('game_players').delete().in('id', gone);
    await pusherServer.trigger(`room-${roomCode}`, 'player-left', {});
  }

  return NextResponse.json({ success: true });
}

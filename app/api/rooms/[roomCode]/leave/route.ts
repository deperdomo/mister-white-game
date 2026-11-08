import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { pusherServer } from '../../../../lib/pusher';
import { isPlayerToken } from '../../../../lib/rooms';

// POST: un invitado sale de la sala. El anfitrión no pasa por aquí: al salir cierra la sala.
export async function POST(request: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = (await params).roomCode.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const playerName = typeof body.playerName === 'string' ? body.playerName.trim() : '';
  if (!playerName || typeof body.playerToken !== 'string') {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
  }
  if (!isPlayerToken(body.playerToken, roomCode, playerName)) {
    return NextResponse.json({ error: 'No puedes sacar a otro jugador' }, { status: 403 });
  }

  const { data: room } = await supabase.from('game_rooms').select('id').eq('room_code', roomCode).maybeSingle();
  if (!room) return NextResponse.json({ error: 'La sala no existe' }, { status: 404 });

  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('room_id', room.id)
    .eq('player_name', playerName)
    .eq('is_host', false);
  if (error) return NextResponse.json({ error: 'No se pudo salir de la sala' }, { status: 500 });

  await pusherServer.trigger(`room-${roomCode}`, 'player-left', { playerName });
  return NextResponse.json({ success: true });
}

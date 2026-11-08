import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { pusherServer } from '../../../../lib/pusher';
import { addPlayerToRoom, checkCanJoin } from '../../../../lib/rooms';
import { isValidPlayerName } from '../../../../lib/utils';

type Params = { params: Promise<{ roomCode: string }> };

const UUID = /^[0-9a-f-]{36}$/i;
const responseChannel = (requestId: string) => `join-request-${requestId}`;

// POST: un jugador pide entrar. El host recibe 'join-request' en el canal de la sala.
export async function POST(request: NextRequest, { params }: Params) {
  const roomCode = (await params).roomCode.toUpperCase();
  const { requestId, playerName } = await request.json().catch(() => ({}));
  const name = typeof playerName === 'string' ? playerName.trim() : '';

  if (typeof requestId !== 'string' || !UUID.test(requestId) || !isValidPlayerName(name)) {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
  }

  const check = await checkCanJoin(roomCode, name);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  await pusherServer.trigger(`room-${roomCode}`, 'join-request', { requestId, playerName: name });
  return NextResponse.json({ success: true });
}

// PATCH: el host acepta o rechaza. Si acepta, se añade al jugador y se le avisa.
export async function PATCH(request: NextRequest, { params }: Params) {
  const roomCode = (await params).roomCode.toUpperCase();
  const { hostToken, requestId, playerName, accept } = await request.json().catch(() => ({}));

  if (typeof hostToken !== 'string' || typeof requestId !== 'string' || !UUID.test(requestId) || typeof playerName !== 'string') {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
  }

  const { data: room } = await supabase
    .from('game_rooms')
    .select('id')
    .eq('room_code', roomCode)
    .eq('host_id', hostToken)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: 'Solo el anfitrión puede responder' }, { status: 403 });

  if (!accept) {
    await pusherServer.trigger(responseChannel(requestId), 'join-response', { accepted: false });
    return NextResponse.json({ success: true });
  }

  const result = await addPlayerToRoom(roomCode, playerName.trim());
  await pusherServer.trigger(
    responseChannel(requestId),
    'join-response',
    result.ok ? { accepted: true, playerToken: result.playerToken } : { accepted: false, error: result.error },
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}

// DELETE: el jugador cancela su solicitud; el host deja de verla.
export async function DELETE(request: NextRequest, { params }: Params) {
  const roomCode = (await params).roomCode.toUpperCase();
  const { requestId } = await request.json().catch(() => ({}));
  if (typeof requestId !== 'string' || !UUID.test(requestId)) {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
  }
  await pusherServer.trigger(`room-${roomCode}`, 'join-request-cancelled', { requestId });
  return NextResponse.json({ success: true });
}

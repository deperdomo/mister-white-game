import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// POST: el host avisa de que sigue conectado
export async function POST(request: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const { hostToken } = await request.json().catch(() => ({}));
  if (typeof hostToken !== 'string') {
    return NextResponse.json({ error: 'hostToken requerido' }, { status: 400 });
  }

  const { data } = await supabase
    .from('game_rooms')
    .update({ last_seen: new Date().toISOString() })
    .eq('room_code', roomCode.toUpperCase())
    .eq('host_id', hostToken)
    .select('id');

  // 404 = la sala ya fue barrida (o el token no es del host)
  if (!data?.length) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
  return NextResponse.json({ success: true });
}

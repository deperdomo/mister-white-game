import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { pusherServer } from '../../../../lib/pusher';
import { assignRoles, DEFAULT_SETTINGS, GameSettings, MIN_PLAYERS, indexAfter, starterFrom } from '../../../../lib/game-logic';

type Params = { params: Promise<{ roomCode: string }> };

async function getHostRoom(roomCode: string, hostToken: unknown) {
  if (typeof hostToken !== 'string') return null;
  const { data } = await supabase
    .from('game_rooms')
    .select('id, current_round, current_word, starter_joined_at')
    .eq('room_code', roomCode)
    .eq('host_id', hostToken)
    .maybeSingle();
  return data;
}

function parseSettings(raw: unknown): GameSettings {
  const s = { ...DEFAULT_SETTINGS, ...(typeof raw === 'object' && raw ? raw : {}) } as GameSettings;
  return {
    difficulty: ['easy', 'medium', 'hard'].includes(s.difficulty) ? s.difficulty : 'medium',
    includeUndercover: s.includeUndercover === true,
    misterWhites: Number.isInteger(s.misterWhites) ? s.misterWhites : 1,
    category: typeof s.category === 'string' ? s.category : 'all',
  };
}

// POST: el host empieza una ronda (primera o siguiente): palabra nueva + roles nuevos.
export async function POST(request: NextRequest, { params }: Params) {
  const roomCode = (await params).roomCode.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const room = await getHostRoom(roomCode, body.hostToken);
  if (!room) return NextResponse.json({ error: 'Solo el anfitrión puede empezar' }, { status: 403 });

  const settings = parseSettings(body.settings);

  const { data: players } = await supabase
    .from('game_players')
    .select('id, created_at')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true });
  if (!players || players.length < MIN_PLAYERS) {
    return NextResponse.json({ error: `Se necesitan al menos ${MIN_PLAYERS} jugadores` }, { status: 400 });
  }

  let query = supabase.from('game_words').select('word, undercover_word').eq('difficulty', settings.difficulty);
  if (settings.category !== 'all') query = query.eq('category', settings.category);
  const { data: words } = await query;
  // ponytail: solo evita repetir la palabra anterior; historial completo si se repiten demasiado
  const fresh = words?.filter((w) => w.word !== room.current_word) ?? [];
  const candidates = fresh.length ? fresh : words ?? [];
  const pair = candidates[Math.floor(Math.random() * candidates.length)];
  if (!pair) return NextResponse.json({ error: 'No hay palabras para esa categoría' }, { status: 404 });

  const roles = assignRoles(players.length, settings);
  const results = await Promise.all(
    players.map((p, i) => supabase.from('game_players').update({ role: roles[i] }).eq('id', p.id)),
  );
  if (results.some((r) => r.error)) {
    return NextResponse.json({ error: 'No se pudieron repartir los roles' }, { status: 500 });
  }

  // Sigue quien entró justo después del que empezó la última ronda (sirve aunque ese ya no esté)
  const starter = starterFrom(players.map((p, i) => ({ ...p, role: roles[i] })), indexAfter(players, room.starter_joined_at));

  const round = (room.current_round ?? 0) + 1;
  const { error } = await supabase
    .from('game_rooms')
    .update({
      status: 'playing',
      current_word: pair.word,
      undercover_word: pair.undercover_word,
      current_round: round,
      starter_joined_at: starter?.created_at ?? null,
    })
    .eq('id', room.id);
  if (error) return NextResponse.json({ error: 'No se pudo empezar la ronda' }, { status: 500 });

  await pusherServer.trigger(`room-${roomCode}`, 'round-started', { round });
  return NextResponse.json({ success: true, round });
}

// DELETE: el host vuelve a la sala de espera (cambiar ajustes / esperar a más gente).
export async function DELETE(request: NextRequest, { params }: Params) {
  const roomCode = (await params).roomCode.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const room = await getHostRoom(roomCode, body.hostToken);
  if (!room) return NextResponse.json({ error: 'Solo el anfitrión puede hacer esto' }, { status: 403 });

  await supabase.from('game_rooms').update({ status: 'waiting' }).eq('id', room.id);
  await pusherServer.trigger(`room-${roomCode}`, 'back-to-lobby', {});
  return NextResponse.json({ success: true });
}

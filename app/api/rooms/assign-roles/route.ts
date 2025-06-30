import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { pusherServer } from '../../../lib/pusher';

interface RoleAssignment {
  playerId: string;
  role: 'civil' | 'mister_white' | 'undercover' | 'payaso';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();

    // Obtener sala y jugadores
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('id, status')
      .eq('room_code', normalizedRoomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('id, player_name')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (playersError || !players || players.length < 3) {
      return NextResponse.json(
        { error: 'Not enough players' },
        { status: 400 }
      );
    }

    // Algoritmo de asignación de roles
    const assignments = assignRoles(players.length);
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Asignar roles a jugadores
    const roleUpdates = shuffledPlayers.map((player, index) => ({
      id: player.id,
      role: assignments[index]
    }));

    // Actualizar roles en la base de datos
    for (const update of roleUpdates) {
      const { error } = await supabase
        .from('game_players')
        .update({ role: update.role })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating player role:', error);
        return NextResponse.json(
          { error: 'Failed to assign roles' },
          { status: 500 }
        );
      }
    }

    // Disparar evento de roles asignados
    await pusherServer.trigger(`room-${normalizedRoomCode}`, 'roles-assigned', {
      message: 'Roles have been assigned to all players'
    });

    return NextResponse.json({
      success: true,
      assignments: roleUpdates.map(u => ({
        playerId: u.id,
        role: u.role
      }))
    });

  } catch (error) {
    console.error('Unexpected error in role assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function assignRoles(playerCount: number): string[] {
  const roles: string[] = [];

  if (playerCount < 3 || playerCount > 20) {
    throw new Error('Invalid player count');
  }

  // Siempre hay 1 Mister White
  roles.push('mister_white');

  // Lógica según número de jugadores
  if (playerCount >= 8) {
    // Con 8+ jugadores: 1 Mister White, 1 Payaso, resto civiles
    roles.push('payaso');
    
    // Resto son civiles
    for (let i = 2; i < playerCount; i++) {
      roles.push('civil');
    }
  } else if (playerCount >= 5) {
    // Con 5-7 jugadores: 1 Mister White, 1 Undercover, resto civiles
    roles.push('undercover');
    
    // Resto son civiles
    for (let i = 2; i < playerCount; i++) {
      roles.push('civil');
    }
  } else {
    // Con 3-4 jugadores: 1 Mister White, resto civiles
    for (let i = 1; i < playerCount; i++) {
      roles.push('civil');
    }
  }

  return roles;
}

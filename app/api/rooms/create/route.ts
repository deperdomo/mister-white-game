import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { pusherServer } from '../../../lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, maxPlayers = 8 } = body;

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    if (maxPlayers < 3 || maxPlayers > 8) {
      return NextResponse.json(
        { error: 'Max players must be between 3 and 8' },
        { status: 400 }
      );
    }

    // Generate a unique room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create room in database
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        status: 'waiting',
        max_players: maxPlayers,
        host_id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    // Add host as first player
    const { error: playerError } = await supabase
      .from('game_players')
      .insert({
        room_id: room.id,
        player_name: playerName.trim(),
        is_host: true,
        role: null,
        is_alive: true,
      });

    if (playerError) {
      console.error('Error adding host player:', playerError);
      // Clean up room if player creation fails
      await supabase.from('game_rooms').delete().eq('id', room.id);
      return NextResponse.json(
        { error: 'Failed to add player to room' },
        { status: 500 }
      );
    }

    // Trigger room created event via Pusher
    await pusherServer.trigger('global-events', 'room-created', {
      roomCode,
      playerCount: 1,
      maxPlayers,
    });

    return NextResponse.json({
      success: true,
      roomCode,
      roomId: room.id,
      message: 'Room created successfully',
    });

  } catch (error) {
    console.error('Unexpected error in room creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

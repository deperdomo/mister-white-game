import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { pusherServer } from '../../../lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, playerName } = body;

    if (!roomCode || typeof roomCode !== 'string' || roomCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.trim().toUpperCase();

    // Check if room exists and is accepting players
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('id, status, max_players')
      .eq('room_code', normalizedRoomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Room is not accepting new players' },
        { status: 400 }
      );
    }

    // Check current player count
    const { count: currentPlayers, error: countError } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if (countError) {
      console.error('Error counting players:', countError);
      return NextResponse.json(
        { error: 'Failed to check room capacity' },
        { status: 500 }
      );
    }

    if (currentPlayers! >= room.max_players) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    // Check if player name is already taken in this room
    const { data: existingPlayer, error: playerCheckError } = await supabase
      .from('game_players')
      .select('id')
      .eq('room_id', room.id)
      .eq('player_name', playerName.trim())
      .maybeSingle();

    if (playerCheckError) {
      console.error('Error checking existing player:', playerCheckError);
      return NextResponse.json(
        { error: 'Failed to validate player name' },
        { status: 500 }
      );
    }

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player name is already taken in this room' },
        { status: 400 }
      );
    }

    // Add player to room
    const { error: insertError } = await supabase
      .from('game_players')
      .insert({
        room_id: room.id,
        player_name: playerName.trim(),
        is_host: false,
        role: null,
        is_alive: true,
      });

    if (insertError) {
      console.error('Error adding player:', insertError);
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    // Get updated player count
    const newPlayerCount = (currentPlayers || 0) + 1;

    // Trigger player joined event via Pusher
    await pusherServer.trigger(`room-${normalizedRoomCode}`, 'player-joined', {
      playerName: playerName.trim(),
      playerCount: newPlayerCount,
      maxPlayers: room.max_players,
    });

    return NextResponse.json({
      success: true,
      roomCode: normalizedRoomCode,
      roomId: room.id,
      playerCount: newPlayerCount,
      message: 'Successfully joined room',
    });

  } catch (error) {
    console.error('Unexpected error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

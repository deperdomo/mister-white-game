import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { pusherServer } from '../../../lib/pusher';

interface RouteParams {
  params: Promise<{ roomCode: string }>;
}

// GET: Get room information and players
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomCode } = await params;
    
    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();

    // Get room information
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', normalizedRoomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Get players in the room
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Categoría de la pareja actual (solo se muestra en fácil)
    let currentCategory: string | null = null;
    if (room.current_word && room.undercover_word) {
      const { data: w } = await supabase
        .from('game_words')
        .select('category, difficulty')
        .eq('word', room.current_word)
        .eq('undercover_word', room.undercover_word)
        .maybeSingle();
      if (w?.difficulty === 'easy') currentCategory = w.category;
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomCode: room.room_code,
        status: room.status,
        currentRound: room.current_round,
        maxPlayers: room.max_players,
        currentWord: room.current_word,
        undercoverWord: room.undercover_word,
        currentCategory,
        createdAt: room.created_at,
      },
      players: players?.map((player: { 
        id: string; 
        player_name: string; 
        is_host: boolean; 
        role: string | null; 
        is_alive: boolean; 
        description: string | null; 
        voted_for: string | null;
      }) => ({
        id: player.id,
        name: player.player_name,
        isHost: player.is_host,
        role: player.role,
        isAlive: player.is_alive,
        description: player.description,
        votedFor: player.voted_for,
      })) || [],
    });

  } catch (error) {
    console.error('Unexpected error fetching room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomCode } = await params;
    
    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('id')
      .eq('room_code', normalizedRoomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Delete associated players first (foreign key constraint)
    const { error: playersError } = await supabase
      .from('game_players')
      .delete()
      .eq('room_id', room.id);

    if (playersError) {
      console.error('Error deleting players:', playersError);
      return NextResponse.json(
        { error: 'Failed to delete players' },
        { status: 500 }
      );
    }

    // Delete room
    const { error: deleteError } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', room.id);

    if (deleteError) {
      console.error('Error deleting room:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete room' },
        { status: 500 }
      );
    }

    // Trigger room deleted event via Pusher
    await pusherServer.trigger(`room-${normalizedRoomCode}`, 'room-deleted', {
      roomCode: normalizedRoomCode,
    });

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully',
    });

  } catch (error) {
    console.error('Unexpected error deleting room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

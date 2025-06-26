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
        hostId: room.host_id,
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

// PATCH: Update room (start game, change status, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomCode } = await params;
    const body = await request.json();
    
    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();
    const { action, ...updateData } = body;

    // Get room
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

    let updateFields = {};
    let pusherEvent = '';
    let pusherData = {};

    switch (action) {
      case 'start_game':
        // Validate minimum players
        const { count: playerCount } = await supabase
          .from('game_players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);

        if (!playerCount || playerCount < 3) {
          return NextResponse.json(
            { error: 'At least 3 players required to start the game' },
            { status: 400 }
          );
        }

        updateFields = {
          status: 'playing',
          current_round: 1,
          current_word: updateData.currentWord || null,
          undercover_word: updateData.undercoverWord || null,
        };
        pusherEvent = 'game-started';
        pusherData = {
          currentWord: updateData.currentWord,
          undercoverWord: updateData.undercoverWord,
        };
        break;

      case 'next_round':
        updateFields = {
          current_round: room.current_round + 1,
        };
        pusherEvent = 'round-started';
        pusherData = {
          round: room.current_round + 1,
        };
        break;

      case 'end_game':
        updateFields = {
          status: 'finished',
        };
        pusherEvent = 'game-ended';
        pusherData = {
          winner: updateData.winner || 'unknown',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update room
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update(updateFields)
      .eq('id', room.id);

    if (updateError) {
      console.error('Error updating room:', updateError);
      return NextResponse.json(
        { error: 'Failed to update room' },
        { status: 500 }
      );
    }

    // Trigger event via Pusher
    if (pusherEvent) {
      await pusherServer.trigger(`room-${normalizedRoomCode}`, pusherEvent, pusherData);
    }

    return NextResponse.json({
      success: true,
      message: `Room ${action} completed successfully`,
    });

  } catch (error) {
    console.error('Unexpected error updating room:', error);
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

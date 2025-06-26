import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { pusherServer } from '../../../../lib/pusher';

interface RouteParams {
  params: Promise<{ roomCode: string }>;
}

// PATCH: Update player actions (submit description, vote, etc.)
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
    const { action, playerName, ...actionData } = body;

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

    // Get player
    const { data: player, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('player_name', playerName)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    let updateFields = {};
    let pusherEvent = '';
    let pusherData = {};

    switch (action) {
      case 'submit_description':
        const { description } = actionData;
        if (!description || typeof description !== 'string') {
          return NextResponse.json(
            { error: 'Description is required' },
            { status: 400 }
          );
        }

        updateFields = { description: description.trim() };
        pusherEvent = 'description-submitted';
        pusherData = {
          playerName,
          hasDescription: true,
        };
        break;

      case 'submit_vote':
        const { votedFor } = actionData;
        if (!votedFor || typeof votedFor !== 'string') {
          return NextResponse.json(
            { error: 'Vote target is required' },
            { status: 400 }
          );
        }

        // Verify voted player exists and is alive
        const { data: votedPlayer, error: votedPlayerError } = await supabase
          .from('game_players')
          .select('id, is_alive')
          .eq('room_id', room.id)
          .eq('player_name', votedFor)
          .single();

        if (votedPlayerError || !votedPlayer || !votedPlayer.is_alive) {
          return NextResponse.json(
            { error: 'Invalid vote target' },
            { status: 400 }
          );
        }

        updateFields = { voted_for: votedFor };
        pusherEvent = 'vote-submitted';
        pusherData = {
          playerName,
          hasVoted: true,
        };
        break;

      case 'assign_role':
        const { role } = actionData;
        if (!role || !['civil', 'undercover', 'mister_white'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }

        updateFields = { role };
        pusherEvent = 'role-assigned';
        pusherData = {
          playerName,
          role,
        };
        break;

      case 'eliminate':
        updateFields = { is_alive: false };
        pusherEvent = 'player-eliminated';
        pusherData = {
          playerName,
          role: player.role,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update player
    const { error: updateError } = await supabase
      .from('game_players')
      .update(updateFields)
      .eq('id', player.id);

    if (updateError) {
      console.error('Error updating player:', updateError);
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      );
    }

    // Trigger event via Pusher
    if (pusherEvent) {
      await pusherServer.trigger(`room-${normalizedRoomCode}`, pusherEvent, pusherData);
    }

    return NextResponse.json({
      success: true,
      message: `Player ${action} completed successfully`,
    });

  } catch (error) {
    console.error('Unexpected error updating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

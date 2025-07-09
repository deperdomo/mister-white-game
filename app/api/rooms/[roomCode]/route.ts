import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { pusherServer } from '../../../lib/pusher';

// Función para asignar roles
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
        console.log('Starting game with words:', {
          currentWord: updateData.currentWord,
          undercoverWord: updateData.undercoverWord,
          updateFields
        });
        pusherEvent = 'game-started';
        pusherData = {
          currentWord: updateData.currentWord,
          undercoverWord: updateData.undercoverWord,
        };
        break;

      case 'next_round':
        console.log('🎮 Processing next_round action for room:', normalizedRoomCode);
        
        // Obtener nuevas palabras para la siguiente ronda
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        console.log('📡 Fetching words from:', `${baseUrl}/api/words?difficulty=medium&count=1`);
        
        const wordsResponse = await fetch(`${baseUrl}/api/words?difficulty=medium&count=1`);
        let newWords: { currentWord: string | null; undercoverWord: string | null } = { currentWord: null, undercoverWord: null };
        
        if (wordsResponse.ok) {
          const wordsData = await wordsResponse.json();
          console.log('📝 Words API response:', wordsData);
          if (wordsData.success && wordsData.word) {
            newWords = {
              currentWord: wordsData.word.civilWord,
              undercoverWord: wordsData.word.undercoverWord
            };
            console.log('✅ New words for next round:', newWords);
          } else {
            console.warn('⚠️ Words API returned success=false or no word');
          }
        } else {
          console.error('❌ Words API failed:', wordsResponse.status, wordsResponse.statusText);
        }
        
        // Si no se obtuvieron palabras, usar palabras por defecto
        if (!newWords.currentWord) {
          console.log('🔄 Using fallback words');
          newWords = {
            currentWord: 'Gato',
            undercoverWord: 'Perro'
          };
        }
        
        // Obtener jugadores para reasignar roles
        console.log('👥 Fetching players for role assignment...');
        const { data: playersForRoles, error: playersError } = await supabase
          .from('game_players')
          .select('id, player_name')
          .eq('room_id', room.id)
          .order('created_at', { ascending: true });

        if (playersError) {
          console.error('❌ Error fetching players for role assignment:', playersError);
          return NextResponse.json(
            { error: 'Failed to fetch players for role assignment' },
            { status: 500 }
          );
        }

        console.log('👥 Players for role assignment:', playersForRoles?.length);

        // Reasignar roles para la nueva ronda (Mister White será aleatorio)
        if (playersForRoles && playersForRoles.length >= 3) {
          const assignments = assignRoles(playersForRoles.length);
          const shuffledPlayers = [...playersForRoles].sort(() => Math.random() - 0.5);

          console.log('🎭 Assigning roles:', assignments);

          // Asignar nuevos roles
          for (let i = 0; i < shuffledPlayers.length; i++) {
            const { error: roleError } = await supabase
              .from('game_players')
              .update({ role: assignments[i] })
              .eq('id', shuffledPlayers[i].id);

            if (roleError) {
              console.error('❌ Error updating player role:', roleError);
            } else {
              console.log(`✅ Assigned ${assignments[i]} to ${shuffledPlayers[i].player_name}`);
            }
          }
          console.log('✅ Roles reassigned for next round');
        }
        
        // Reiniciar el estado del juego para la siguiente ronda
        updateFields = {
          current_round: room.current_round + 1,
          status: 'playing', // Volver a estado playing
          current_word: newWords.currentWord,
          undercover_word: newWords.undercoverWord,
        };
        
        console.log('🔄 Update fields for room:', updateFields);
        
        // Resetear el estado de todos los jugadores (pero mantener los nuevos roles)
        console.log('🧹 Resetting player states...');
        const { error: resetPlayersError } = await supabase
          .from('game_players')
          .update({ 
            description: null, 
            voted_for: null,
            is_alive: true
          })
          .eq('room_id', room.id);

        if (resetPlayersError) {
          console.error('❌ Error resetting players for next round:', resetPlayersError);
          return NextResponse.json(
            { error: 'Failed to reset players for next round' },
            { status: 500 }
          );
        }
        
        console.log('✅ Player states reset');
        
        pusherEvent = 'round-started';
        pusherData = {
          round: room.current_round + 1,
          currentWord: newWords.currentWord,
          undercoverWord: newWords.undercoverWord,
        };
        
        console.log('📡 Pusher event data:', { pusherEvent, pusherData });
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
    console.log('💾 Updating room with fields:', updateFields);
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update(updateFields)
      .eq('id', room.id);

    if (updateError) {
      console.error('❌ Error updating room:', updateError);
      return NextResponse.json(
        { error: 'Failed to update room' },
        { status: 500 }
      );
    }

    console.log('✅ Room updated successfully');

    // Trigger event via Pusher
    if (pusherEvent) {
      console.log('📡 Sending Pusher event:', { 
        channel: `room-${normalizedRoomCode}`, 
        event: pusherEvent, 
        data: pusherData 
      });
      
      try {
        await pusherServer.trigger(`room-${normalizedRoomCode}`, pusherEvent, pusherData);
        console.log('✅ Pusher event sent successfully');
      } catch (pusherError) {
        console.error('❌ Failed to send Pusher event:', pusherError);
      }
    }

    console.log('🎉 Room action completed successfully:', action);
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

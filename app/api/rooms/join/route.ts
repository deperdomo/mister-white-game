import { NextRequest, NextResponse } from 'next/server';
import { addPlayerToRoom } from '../../../lib/rooms';

export async function POST(request: NextRequest) {
  try {
    const { roomCode, playerName } = await request.json();

    if (typeof roomCode !== 'string' || !roomCode.trim()) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }
    if (typeof playerName !== 'string' || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const result = await addPlayerToRoom(normalizedRoomCode, playerName.trim());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      roomCode: normalizedRoomCode,
      roomId: result.roomId,
      playerCount: result.playerCount,
      message: 'Successfully joined room',
    });
  } catch (error) {
    console.error('Unexpected error joining room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

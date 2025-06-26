import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '../../../lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // For now, we'll allow all connections
    // In a production app, you might want to validate the user/session here
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error in Pusher auth:', error);
    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 403 }
    );
  }
}

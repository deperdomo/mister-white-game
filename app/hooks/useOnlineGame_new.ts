import { useState, useEffect, useCallback } from 'react';
import { getPusherClient } from '../lib/pusher';
import { useToast } from './useToast';

interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  role: string | null;
  isAlive: boolean;
  description: string | null;
  votedFor: string | null;
}

interface OnlineRoom {
  id: string;
  roomCode: string;
  status: string;
  currentRound: number;
  maxPlayers: number;
  currentWord: string | null;
  undercoverWord: string | null;
  hostId: string;
  createdAt: string;
}

interface UseOnlineGameState {
  room: OnlineRoom | null;
  players: OnlinePlayer[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  createRoom: (playerName: string, maxPlayers?: number) => Promise<string | null>;
  leaveRoom: () => void;
  startGame: (words: { currentWord: string; undercoverWord: string }) => Promise<boolean>;
  submitDescription: (description: string, playerName: string) => Promise<boolean>;
  submitVote: (votedFor: string, playerName: string) => Promise<boolean>;
  refreshRoom: () => Promise<void>;
}

export function useOnlineGame(): UseOnlineGameState {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pusher, setPusher] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const { success: showSuccess, error: showError, info: showInfo, warning: showWarning } = useToast();

  // Initialize Pusher connection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const pusherClient = getPusherClient();
        setPusher(pusherClient);

        pusherClient.connection.bind('connected', () => {
          setIsConnected(true);
        });

        pusherClient.connection.bind('disconnected', () => {
          setIsConnected(false);
        });

        pusherClient.connection.bind('error', (err: any) => {
          console.error('Pusher connection error:', err);
          setError('Connection error');
        });
      } catch (err) {
        console.error('Failed to initialize Pusher:', err);
        setError('Failed to initialize real-time connection');
      }
    }

    return () => {
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, []);

  // Refresh room data from API
  const refreshRoom = useCallback(async () => {
    if (!room?.roomCode) return;

    try {
      const response = await fetch(`/api/rooms/${room.roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
        setPlayers(data.players);
      }
    } catch (err) {
      console.error('Failed to refresh room:', err);
    }
  }, [room?.roomCode]);

  // Subscribe to room channel
  const subscribeToRoom = useCallback((roomCode: string) => {
    if (!pusher) return;

    const channelName = `room-${roomCode}`;
    const roomChannel = pusher.subscribe(channelName);
    setChannel(roomChannel);

    // Player joined event
    roomChannel.bind('player-joined', (data: any) => {
      showSuccess(`${data.playerName} joined the room`);
      refreshRoom();
    });

    // Game started event
    roomChannel.bind('game-started', (data: any) => {
      showSuccess('Game has started!');
      refreshRoom();
    });

    // Description submitted event
    roomChannel.bind('description-submitted', (data: any) => {
      showInfo(`${data.playerName} submitted their description`);
      refreshRoom();
    });

    // Vote submitted event
    roomChannel.bind('vote-submitted', (data: any) => {
      showInfo(`${data.playerName} voted`);
      refreshRoom();
    });

    // Player eliminated event
    roomChannel.bind('player-eliminated', (data: any) => {
      showWarning(`${data.playerName} was eliminated!`);
      refreshRoom();
    });

    // Game ended event
    roomChannel.bind('game-ended', (data: any) => {
      showSuccess(`Game ended! Winner: ${data.winner}`);
      refreshRoom();
    });

    // Room deleted event
    roomChannel.bind('room-deleted', () => {
      showError('Room was deleted');
      setRoom(null);
      setPlayers([]);
    });

  }, [pusher, showSuccess, showInfo, showWarning, showError, refreshRoom]);

  // Create room
  const createRoom = useCallback(async (playerName: string, maxPlayers = 8): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, maxPlayers }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Room created successfully!');
        
        // Fetch room details and subscribe
        const roomResponse = await fetch(`/api/rooms/${data.roomCode}`);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData.room);
          setPlayers(roomData.players);
          subscribeToRoom(data.roomCode);
        }
        
        return data.roomCode;
      } else {
        setError(data.error || 'Failed to create room');
        showError(data.error || 'Failed to create room');
        return null;
      }
    } catch (err) {
      const errorMsg = 'Failed to create room';
      setError(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showSuccess, showError, subscribeToRoom]);

  // Join room
  const joinRoom = useCallback(async (roomCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Joined room successfully!');
        
        // Fetch room details and subscribe
        const roomResponse = await fetch(`/api/rooms/${data.roomCode}`);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData.room);
          setPlayers(roomData.players);
          subscribeToRoom(data.roomCode);
        }
        
        return true;
      } else {
        setError(data.error || 'Failed to join room');
        showError(data.error || 'Failed to join room');
        return false;
      }
    } catch (err) {
      const errorMsg = 'Failed to join room';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showSuccess, showError, subscribeToRoom]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (channel) {
      pusher?.unsubscribe(channel.name);
      setChannel(null);
    }
    setRoom(null);
    setPlayers([]);
    setError(null);
  }, [channel, pusher]);

  // Start game
  const startGame = useCallback(async (words: { currentWord: string; undercoverWord: string }): Promise<boolean> => {
    if (!room) return false;

    try {
      const response = await fetch(`/api/rooms/${room.roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_game',
          currentWord: words.currentWord,
          undercoverWord: words.undercoverWord,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to start game');
        return false;
      }
    } catch (err) {
      showError('Failed to start game');
      return false;
    }
  }, [room, showError]);

  // Submit description
  const submitDescription = useCallback(async (description: string, playerName: string): Promise<boolean> => {
    if (!room) return false;

    try {
      const response = await fetch(`/api/rooms/${room.roomCode}/players`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_description',
          playerName,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to submit description');
        return false;
      }
    } catch (err) {
      showError('Failed to submit description');
      return false;
    }
  }, [room, showError]);

  // Submit vote
  const submitVote = useCallback(async (votedFor: string, playerName: string): Promise<boolean> => {
    if (!room) return false;

    try {
      const response = await fetch(`/api/rooms/${room.roomCode}/players`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_vote',
          playerName,
          votedFor,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to submit vote');
        return false;
      }
    } catch (err) {
      showError('Failed to submit vote');
      return false;
    }
  }, [room, showError]);

  return {
    room,
    players,
    isConnected,
    isLoading,
    error,
    joinRoom,
    createRoom,
    leaveRoom,
    startGame,
    submitDescription,
    submitVote,
    refreshRoom,
  };
}

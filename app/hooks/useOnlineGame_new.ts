import { useState, useEffect, useCallback } from 'react';
import { getPusherClient } from '../lib/pusher';
import { useToast } from './useToast';

// Pusher types
interface PusherConnection {
  bind: (event: string, callback: (data?: unknown) => void) => void;
}

interface PusherChannel {
  bind: (event: string, callback: (data: unknown) => void) => void;
  name: string;
}

interface PusherClient {
  connection: PusherConnection;
  subscribe: (channelName: string) => PusherChannel;
  unsubscribe: (channelName: string) => void;
  disconnect: () => void;
}

// Event data interfaces
interface PlayerJoinedData {
  playerName: string;
}

interface DescriptionSubmittedData {
  playerName: string;
}

interface VoteSubmittedData {
  playerName: string;
}

interface PlayerEliminatedData {
  playerName: string;
}

interface GameEndedData {
  winner: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  roomCode?: string;
  room?: OnlineRoom;
  players?: OnlinePlayer[];
}

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
  const [pusher, setPusher] = useState<PusherClient | null>(null);
  const [channel, setChannel] = useState<PusherChannel | null>(null);
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

        pusherClient.connection.bind('error', (err: unknown) => {
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
  }, [pusher]);

  // Refresh room data from API
  const refreshRoom = useCallback(async () => {
    if (!room?.roomCode) return;

    try {
      const response = await fetch(`/api/rooms/${room.roomCode}`);
      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.room) setRoom(data.room);
        if (data.players) setPlayers(data.players);
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
    roomChannel.bind('player-joined', (data: unknown) => {
      const playerData = data as PlayerJoinedData;
      showSuccess(`${playerData.playerName} joined the room`);
      refreshRoom();
    });

    // Game started event
    roomChannel.bind('game-started', () => {
      showSuccess('Game has started!');
      refreshRoom();
    });

    // Description submitted event
    roomChannel.bind('description-submitted', (data: unknown) => {
      const descriptionData = data as DescriptionSubmittedData;
      showInfo(`${descriptionData.playerName} submitted their description`);
      refreshRoom();
    });

    // Vote submitted event
    roomChannel.bind('vote-submitted', (data: unknown) => {
      const voteData = data as VoteSubmittedData;
      showInfo(`${voteData.playerName} voted`);
      refreshRoom();
    });

    // Player eliminated event
    roomChannel.bind('player-eliminated', (data: unknown) => {
      const eliminatedData = data as PlayerEliminatedData;
      showWarning(`${eliminatedData.playerName} was eliminated!`);
      refreshRoom();
    });

    // Game ended event
    roomChannel.bind('game-ended', (data: unknown) => {
      const gameEndData = data as GameEndedData;
      showSuccess(`Game ended! Winner: ${gameEndData.winner}`);
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

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        showSuccess('Room created successfully!');
        
        // Fetch room details and subscribe
        const roomResponse = await fetch(`/api/rooms/${data.roomCode}`);
        if (roomResponse.ok) {
          const roomData: ApiResponse = await roomResponse.json();
          if (roomData.room) setRoom(roomData.room);
          if (roomData.players) setPlayers(roomData.players);
          if (data.roomCode) subscribeToRoom(data.roomCode);
        }
        
        return data.roomCode || null;
      } else {
        setError(data.error || 'Failed to create room');
        showError(data.error || 'Failed to create room');
        return null;
      }
    } catch {
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

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        showSuccess('Joined room successfully!');
        
        // Fetch room details and subscribe
        const roomResponse = await fetch(`/api/rooms/${data.roomCode}`);
        if (roomResponse.ok) {
          const roomData: ApiResponse = await roomResponse.json();
          if (roomData.room) setRoom(roomData.room);
          if (roomData.players) setPlayers(roomData.players);
          if (data.roomCode) subscribeToRoom(data.roomCode);
        }
        
        return true;
      } else {
        setError(data.error || 'Failed to join room');
        showError(data.error || 'Failed to join room');
        return false;
      }
    } catch {
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

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to start game');
        return false;
      }
    } catch {
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

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to submit description');
        return false;
      }
    } catch {
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

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to submit vote');
        return false;
      }
    } catch {
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

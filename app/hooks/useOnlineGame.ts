import { useState, useEffect, useCallback } from 'react';
import { getPusherClient } from '../lib/pusher';
import { useToast } from './useToast';

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
  loadRoom: (roomCode: string) => Promise<void>;
  loadRoomAndSubscribe: (roomCode: string) => Promise<void>;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load room data from API by room code
  const loadRoom = useCallback(async (roomCode: string, retryCount = 0) => {
    if (!roomCode) return;

    try {
      console.log(`Loading room ${roomCode}, attempt ${retryCount + 1}`);
      const response = await fetch(`/api/rooms/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Room data loaded:', data);
        setRoom(data.room);
        setPlayers(data.players);
      } else {
        console.error('Failed to load room, status:', response.status);
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          setTimeout(() => loadRoom(roomCode, retryCount + 1), Math.pow(2, retryCount) * 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load room:', error);
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        setTimeout(() => loadRoom(roomCode, retryCount + 1), Math.pow(2, retryCount) * 1000);
      }
    }
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
    } catch (error) {
      console.error('Failed to refresh room:', error);
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
      const eventData = data as { playerName: string };
      console.log('Player joined event:', eventData);
      showSuccess(`${eventData.playerName} se unió a la sala`);
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Game started event
    roomChannel.bind('game-started', (data: unknown) => {
      console.log('Game started event:', data);
      showSuccess('¡El juego ha comenzado!');
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Description submitted event
    roomChannel.bind('description-submitted', (data: unknown) => {
      const eventData = data as { playerName: string };
      console.log('Description submitted event:', eventData);
      showInfo(`${eventData.playerName} envió su descripción`);
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Vote submitted event
    roomChannel.bind('vote-submitted', (data: unknown) => {
      const eventData = data as { playerName: string };
      console.log('Vote submitted event:', eventData);
      showInfo(`${eventData.playerName} votó`);
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Player eliminated event
    roomChannel.bind('player-eliminated', (data: unknown) => {
      const eventData = data as { playerName: string };
      console.log('Player eliminated event:', eventData);
      showWarning(`¡${eventData.playerName} fue eliminado!`);
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Game ended event
    roomChannel.bind('game-ended', (data: unknown) => {
      const eventData = data as { winner: string };
      console.log('Game ended event:', eventData);
      showSuccess(`¡Juego terminado! Ganador: ${eventData.winner}`);
      // Use setTimeout to ensure immediate reload
      setTimeout(() => loadRoom(roomCode), 100);
    });

    // Room deleted event
    roomChannel.bind('room-deleted', () => {
      console.log('Room deleted event');
      showError('La sala fue eliminada');
      setRoom(null);
      setPlayers([]);
    });

    console.log(`Subscribed to channel: ${channelName}`);

  }, [pusher, showSuccess, showInfo, showWarning, showError, loadRoom]);

  // Function to load room and subscribe to events
  const loadRoomAndSubscribe = useCallback(async (roomCode: string) => {
    console.log('Loading room and subscribing to:', roomCode);
    await loadRoom(roomCode);
    subscribeToRoom(roomCode);
    
    // Additional safety check - reload again after a short delay
    setTimeout(async () => {
      console.log('Safety reload for room:', roomCode);
      await loadRoom(roomCode);
    }, 1000);
  }, [loadRoom, subscribeToRoom]);

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
    } catch (error) {
      const errorMsg = 'Failed to create room';
      console.error(errorMsg, error);
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
    } catch (error) {
      const errorMsg = 'Failed to join room';
      console.error(errorMsg, error);
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
      // 1. Asignar roles automáticamente
      const rolesResponse = await fetch('/api/rooms/assign-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: room.roomCode }),
      });

      if (!rolesResponse.ok) {
        showError('Failed to assign roles');
        return false;
      }

      // 2. Obtener palabras del juego si no se proporcionaron
      let gameWords = words;
      if (!words.currentWord || !words.undercoverWord) {
        const wordsResponse = await fetch('/api/words?difficulty=medium&count=1');
        if (wordsResponse.ok) {
          const wordsData = await wordsResponse.json();
          if (wordsData.success && wordsData.word) {
            gameWords = {
              currentWord: wordsData.word.civilWord,
              undercoverWord: wordsData.word.undercoverWord
            };
            console.log('Game words loaded:', gameWords);
          }
        }
      }

      // 3. Iniciar el juego
      console.log('Starting game with words:', gameWords);
      const response = await fetch(`/api/rooms/${room.roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_game',
          currentWord: gameWords.currentWord,
          undercoverWord: gameWords.undercoverWord,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        showError(data.error || 'Failed to start game');
        return false;
      }
    } catch (error) {
      console.error('Failed to start game:', error);
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
    } catch (error) {
      console.error('Failed to submit description:', error);
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
    } catch (error) {
      console.error('Failed to submit vote:', error);
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
    loadRoom,
    loadRoomAndSubscribe,
    refreshRoom,
  };
}

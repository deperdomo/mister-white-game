import { useState, useEffect, useCallback } from 'react';
import { getPusherClient } from '../lib/pusher';
import { useToast } from './useToast';
import type { GameSettings, Role } from '../lib/game-logic';

export interface JoinRequest {
  requestId: string;
  playerName: string;
}

// Debe ser bastante menor que STALE_MS (lib/rooms.ts)
const HEARTBEAT_MS = 20_000;

const hostTokenKey = (roomCode: string) => `mw-host-${roomCode}`;
const getHostToken = (roomCode: string) =>
  typeof window === 'undefined' ? null : localStorage.getItem(hostTokenKey(roomCode));

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
  role: Role | null;
  isAlive: boolean;
}

interface OnlineRoom {
  id: string;
  roomCode: string;
  status: string;
  currentRound: number;
  maxPlayers: number;
  currentWord: string | null;
  undercoverWord: string | null;
  currentCategory: string | null;
  createdAt: string;
}

interface UseOnlineGameState {
  room: OnlineRoom | null;
  players: OnlinePlayer[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  roomClosed: boolean;
  joinRequests: JoinRequest[];
  respondJoinRequest: (req: JoinRequest, accept: boolean) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  createRoom: (playerName: string) => Promise<string | null>;
  leaveRoom: () => void;
  startRound: (settings: GameSettings) => Promise<boolean>;
  backToLobby: () => Promise<boolean>;
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
  const [roomClosed, setRoomClosed] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const { success: showSuccess, error: showError } = useToast();

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
        
        // Clear any previous errors on successful load
        setError(null);
      } else if (response.status === 404) {
        setRoomClosed(true);
        setRoom(null);
        setPlayers([]);
      } else {
        console.error('Failed to load room, status:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          console.log(`Retrying room load in ${Math.pow(2, retryCount)} seconds...`);
          setTimeout(() => loadRoom(roomCode, retryCount + 1), Math.pow(2, retryCount) * 1000);
        } else {
          setError('Failed to load room after multiple attempts');
        }
      }
    } catch (error) {
      console.error('Failed to load room:', error);
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        console.log(`Retrying room load in ${Math.pow(2, retryCount)} seconds...`);
        setTimeout(() => loadRoom(roomCode, retryCount + 1), Math.pow(2, retryCount) * 1000);
      } else {
        setError('Failed to load room after multiple attempts');
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

  // Subscribe to room channel with proper cleanup
  const subscribeToRoom = useCallback((roomCode: string) => {
    if (!pusher) return;

    const channelName = `room-${roomCode}`;
    
    // Check if already subscribed to this channel
    if (channel && channel.name === channelName) {
      console.log(`Already subscribed to channel: ${channelName}`);
      return;
    }
    
    // Unsubscribe from previous channel if exists
    if (channel) {
      console.log(`Unsubscribing from previous channel: ${channel.name}`);
      pusher.unsubscribe(channel.name);
    }

    const roomChannel = pusher.subscribe(channelName);
    setChannel(roomChannel);

    // Player joined event
    roomChannel.bind('player-joined', (data: unknown) => {
      const eventData = data as { playerName: string };
      console.log('Player joined event:', eventData);
      showSuccess(`${eventData.playerName} se unió a la sala`);
      // Debounced reload to prevent excessive calls
      setTimeout(() => loadRoom(roomCode), 500);
    });

    // Nueva ronda (roles y palabra nuevos) o vuelta a la sala de espera
    roomChannel.bind('round-started', () => loadRoom(roomCode));
    roomChannel.bind('back-to-lobby', () => loadRoom(roomCode));

    // Room deleted event
    roomChannel.bind('room-deleted', () => {
      console.log('Room deleted event');
      showError('La sala fue eliminada');
      setRoomClosed(true);
      setRoom(null);
      setPlayers([]);
    });

    // Solicitudes de entrada (solo las muestra el host)
    roomChannel.bind('join-request', (data: unknown) => {
      if (!getHostToken(roomCode)) return;
      const req = data as JoinRequest;
      setJoinRequests(prev => [...prev.filter(r => r.requestId !== req.requestId), req]);
      navigator.vibrate?.(200);
      // ponytail: caduca a los 60s, igual que el timeout del que la pide
      setTimeout(() => setJoinRequests(prev => prev.filter(r => r.requestId !== req.requestId)), 60_000);
    });

    roomChannel.bind('join-request-cancelled', (data: unknown) => {
      const { requestId } = data as { requestId: string };
      setJoinRequests(prev => prev.filter(r => r.requestId !== requestId));
    });

    console.log(`Subscribed to channel: ${channelName}`);

  }, [pusher, channel, showSuccess, showError, loadRoom]);

  // Function to load room and subscribe to events with debouncing
  const loadRoomAndSubscribe = useCallback(async (roomCode: string) => {
    console.log('Loading room and subscribing to:', roomCode);
    await loadRoom(roomCode);
    subscribeToRoom(roomCode);
  }, [loadRoom, subscribeToRoom]);

  // Create room
  const createRoom = useCallback(async (playerName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem(hostTokenKey(data.roomCode), data.hostToken);
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

  // Leave room (si es el host, cierra la sala para no dejar basura)
  const leaveRoom = useCallback(() => {
    if (room && getHostToken(room.roomCode)) {
      localStorage.removeItem(hostTokenKey(room.roomCode));
      fetch(`/api/rooms/${room.roomCode}`, { method: 'DELETE', keepalive: true }).catch(() => {});
    }
    if (channel) {
      pusher?.unsubscribe(channel.name);
      setChannel(null);
    }
    setRoom(null);
    setPlayers([]);
    setError(null);
  }, [room, channel, pusher]);

  // Latido del host: mientras tenga la sala abierta, la mantiene viva
  const roomCode = room?.roomCode;
  useEffect(() => {
    if (!roomCode) return;
    const hostToken = getHostToken(roomCode);
    if (!hostToken) return;

    const beat = () => {
      fetch(`/api/rooms/${roomCode}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostToken }),
      }).catch(() => {});
    };
    const onVisible = () => document.visibilityState === 'visible' && beat();

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [roomCode]);

  const respondJoinRequest = useCallback(async (req: JoinRequest, accept: boolean) => {
    if (!roomCode) return;
    setJoinRequests(prev => prev.filter(r => r.requestId !== req.requestId));
    try {
      const res = await fetch(`/api/rooms/${roomCode}/requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostToken: getHostToken(roomCode), ...req, accept }),
      });
      if (!res.ok) showError((await res.json()).error || 'No se pudo responder');
    } catch {
      showError('No se pudo responder');
    }
  }, [roomCode, showError]);

  // Acciones del host sobre la ronda
  const hostRoundAction = useCallback(async (method: 'POST' | 'DELETE', settings?: GameSettings): Promise<boolean> => {
    if (!room) return false;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/round`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostToken: getHostToken(room.roomCode), settings }),
      });
      if (!res.ok) {
        showError((await res.json()).error || 'No se pudo completar la acción');
        return false;
      }
      await loadRoom(room.roomCode);
      return true;
    } catch {
      showError('No se pudo completar la acción');
      return false;
    }
  }, [room, showError, loadRoom]);

  const startRound = useCallback((settings: GameSettings) => hostRoundAction('POST', settings), [hostRoundAction]);
  const backToLobby = useCallback(() => hostRoundAction('DELETE'), [hostRoundAction]);

  return {
    room,
    players,
    isConnected,
    isLoading,
    error,
    roomClosed,
    joinRequests,
    respondJoinRequest,
    joinRoom,
    createRoom,
    leaveRoom,
    startRound,
    backToLobby,
    loadRoom,
    loadRoomAndSubscribe,
    refreshRoom,
  };
}

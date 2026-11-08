'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { getPusherClient } from '../../lib/pusher';
import { savePlayerToken } from '../../hooks/useOnlineGame';

interface OpenRoom {
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

interface Pending {
  room: OpenRoom;
  requestId: string;
}

interface OpenRoomsProps {
  playerName: string;
  // Valida el nombre y muestra el error en el formulario si falta
  validateName: () => boolean;
}

const REQUEST_TIMEOUT_MS = 60_000;

export default function OpenRooms({ playerName, validateName }: OpenRoomsProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<OpenRoom[] | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      if (res.ok) setRooms((await res.json()).rooms);
    } catch {
      // se reintenta en el siguiente ciclo
    }
  }, []);

  // Lista en vivo: aviso instantáneo al crear sala + refresco periódico (llenas/cerradas)
  useEffect(() => {
    const pusher = getPusherClient();
    pusherRef.current = pusher;
    pusher.subscribe('global-events').bind('room-created', loadRooms);

    loadRooms();
    const id = setInterval(loadRooms, 5000);
    return () => {
      clearInterval(id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      pusher.disconnect();
    };
  }, [loadRooms]);

  const stopWaiting = useCallback((requestId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pusherRef.current?.unsubscribe(`join-request-${requestId}`);
    setPending(null);
  }, []);

  const requestJoin = (room: OpenRoom) => {
    setMessage(null);
    if (!validateName() || !pusherRef.current || pending) return;

    const name = playerName.trim();
    const requestId = crypto.randomUUID();
    setPending({ room, requestId });

    // Suscribirse al canal de respuesta ANTES de enviar la solicitud
    const channel = pusherRef.current.subscribe(`join-request-${requestId}`);
    channel.bind('join-response', (data: { accepted: boolean; error?: string; playerToken?: string }) => {
      stopWaiting(requestId);
      if (data.accepted) {
        if (data.playerToken) savePlayerToken(room.roomCode, data.playerToken);
        router.push(`/waiting-room?code=${room.roomCode}&name=${encodeURIComponent(name)}`);
      } else {
        setMessage(data.error ?? `${room.hostName} ha rechazado tu solicitud`);
      }
    });
    channel.bind('pusher:subscription_succeeded', async () => {
      try {
        const res = await fetch(`/api/rooms/${room.roomCode}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, playerName: name }),
        });
        if (!res.ok) {
          stopWaiting(requestId);
          setMessage((await res.json()).error ?? 'No se pudo enviar la solicitud');
          loadRooms();
        }
      } catch {
        stopWaiting(requestId);
        setMessage('No se pudo enviar la solicitud');
      }
    });

    timeoutRef.current = setTimeout(() => {
      cancel(requestId, room.roomCode);
      setMessage(`${room.hostName} no ha respondido. Inténtalo de nuevo.`);
    }, REQUEST_TIMEOUT_MS);
  };

  const cancel = (requestId: string, roomCode: string) => {
    stopWaiting(requestId);
    fetch(`/api/rooms/${roomCode}/requests`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    }).catch(() => {});
  };

  if (pending) {
    return (
      <div className="p-4 rounded-xl border border-accent/30 bg-accent/10 text-center space-y-4" aria-live="polite">
        <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
        <p className="text-fg">
          Esperando a que <strong>{pending.room.hostName}</strong> te acepte…
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => cancel(pending.requestId, pending.room.roomCode)}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {message && (
        <div className="flex items-center gap-2 text-sm text-red-400" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {rooms === null ? (
        <p className="py-4 text-center text-sm text-muted">
          <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
          Buscando salas…
        </p>
      ) : rooms.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No hay salas abiertas ahora mismo</p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => {
            const full = room.playerCount >= room.maxPlayers;
            return (
              <li key={room.roomCode}>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => requestJoin(room)}
                  className="w-full min-h-14 px-4 py-3 flex items-center gap-3 rounded-xl border border-white/10 bg-panel text-left transition active:scale-[0.98] hover:border-accent/40 disabled:opacity-40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-fg truncate">Sala de {room.hostName}</p>
                    <p className="text-xs text-muted font-mono">{room.roomCode}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Users className="h-4 w-4" />
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                  <ChevronRight className="h-5 w-5 text-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

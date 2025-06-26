import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Configuración del servidor Pusher
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Configuración del cliente Pusher
export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('PusherClient can only be used on the client side');
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    enabledTransports: ['ws', 'wss'],
  });
};

// Función para generar el nombre del canal de una sala
export const getRoomChannelName = (roomCode: string) => `room-${roomCode}`;

// Función para generar el nombre del canal global
export const getGlobalChannelName = () => 'global-events';

// Debug logging para desarrollo
const isDev = process.env.NODE_ENV === 'development';

export const debugLog = (message: string, data?: unknown) => {
  if (isDev) {
    console.log(`[Pusher DEBUG] ${message}`, data);
  }
};

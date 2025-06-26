'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Copy, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import WaitingRoom from "../components/game/WaitingRoom";
import { Player } from "../lib/types";

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';
  const isHost = searchParams.get('host') === 'true';
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simular datos iniciales de la sala
  useEffect(() => {
    // TODO: Cargar datos reales de la sala desde Supabase
    const mockPlayers: Player[] = [
      {
        id: '1',
        name: 'Tu nombre',
        role: 'civil',
        isHost: isHost,
        isAlive: true,
        joinedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jugador 2',
        role: 'civil',
        isHost: false,
        isAlive: true,
        joinedAt: new Date().toISOString(),
      },
    ];

    setPlayers(mockPlayers);
  }, [isHost]);

  const handleStartGame = async () => {
    if (players.length < 3) {
      alert('Se necesitan al menos 3 jugadores para empezar');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar lógica real de inicio de juego
      console.log('Iniciando juego con jugadores:', players);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirigir al juego
      router.push(`/game?code=${roomCode}`);
      
    } catch (error) {
      console.error('Error al iniciar juego:', error);
      alert('Error al iniciar el juego. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    // TODO: Implementar lógica de salir de la sala
    router.push('/');
  };

  if (!roomCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Código de sala no válido</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleLeaveRoom}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Salir
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Sala de Espera
          </h1>
        </div>
        
        {isHost && (
          <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full">
            <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Anfitrión</span>
          </div>
        )}
      </div>

      {/* Código de sala */}
      <Card className="mb-6">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg">Código de Sala</CardTitle>
          <CardDescription>Comparte este código con tus amigos</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-slate-50 tracking-wider">
              {roomCode}
            </div>
          </div>
          <Button onClick={handleCopyCode} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copiado!' : 'Copiar código'}
          </Button>
        </CardContent>
      </Card>

      {/* Componente de sala de espera */}
      <WaitingRoom
        roomCode={roomCode}
        players={players}
        maxPlayers={6}
        isHost={isHost}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        isLoading={isLoading}
      />

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Consejos mientras esperas
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Se necesitan al menos 3 jugadores para empezar</li>
          <li>• El anfitrión puede iniciar el juego cuando esté listo</li>
          <li>• Los jugadores pueden unirse hasta que comience la partida</li>
          <li>• Una vez iniciado, no se pueden unir más jugadores</li>
        </ul>
      </div>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400">Cargando sala de espera...</p>
      </div>
    }>
      <WaitingRoomContent />
    </Suspense>
  );
}

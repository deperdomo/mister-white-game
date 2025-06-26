'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Users, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Player } from "../lib/types";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase] = useState<'assigning' | 'describing' | 'voting'>('assigning');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) {
      router.push('/');
      return;
    }

    // TODO: Cargar datos reales del juego desde Supabase
    // Simular carga de datos
    setTimeout(() => {
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'Tu nombre',
          role: 'civil',
          isHost: true,
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
        {
          id: '3',
          name: 'Jugador 3',
          role: 'civil',
          isHost: false,
          isAlive: true,
          joinedAt: new Date().toISOString(),
        },
      ];
      
      setPlayers(mockPlayers);
      setIsLoading(false);
    }, 2000);
  }, [roomCode, router]);

  const handleLeaveGame = () => {
    // TODO: Implementar lógica de salir del juego
    router.push('/');
  };

  if (!roomCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Código de sala no válido</p>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle>Preparando el juego...</CardTitle>
            <CardDescription>Asignando roles y configurando la partida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleLeaveGame}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Salir
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Sala {roomCode}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4" />
          <span>{players.length} jugadores</span>
        </div>
      </div>

      {/* Estado del juego */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentPhase === 'assigning' && 'Asignando roles...'}
              {currentPhase === 'describing' && 'Fase de descripción'}
              {currentPhase === 'voting' && 'Fase de votación'}
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-500">En progreso</span>
            </div>
          </div>
          <CardDescription>
            {currentPhase === 'assigning' && 'Se están asignando los roles secretos a cada jugador...'}
            {currentPhase === 'describing' && 'Cada jugador debe describir su palabra sin mencionarla directamente'}
            {currentPhase === 'voting' && 'Es hora de votar para eliminar a un jugador sospechoso'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentPhase === 'assigning' && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Los roles se están asignando automáticamente...
                </p>
              </div>
            )}
            
            {currentPhase === 'describing' && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Tu rol ha sido asignado
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Pronto podrás ver tu rol y palabra secreta. El juego comenzará cuando todos estén listos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jugadores en la sala</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {player.name}
                  </span>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                      Anfitrión
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-500">Conectado</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información del juego */}
      <div className="mt-6 bg-amber-50 dark:bg-amber-950 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
          ⏳ El juego está iniciando
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          En unos momentos verás tu rol secreto y podrás comenzar a jugar. 
          Mantente atento a las notificaciones.
        </p>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}

import React from 'react';
import { Player } from '../../lib/types';
import { Crown, User, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface WaitingRoomProps {
  roomCode: string;
  players: Player[];
  currentPlayer?: Player;
  maxPlayers: number;
  isHost: boolean;
  onStartGame?: () => void;
  onLeaveRoom?: () => void;
  isLoading?: boolean;
}

export default function WaitingRoom({
  roomCode,
  players,
  currentPlayer,
  maxPlayers,
  isHost,
  onStartGame,
  onLeaveRoom,
  isLoading = false
}: WaitingRoomProps) {
  const canStartGame = players.length >= 3 && isHost && !isLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header de la sala */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Sala de Espera
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg text-slate-600 dark:text-slate-400">
            Código de sala:
          </span>
          <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-lg font-mono font-bold tracking-wider">
            {roomCode}
          </code>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
          Comparte este código con tus amigos para que se unan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de jugadores */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Jugadores ({players.length}/{maxPlayers})</span>
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isCurrentPlayer={currentPlayer?.id === player.id}
                    playerNumber={index + 1}
                  />
                ))}
                
                {/* Slots vacíos */}
                {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
                  <EmptyPlayerSlot 
                    key={`empty-${index}`} 
                    slotNumber={players.length + index + 1} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de control */}
        <div className="space-y-6">
          {/* Estado del juego */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Juego</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jugadores mínimos:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jugadores actuales:</span>
                  <span className="font-medium">{players.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jugadores máximos:</span>
                  <span className="font-medium">{maxPlayers}</span>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>Progreso</span>
                  <span>{Math.min(100, (players.length / 3) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (players.length / 3) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="text-center">
                {players.length < 3 ? (
                  <div className="text-amber-600 dark:text-amber-400 text-sm">
                    ⏳ Esperando más jugadores...
                  </div>
                ) : (
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    ✅ ¡Listo para empezar!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHost ? (
                <>
                  <button
                    onClick={onStartGame}
                    disabled={!canStartGame}
                    className={cn(
                      'w-full py-3 px-4 rounded-lg font-medium transition-all',
                      canStartGame
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? 'Iniciando...' : 'Iniciar Juego'}
                  </button>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                    Solo el anfitrión puede iniciar el juego
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Esperando a que el anfitrión inicie el juego...
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={onLeaveRoom}
                disabled={isLoading}
                className="w-full py-2 px-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
              >
                Salir de la Sala
              </button>
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Cómo jugar?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>1. Cada jugador recibe un rol secreto</p>
                <p>2. Por turnos, describen la palabra</p>
                <p>3. Votan para eliminar sospechosos</p>
                <p>4. ¡Gana el mejor detective!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente para cada jugador
interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  playerNumber: number;
}

function PlayerCard({ player, isCurrentPlayer, playerNumber }: PlayerCardProps) {
  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 rounded-lg border transition-all',
      isCurrentPlayer 
        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm',
        isCurrentPlayer 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
      )}>
        {playerNumber}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={cn(
            'font-medium truncate',
            isCurrentPlayer ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'
          )}>
            {player.name}
          </p>
          {player.isHost && (
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
          {isCurrentPlayer && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
              Tú
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 mt-1">
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400">Conectado</span>
        </div>
      </div>
    </div>
  );
}

// Componente para slots vacíos
function EmptyPlayerSlot({ slotNumber }: { slotNumber: number }) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 opacity-60">
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
        <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      
      <div className="flex-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Esperando jugador {slotNumber}...
        </p>
        <div className="flex items-center space-x-1 mt-1">
          <WifiOff className="h-3 w-3 text-slate-400 dark:text-slate-500" />
          <span className="text-xs text-slate-400 dark:text-slate-500">Desconectado</span>
        </div>
      </div>
    </div>
  );
}

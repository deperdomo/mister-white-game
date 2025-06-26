'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import PlayerNameForm from "../../components/forms/PlayerNameForm";

export default function LocalGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartLocalGame = async (playerNames: string[], difficulty: 'easy' | 'medium' | 'hard') => {
    setIsLoading(true);
    try {
      // TODO: Implementar lógica de juego local
      console.log('Iniciando juego local con jugadores:', playerNames, 'dificultad:', difficulty);
      
      // Simular delay de preparación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirigir a la sala de juego local con los parámetros
      const searchParams = new URLSearchParams({
        players: JSON.stringify(playerNames),
        difficulty: difficulty
      });
      router.push(`/local-game?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Error al iniciar juego local:', error);
      throw error; // El formulario manejará el error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header con navegación */}
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Modo Local
        </h1>
      </div>

      {/* Formulario de configuración local */}
      <PlayerNameForm 
        onSubmit={handleStartLocalGame}
        isLoading={isLoading}
      />

      {/* Información sobre el modo local */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          🎮 Sobre el Modo Local
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>• <strong>Un solo dispositivo:</strong> Todos los jugadores usan el mismo teléfono/tablet</li>
          <li>• <strong>Turnos rotativos:</strong> Cada jugador toma el dispositivo en su turno</li>
          <li>• <strong>Sin internet:</strong> No necesitas conexión para jugar</li>
          <li>• <strong>Privacidad:</strong> El juego se mantiene en tu dispositivo</li>
        </ul>
      </div>

      {/* Alternativas */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          ¿Prefieres jugar en línea?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/create-room">
            <Button variant="outline" className="w-full">
              Crear sala online
            </Button>
          </Link>
          <Link href="/join-room">
            <Button variant="outline" className="w-full">
              Unirse a sala
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

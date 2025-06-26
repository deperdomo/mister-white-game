import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { isValidPlayerName } from '../../lib/utils';
import { useOnlineGame } from '../../hooks/useOnlineGame';

interface CreateRoomFormData {
  playerName: string;
  maxPlayers: number;
}

export default function CreateRoomForm() {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    playerName: '',
    maxPlayers: 6,
  });
  
  const [errors, setErrors] = useState<Partial<CreateRoomFormData>>({});
  const { createRoom, isLoading } = useOnlineGame();
  const router = useRouter();

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<CreateRoomFormData> = {};

    if (!isValidPlayerName(formData.playerName)) {
      newErrors.playerName = 'El nombre debe tener entre 2 y 20 caracteres';
    }

    if (formData.maxPlayers < 3 || formData.maxPlayers > 8) {
      newErrors.maxPlayers = 'Debe ser entre 3 y 8 jugadores' as never;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isLoading) return;

    const roomCode = await createRoom(formData.playerName, formData.maxPlayers);
    if (roomCode) {
      // Redirect to waiting room with room code
      router.push(`/waiting-room?code=${roomCode}&name=${encodeURIComponent(formData.playerName)}`);
    }
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof CreateRoomFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mb-4">
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle>Nueva Sala Online</CardTitle>
        <CardDescription>
          Configura tu sala y comparte el código con tus amigos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del jugador */}
          <div className="space-y-2">
            <Label htmlFor="playerName">
              Tu nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="playerName"
              type="text"
              placeholder="Escribe tu nombre"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', e.target.value)}
              maxLength={20}
              disabled={isLoading}
              className={errors.playerName ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.playerName && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.playerName}</span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Máximo 20 caracteres
            </p>
          </div>

          {/* Número máximo de jugadores */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Número máximo de jugadores</Label>
            <select
              id="maxPlayers"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md 
                bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {[3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>
                  {num} jugadores
                </option>
              ))}
            </select>
            {errors.maxPlayers && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.maxPlayers}</span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Entre 3 y 8 jugadores
            </p>
          </div>

          {/* Botón de envío */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando sala...
              </>
            ) : (
              'Crear Sala'
            )}
          </Button>
        </form>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <ul className="space-y-1 text-xs">
                <li>• Creas una sala con un código único</li>
                <li>• Compartes el código con tus amigos</li>
                <li>• Esperan en la sala hasta que todos se unan</li>
                <li>• ¡Empiezan a jugar!</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

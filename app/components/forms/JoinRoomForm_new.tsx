import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { isValidPlayerName } from '../../lib/utils';
import { useOnlineGame } from '../../hooks/useOnlineGame';

interface JoinRoomFormData {
  roomCode: string;
  playerName: string;
}

export default function JoinRoomForm() {
  const [formData, setFormData] = useState<JoinRoomFormData>({
    roomCode: '',
    playerName: '',
  });
  
  const [errors, setErrors] = useState<Partial<JoinRoomFormData>>({});
  const { joinRoom, isLoading } = useOnlineGame();
  const router = useRouter();

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<JoinRoomFormData> = {};

    if (!formData.roomCode.trim() || formData.roomCode.length !== 6) {
      newErrors.roomCode = 'El código debe tener exactamente 6 caracteres';
    }

    if (!isValidPlayerName(formData.playerName)) {
      newErrors.playerName = 'El nombre debe tener entre 2 y 20 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isLoading) return;

    const success = await joinRoom(formData.roomCode.trim().toUpperCase(), formData.playerName);
    if (success) {
      // Redirect to waiting room
      router.push(`/waiting-room?code=${formData.roomCode.trim().toUpperCase()}&name=${encodeURIComponent(formData.playerName)}`);
    }
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof JoinRoomFormData, value: string) => {
    if (field === 'roomCode') {
      // Convert to uppercase and limit to 6 characters
      value = value.toUpperCase().slice(0, 6);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
          <UserPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle>Unirse a Sala</CardTitle>
        <CardDescription>
          Introduce el código de la sala para unirte al juego
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código de la sala */}
          <div className="space-y-2">
            <Label htmlFor="roomCode">
              Código de la sala <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="ABC123"
              value={formData.roomCode}
              onChange={(e) => handleInputChange('roomCode', e.target.value)}
              maxLength={6}
              disabled={isLoading}
              className={`text-center text-lg font-mono tracking-wider ${
                errors.roomCode ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            {errors.roomCode && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.roomCode}</span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Código de 6 caracteres proporcionado por el anfitrión
            </p>
          </div>

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

          {/* Botón de envío */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uniéndose...
              </>
            ) : (
              'Unirse a la Sala'
            )}
          </Button>
        </form>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium mb-1">¿No tienes un código?</p>
              <ul className="space-y-1 text-xs">
                <li>• Pídele al anfitrión que te comparta el código</li>
                <li>• O créate tu propia sala desde la página principal</li>
                <li>• El código es generado automáticamente al crear una sala</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

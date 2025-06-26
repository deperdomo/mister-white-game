import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, LogIn, Wifi } from 'lucide-react';
import { JoinRoomFormData } from '../../lib/types';
import { isValidPlayerName, isValidRoomCode } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';

interface JoinRoomFormProps {
  onSubmit: (data: JoinRoomFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function JoinRoomForm({ onSubmit, isLoading = false }: JoinRoomFormProps) {
  const [formData, setFormData] = useState<JoinRoomFormData>({
    playerName: '',
    roomCode: '',
  });
  
  const [errors, setErrors] = useState<Partial<JoinRoomFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastContext();

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<JoinRoomFormData> = {};

    if (!isValidPlayerName(formData.playerName)) {
      newErrors.playerName = 'El nombre debe tener entre 2 y 20 caracteres';
    }

    if (!isValidRoomCode(formData.roomCode)) {
      newErrors.roomCode = 'El código debe tener 6 caracteres (letras y números)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || isLoading) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Uniéndose a la sala', 'Conectando con otros jugadores...');
    } catch (error) {
      console.error('Error en JoinRoomForm:', error);
      toast.error('Error al unirse a la sala', 'Verifica el código y tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof JoinRoomFormData, value: string) => {
    let processedValue = value;
    
    // Procesar código de sala
    if (field === 'roomCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
          <LogIn className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle>Unirse a Sala Existente</CardTitle>
        <CardDescription>
          Ingresa el código de sala que te compartió tu amigo
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código de sala */}
          <div className="space-y-2">
            <Label htmlFor="roomCode">
              Código de sala <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="ABC123"
              value={formData.roomCode}
              onChange={(e) => handleInputChange('roomCode', e.target.value)}
              maxLength={6}
              disabled={loading}
              className={`text-center text-lg font-mono tracking-wider ${
                errors.roomCode ? 'border-red-500 focus:border-red-500' : ''
              }`}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.roomCode && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.roomCode}</span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Código de 6 caracteres (letras y números)
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
              disabled={loading}
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
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uniéndose...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Unirse a la Sala
              </>
            )}
          </Button>

          {/* Estado de conexión */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-2">
              Estado de la conexión
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Conectado y listo para unirse
              </span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              ¿Qué sucede después?
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <li>• Te unirás automáticamente a la sala</li>
              <li>• Verás a los otros jugadores conectados</li>
              <li>• Esperarás a que el anfitrión inicie el juego</li>
              <li>• ¡La diversión comenzará!</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

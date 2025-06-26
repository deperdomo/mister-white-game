import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { CreateRoomFormData } from '../../lib/types';
import { isValidPlayerName } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';

interface CreateRoomFormProps {
  onSubmit: (data: CreateRoomFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateRoomForm({ onSubmit, isLoading = false }: CreateRoomFormProps) {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    playerName: '',
    maxPlayers: 6,
    difficulty: 'medium',
  });
  
  const [errors, setErrors] = useState<Partial<CreateRoomFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastContext();

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
    
    if (!validateForm() || isSubmitting || isLoading) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Sala creada exitosamente', 'Redirigiendo a la sala de espera...');
    } catch (error) {
      console.error('Error en CreateRoomForm:', error);
      toast.error('Error al crear la sala', 'No se pudo crear la sala. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof CreateRoomFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const loading = isLoading || isSubmitting;

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

          {/* Número máximo de jugadores */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Número máximo de jugadores</Label>
            <select
              id="maxPlayers"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
              disabled={loading}
              className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
            >
              {[3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} jugadores</option>
              ))}
            </select>
            {errors.maxPlayers && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.maxPlayers}</span>
              </div>
            )}
          </div>

          {/* Dificultad */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Dificultad de las palabras</Label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
              disabled={loading}
              className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
            >
              <option value="easy">Fácil - Palabras comunes</option>
              <option value="medium">Medio - Variedad equilibrada</option>
              <option value="hard">Difícil - Palabras complejas</option>
            </select>
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
                Creando sala...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Crear Sala
              </>
            )}
          </Button>

          {/* Información adicional */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              ¿Qué sucede después?
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <li>• Se generará un código único de 6 caracteres</li>
              <li>• Podrás compartirlo con tus amigos</li>
              <li>• Serás el anfitrión de la sala</li>
              <li>• Podrás iniciar el juego cuando todos estén listos</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

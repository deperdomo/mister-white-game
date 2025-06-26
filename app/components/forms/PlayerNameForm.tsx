import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, Monitor, Play, Plus, Trash2, Users } from 'lucide-react';
import { isValidPlayerName } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';

interface PlayerNameFormProps {
  onSubmit: (playerNames: string[], difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
  isLoading?: boolean;
}

export default function PlayerNameForm({ onSubmit, isLoading = false }: PlayerNameFormProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastContext();

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    const validNames = playerNames.filter(name => name.trim().length > 0);

    if (validNames.length < 3) {
      newErrors.push('Se necesitan al menos 3 jugadores');
    }

    // Validar cada nombre
    validNames.forEach((name, index) => {
      if (!isValidPlayerName(name)) {
        newErrors.push(`Jugador ${index + 1}: Nombre inválido (2-20 caracteres)`);
      }
    });

    // Verificar nombres únicos
    const uniqueNames = new Set(validNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== validNames.length) {
      newErrors.push('Todos los nombres deben ser únicos');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || isLoading) return;

    setIsSubmitting(true);
    try {
      const validNames = playerNames.filter(name => name.trim().length > 0);
      await onSubmit(validNames, difficulty);
      toast.success('Juego local iniciado', 'Preparando roles y palabras...');
    } catch (error) {
      console.error('Error en PlayerNameForm:', error);
      toast.error('Error al iniciar el juego', 'No se pudo configurar el juego local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cambio de nombre de jugador
  const handlePlayerNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value.slice(0, 20); // Limitar a 20 caracteres
    setPlayerNames(newNames);
    
    // Limpiar errores al modificar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Agregar jugador
  const addPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, '']);
    }
  };

  // Remover jugador
  const removePlayer = (index: number) => {
    if (playerNames.length > 3) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const loading = isLoading || isSubmitting;
  const validPlayerCount = playerNames.filter(name => name.trim().length > 0).length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Configuración del juego local */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
            <Monitor className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Configurar Juego Local</CardTitle>
          <CardDescription>
            Perfecto para reuniones presenciales. Configura los jugadores y empieza a jugar.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dificultad */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad de las palabras</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                disabled={loading}
                className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
              >
                <option value="easy">Fácil - Palabras comunes</option>
                <option value="medium">Medio - Variedad equilibrada</option>
                <option value="hard">Difícil - Palabras complejas</option>
              </select>
            </div>

            {/* Lista de jugadores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Nombres de los jugadores ({validPlayerCount}/8)</Label>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Mínimo 3 jugadores
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playerNames.map((name, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`player${index}`} className="text-xs text-slate-500">
                        Jugador {index + 1}
                      </Label>
                      <Input
                        id={`player${index}`}
                        placeholder={`Nombre del jugador ${index + 1}`}
                        value={name}
                        onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                        maxLength={20}
                        disabled={loading}
                      />
                    </div>
                    {playerNames.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-red-500 hover:text-red-700"
                        onClick={() => removePlayer(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Botón agregar jugador */}
              {playerNames.length < 8 && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="w-full md:w-auto"
                  onClick={addPlayer}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar jugador
                </Button>
              )}
            </div>

            {/* Errores */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-2">
                Resumen del juego
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Jugadores:</span>
                  <span className="ml-2 font-medium">{validPlayerCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Dificultad:</span>
                  <span className="ml-2 font-medium capitalize">{difficulty}</span>
                </div>
              </div>
            </div>

            {/* Botón de inicio */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || validPlayerCount < 3}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando juego...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Iniciar Juego Local
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona el modo local?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                1. Configurar
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Agrega los nombres de todos los jugadores presentes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                2. Roles secretos
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Cada jugador verá su rol en la pantalla por turnos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Play className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                3. ¡A jugar!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sigue las instrucciones en pantalla para describir y votar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

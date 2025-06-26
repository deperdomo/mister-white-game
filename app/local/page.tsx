'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Settings, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription } from "../components/ui/alert";
import { MAX_PLAYERS, MIN_PLAYERS } from "../lib/types";

export default function LocalGameSetupPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<string[]>(['']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [includeUndercover, setIncludeUndercover] = useState(false);
  const [maxMisterWhites, setMaxMisterWhites] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) {
      setPlayers([...players, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Filter out empty player names
    const validPlayers = players.filter(p => p.trim() !== '');
    
    if (validPlayers.length < MIN_PLAYERS) {
      newErrors.push(`Se necesitan al menos ${MIN_PLAYERS} jugadores.`);
    }
    
    if (validPlayers.length > MAX_PLAYERS) {
      newErrors.push(`Máximo ${MAX_PLAYERS} jugadores permitidos.`);
    }
    
    // Check for duplicate names
    const uniqueNames = new Set(validPlayers.map(p => p.trim().toLowerCase()));
    if (uniqueNames.size !== validPlayers.length) {
      newErrors.push('Los nombres de los jugadores deben ser únicos.');
    }
    
    // Check for empty names
    if (validPlayers.some(p => p.trim().length < 2)) {
      newErrors.push('Los nombres deben tener al menos 2 caracteres.');
    }
    
    // Check Mr. White count
    const specialRoles = maxMisterWhites + (includeUndercover ? 1 : 0) + (validPlayers.length >= 8 ? 1 : 0); // +1 for Payaso if 8+ players
    if (specialRoles >= validPlayers.length) {
      newErrors.push('Demasiados roles especiales para el número de jugadores.');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleStartGame = () => {
    if (!validateForm()) return;
    
    const validPlayers = players.filter(p => p.trim() !== '');
    const config = {
      players: validPlayers,
      difficulty,
      includeUndercover,
      maxMisterWhites,
    };
    
    const params = new URLSearchParams({
      config: JSON.stringify(config),
    });
    
    router.push(`/local-game?${params.toString()}`);
  };

  const validPlayerCount = players.filter(p => p.trim() !== '').length;
  const includePayaso = validPlayerCount >= 8;
  const maxPossibleMisterWhites = Math.max(1, Math.floor(validPlayerCount / 3));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Configurar Juego Local
        </h1>
      </div>

      <div className="space-y-6">
        {/* Game Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Juego
            </CardTitle>
            <CardDescription>
              Personaliza las reglas del juego
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil (se muestra categoría)</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
              {difficulty === 'easy' && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  En dificultad fácil se mostrará la categoría de la palabra.
                </p>
              )}
            </div>

            {/* Include Undercover */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="undercover">Incluir rol Undercover</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Un jugador tendrá una palabra similar pero diferente
                </p>
              </div>
              <Switch
                id="undercover"
                checked={includeUndercover}
                onCheckedChange={setIncludeUndercover}
              />
            </div>

            {/* Mr. White Count */}
            <div className="space-y-2">
              <Label htmlFor="mrwhite-count">Número de Mr. White</Label>
              <Select value={maxMisterWhites.toString()} onValueChange={(value: string) => setMaxMisterWhites(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxPossibleMisterWhites }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payaso Info */}
            {includePayaso && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Con {validPlayerCount} jugadores se incluirá automáticamente el rol <strong>Payaso</strong>. 
                  El Payaso conoce la palabra civil y gana si es votado como si fuera Mr. White.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Jugadores ({validPlayerCount}/{MAX_PLAYERS})
            </CardTitle>
            <CardDescription>
              Añade los nombres de los jugadores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Jugador ${index + 1}`}
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                  maxLength={20}
                />
                {players.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removePlayer(index)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ))}
            
            {players.length < MAX_PLAYERS && (
              <Button variant="outline" onClick={addPlayer}>
                Añadir Jugador
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        {validPlayerCount >= MIN_PLAYERS && errors.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Juego</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Jugadores:</strong> {validPlayerCount}</p>
              <p><strong>Dificultad:</strong> {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil'}</p>
              <p><strong>Mr. White:</strong> {maxMisterWhites}</p>
              <p><strong>Undercover:</strong> {includeUndercover ? 'Sí' : 'No'}</p>
              <p><strong>Payaso:</strong> {includePayaso ? 'Sí (8+ jugadores)' : 'No'}</p>
              <p><strong>Civiles:</strong> {validPlayerCount - maxMisterWhites - (includeUndercover ? 1 : 0) - (includePayaso ? 1 : 0)}</p>
            </CardContent>
          </Card>
        )}

        {/* Start Game Button */}
        <Button 
          onClick={handleStartGame} 
          size="lg" 
          className="w-full"
          disabled={validPlayerCount < MIN_PLAYERS || errors.length > 0}
        >
          Comenzar Juego Local
        </Button>
      </div>
    </div>
  );
}

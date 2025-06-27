'use client';

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Users, Settings, Info, GripVertical } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription } from "../components/ui/alert";
import { MAX_PLAYERS, MIN_PLAYERS } from "../lib/types";
import { useWords } from "../hooks/useWords";

function LocalGameSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCategories } = useWords();
  
  const [players, setPlayers] = useState<string[]>(['', '', '']); // 3 espacios iniciales
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [includeUndercover, setIncludeUndercover] = useState(false);
  const [maxMisterWhites, setMaxMisterWhites] = useState(1);
  const [category, setCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [useDatabase, setUseDatabase] = useState(true);

  // Cargar configuración desde parámetros URL si están presentes
  useEffect(() => {
    const configParam = searchParams.get('config');
    
    if (configParam) {
      try {
        const config = JSON.parse(configParam);
        
        // Pre-llenar los campos con la configuración existente
        if (config.players && Array.isArray(config.players)) {
          setPlayers(config.players);
        }
        
        if (config.difficulty) {
          setDifficulty(config.difficulty);
        }
        
        if (typeof config.includeUndercover === 'boolean') {
          setIncludeUndercover(config.includeUndercover);
        }
        
        if (typeof config.maxMisterWhites === 'number') {
          setMaxMisterWhites(config.maxMisterWhites);
        }
        
        // Indicar que estamos en modo edición
        if (config.isEditing) {
          setIsEditingMode(true);
        }
        
      } catch (error) {
        console.error('Error parsing config from URL:', error);
      }
    }
  }, [searchParams]);

  // Cargar categorías disponibles desde la base de datos
  useEffect(() => {
    const loadCategories = async () => {
      if (useDatabase) {
        try {
          const fetchedCategories = await getCategories();
          setCategories(fetchedCategories);
        } catch (error) {
          console.error('Error loading categories:', error);
          setUseDatabase(false); // Fallback a palabras estáticas
        }
      }
    };

    loadCategories();
  }, [useDatabase, getCategories]);

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

  // Drag & Drop functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;
    
    const newPlayers = [...players];
    const draggedPlayer = newPlayers[dragIndex];
    
    // Remove the dragged item
    newPlayers.splice(dragIndex, 1);
    // Insert at new position
    newPlayers.splice(dropIndex, 0, draggedPlayer);
    
    setPlayers(newPlayers);
  };

  const validateForm = useCallback((): boolean => {
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
    const payasoRoles = validPlayers.length >= 8 ? 1 : 0;
    const undercoverRoles = includeUndercover ? 1 : 0;
    const totalSpecialRoles = maxMisterWhites + undercoverRoles + payasoRoles;
    
    if (totalSpecialRoles >= validPlayers.length) {
      newErrors.push('Demasiados roles especiales para el número de jugadores. Se necesita al menos 1 civil.');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  }, [players, includeUndercover, maxMisterWhites]);

  const handleStartGame = () => {
    if (!validateForm()) return;
    
    const validPlayers = players.filter(p => p.trim() !== '');
    const config = {
      players: validPlayers,
      difficulty,
      includeUndercover,
      maxMisterWhites,
      useDatabase,
      category: category !== 'all' ? category : undefined,
    };
    
    const params = new URLSearchParams({
      config: JSON.stringify(config),
    });
    
    router.push(`/local-game?${params.toString()}`);
  };

  const validPlayerCount = players.filter(p => p.trim() !== '').length;
  const includePayaso = validPlayerCount >= 8;
  
  // Cálculo más flexible del máximo de Mr. White
  // Permitir hasta aproximadamente 60% de los jugadores como Mr. White, pero al menos 1 civil
  const calculateMaxMisterWhites = (playerCount: number) => {
    if (playerCount < MIN_PLAYERS) return 1;
    
    // Contar roles especiales obligatorios
    const payasoRoles = playerCount >= 8 ? 1 : 0;
    const undercoverRoles = includeUndercover ? 1 : 0;
    
    // Asegurar al menos 1 civil
    const maxSpecialRoles = Math.max(1, playerCount - 1 - undercoverRoles - payasoRoles);
    
    // Para 5 jugadores: máximo 3 Mr. White (60%)
    // Para 8 jugadores: máximo 4-5 Mr. White
    return Math.min(maxSpecialRoles, Math.floor(playerCount * 0.6));
  };
  
  const maxPossibleMisterWhites = calculateMaxMisterWhites(validPlayerCount);

  // Ajustar automáticamente el número de Mr. White si excede el máximo permitido
  useEffect(() => {
    if (maxMisterWhites > maxPossibleMisterWhites) {
      setMaxMisterWhites(Math.max(1, maxPossibleMisterWhites));
    }
  }, [maxPossibleMisterWhites, maxMisterWhites]);

  // Validación automática cuando cambian los datos del formulario
  useEffect(() => {
    validateForm();
  }, [players, difficulty, includeUndercover, maxMisterWhites, validateForm]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {isEditingMode ? 'Editar Configuración' : 'Configurar Juego Local'}
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
              <Select value={difficulty} onValueChange={(value: string) => setDifficulty(value as 'easy' | 'medium' | 'hard')}>
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

            {/* Fuente de palabras */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-database">Usar palabras de la base de datos</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Usar palabras almacenadas en línea (requiere conexión)
                </p>
              </div>
              <Switch
                id="use-database"
                checked={useDatabase}
                onCheckedChange={setUseDatabase}
              />
            </div>

            {/* Selección de categoría */}
            {useDatabase && categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoría de palabras</Label>
                <Select value={category} onValueChange={(value: string) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              Añade los nombres de los jugadores. Arrastra el ícono ⋮⋮ para reordenar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, index) => (
              <div 
                key={index} 
                className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded border hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="flex-shrink-0" title="Arrastra para reordenar">
                  <GripVertical 
                    className="h-4 w-4 text-slate-400 cursor-grab active:cursor-grabbing" 
                  />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[20px] flex-shrink-0">
                  {index + 1}.
                </span>
                <Input
                  placeholder={`Jugador ${index + 1}`}
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                  maxLength={20}
                  className="flex-1"
                />
                {players.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removePlayer(index)}
                    className="flex-shrink-0"
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
        <div className="space-y-3">
          {isEditingMode && (
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              size="lg" 
              className="w-full"
            >
              Cancelar y Volver al Juego
            </Button>
          )}
          <Button 
            onClick={handleStartGame} 
            size="lg" 
            className="w-full"
            disabled={validPlayerCount < MIN_PLAYERS || errors.length > 0}
          >
            {isEditingMode ? 'Aplicar Cambios y Comenzar' : 'Comenzar Juego Local'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LocalGameSetupPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LocalGameSetupContent />
    </Suspense>
  );
}

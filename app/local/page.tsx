'use client';

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { ArrowLeft, Users, Settings, Info, GripVertical, ClipboardList, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { HelpTip } from "../components/ui/help-tip";
import { Alert, AlertDescription } from "../components/ui/alert";
import { MAX_PLAYERS, MIN_PLAYERS } from "../lib/types";
import { useWords } from "../hooks/useWords";
import { useNavigationGuard } from "../contexts/NavigationGuardContext";

// Jugador con id estable para que el reordenado (Motion Reorder) no confunda filas.
type PlayerRowData = { id: string; name: string };
// Contador determinista (mismo orden en SSR y cliente -> sin desajuste de hidratación).
let nextPlayerId = 0;
const makePlayer = (name = ''): PlayerRowData => ({ id: `p${nextPlayerId++}`, name });

function LocalGameSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCategories } = useWords();
  const { setGuard, requestNavigation } = useNavigationGuard();
  
  const [players, setPlayers] = useState<PlayerRowData[]>(() => [makePlayer(), makePlayer(), makePlayer()]); // 3 espacios iniciales
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
          setPlayers(config.players.map((name: string) => makePlayer(name)));
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

  // En modo edición hay una partida en curso: proteger la salida con el aviso
  useEffect(() => {
    setGuard(isEditingMode);
    return () => setGuard(false);
  }, [isEditingMode, setGuard]);

  // Cargar categorías disponibles desde la base de datos
  useEffect(() => {
    const loadCategories = async () => {
      if (useDatabase) {
        try {
          const fetchedCategories = await getCategories(difficulty);
          setCategories(fetchedCategories);
          
          // Si la categoría actual no está disponible en la nueva dificultad, resetear a 'all'
          if (category !== 'all' && !fetchedCategories.includes(category)) {
            setCategory('all');
          }
        } catch (error) {
          console.error('Error loading categories:', error);
          setUseDatabase(false); // Fallback a palabras estáticas
        }
      }
    };

    loadCategories();
  }, [useDatabase, difficulty, getCategories, category]); // Agregamos 'difficulty' y 'category' como dependencias

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) {
      setPlayers([...players, makePlayer()]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: string[] = [];
    
    // Filter out empty player names
    const validPlayers = players.map(p => p.name).filter(n => n.trim() !== '');

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
    
    // Check name length bounds (el input ya limita a 20, pero la edición vía URL no)
    if (validPlayers.some(p => p.trim().length < 2)) {
      newErrors.push('Los nombres deben tener al menos 2 caracteres.');
    }
    if (validPlayers.some(p => p.trim().length > 20)) {
      newErrors.push('Los nombres no pueden superar los 20 caracteres.');
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
    
    const validPlayers = players.map(p => p.name).filter(n => n.trim() !== '');
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

  // Función para obtener el texto de visualización de la categoría
  const getCategoryDisplayText = (categoryValue: string) => {
    return categoryValue === 'all' ? 'Todas las categorías' : categoryValue;
  };

  const validPlayerCount = players.filter(p => p.name.trim() !== '').length;
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
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => requestNavigation(() => router.push('/'))} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-fg">
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
            </div>

            {/* Include Undercover */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="undercover">Incluir rol Undercover</Label>
                <HelpTip text="Un jugador tendrá una palabra similar pero diferente." />
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="use-database">Base de datos</Label>
                <HelpTip text="Usa palabras almacenadas en línea (requiere conexión)." />
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
                  <SelectTrigger className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">
                        {getCategoryDisplayText(category)}
                      </span>
                    </div>
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
          <CardContent>
            <Reorder.Group axis="y" values={players} onReorder={setPlayers} className="space-y-3">
              {players.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  canRemove={players.length > 1}
                  onChange={updatePlayer}
                  onRemove={removePlayer}
                />
              ))}
            </Reorder.Group>
            {players.length < MAX_PLAYERS && (
              <Button variant="outline" onClick={addPlayer} className="mt-4">
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
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent" />
                Resumen del Juego
              </CardTitle>
              <CardDescription>
                Así quedará repartida la partida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conteo de roles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-panel p-4 text-center">
                  <p className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
                    {validPlayerCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-faint">Jugadores</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 text-center">
                  <p className="text-3xl font-semibold tracking-tight text-emerald-300 tabular-nums">
                    {validPlayerCount - maxMisterWhites - (includeUndercover ? 1 : 0) - (includePayaso ? 1 : 0)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-200/70">Civiles</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-center">
                  <p className="text-3xl font-semibold tracking-tight text-red-300 tabular-nums">
                    {maxMisterWhites}
                  </p>
                  <p className="mt-1 text-xs font-medium text-red-200/70">Mr. White</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted">Dificultad</span>
                  <span className="text-sm font-medium text-fg">
                    {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted">Undercover</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${includeUndercover ? 'bg-accent/15 text-accent' : 'bg-white/5 text-faint'}`}>
                    {includeUndercover ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted">Payaso</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${includePayaso ? 'bg-accent/15 text-accent' : 'bg-white/5 text-faint'}`}>
                    {includePayaso ? 'Sí · 8+ jugadores' : 'No'}
                  </span>
                </div>
              </div>
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

// Fila reordenable. El arrastre solo arranca desde el grip (dragListener=false
// + controls.start) para que el Input siga siendo pulsable/escribible.
function PlayerRow({
  player,
  canRemove,
  onChange,
  onRemove,
}: {
  player: PlayerRowData;
  canRemove: boolean;
  onChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={player}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03 }}
      className="flex gap-2 items-center rounded-xl bg-panel/40"
    >
      <div
        className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1"
        onPointerDown={(e) => controls.start(e)}
        title="Arrastra para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted" />
      </div>
      <Input
        placeholder="Nombre del jugador"
        value={player.name}
        onChange={(e) => onChange(player.id, e.target.value)}
        maxLength={20}
        className="flex-1"
      />
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(player.id)}
          className="flex-shrink-0 text-faint hover:text-rose-300 hover:bg-rose-500/10"
          aria-label="Eliminar jugador"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </Reorder.Item>
  );
}

export default function LocalGameSetupPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LocalGameSetupContent />
    </Suspense>
  );
}

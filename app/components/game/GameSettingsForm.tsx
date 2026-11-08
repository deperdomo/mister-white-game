'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { HelpTip } from '../ui/help-tip';
import { Alert, AlertDescription } from '../ui/alert';
import { useWords } from '../../hooks/useWords';
import { GameSettings, Difficulty, hasPayaso, maxMisterWhites } from '../../lib/game-logic';

interface GameSettingsFormProps {
  value: GameSettings;
  onChange: (value: GameSettings) => void;
  playerCount: number;
}

// Ajustes de partida: los mismos en local y en online (host).
export default function GameSettingsForm({ value, onChange, playerCount }: GameSettingsFormProps) {
  const { getCategories } = useWords();
  const [categories, setCategories] = useState<string[]>([]);
  const maxMw = maxMisterWhites(playerCount, value.includeUndercover);
  const set = (patch: Partial<GameSettings>) => onChange({ ...value, ...patch });

  useEffect(() => {
    getCategories(value.difficulty).then(setCategories).catch(() => setCategories([]));
  }, [value.difficulty, getCategories]);

  // Mantener los ajustes válidos cuando cambian jugadores o dificultad
  useEffect(() => {
    if (value.misterWhites > maxMw) onChange({ ...value, misterWhites: maxMw });
    else if (value.category !== 'all' && categories.length && !categories.includes(value.category)) {
      onChange({ ...value, category: 'all' });
    }
  }, [maxMw, categories, value, onChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="difficulty">Dificultad</Label>
        <Select value={value.difficulty} onValueChange={(v: string) => set({ difficulty: v as Difficulty })}>
          <SelectTrigger id="difficulty">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Fácil</SelectItem>
            <SelectItem value="medium">Medio</SelectItem>
            <SelectItem value="hard">Difícil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-11 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="undercover">Incluir rol Undercover</Label>
          <HelpTip text="Un jugador tendrá una palabra similar pero diferente." />
        </div>
        <Switch id="undercover" checked={value.includeUndercover} onCheckedChange={(v: boolean) => set({ includeUndercover: v })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mrwhite-count">Número de Mr. White</Label>
        <Select value={String(Math.min(value.misterWhites, maxMw))} onValueChange={(v: string) => set({ misterWhites: Number(v) })}>
          <SelectTrigger id="mrwhite-count">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: maxMw }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category">Categoría de palabras</Label>
          <Select value={value.category} onValueChange={(v: string) => set({ category: v })}>
            <SelectTrigger id="category" className="w-full">
              <span className="truncate">{value.category === 'all' ? 'Todas las categorías' : value.category}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasPayaso(playerCount) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Con {playerCount} jugadores se incluye automáticamente el rol <strong>Payaso</strong>: conoce la palabra,
            pero intenta que sospechen de él como si fuera Mr. White.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

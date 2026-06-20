'use client';

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/useToast";

interface DescriptionInputProps {
  playerName: string;
  onSubmit: (description: string) => void;
}

export default function DescriptionInput({ playerName, onSubmit }: DescriptionInputProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedDescription = description.trim();
    
    if (trimmedDescription.length < 3) {
      error('La descripción debe tener al menos 3 caracteres');
      return;
    }
    
    if (trimmedDescription.length > 200) {
      error('La descripción no puede exceder 200 caracteres');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      onSubmit(trimmedDescription);
      setDescription('');
    } catch {
      error('Error al enviar descripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">
          {playerName}, describe tu palabra (sin mencionarla directamente):
        </Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Es algo que comes cuando tienes hambre..."
          maxLength={200}
          disabled={isSubmitting}
          className="mt-1"
        />
        <p className="text-xs text-faint mt-1">
          {description.length}/200 caracteres
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || description.trim().length < 3}
        className="w-full"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar descripción'}
      </Button>

      <div className="text-xs space-y-1 text-muted">
        <p className="inline-flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> <strong>Consejos:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Sé específico pero no obvio</li>
          <li>Evita mencionar la palabra directamente</li>
          <li>Piensa en características únicas</li>
          <li>Observa las descripciones de otros jugadores</li>
        </ul>
      </div>
    </form>
  );
}

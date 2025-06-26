import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

// Función para combinar clases de Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generar código de sala único de 6 caracteres
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generar UUID único
export function generateUUID(): string {
  return uuidv4();
}

// Validar código de sala
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

// Formatear nombre de jugador
export function formatPlayerName(name: string): string {
  return name.trim().slice(0, 20); // Máximo 20 caracteres
}

// Validar nombre de jugador
export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}

// Mezclar array (Fisher-Yates shuffle)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Debounce para optimizar performance
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Formatear tiempo transcurrido
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }
}

// Copiar texto al portapapeles
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

// Obtener contraste de color para accesibilidad
export function getContrastColor(backgroundColor: string): 'black' | 'white' {
  // Implementación básica, se puede mejorar
  return backgroundColor.includes('dark') || backgroundColor.includes('black') ? 'white' : 'black';
}

// Error handling helper
export const handleAsyncError = async (operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error) {
    console.error('Error:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
};

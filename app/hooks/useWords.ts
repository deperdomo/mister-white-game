import { useState, useCallback } from 'react';

interface GameWord {
  id: string;
  category: string;
  civilWord: string;
  undercoverWord: string;
  difficulty: string;
}

interface UseWordsState {
  isLoading: boolean;
  error: string | null;
  getRandomWord: (difficulty: string, category?: string) => Promise<GameWord | null>;
  getCategories: (difficulty?: string) => Promise<string[]>;
}

export function useWords(): UseWordsState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRandomWord = useCallback(async (difficulty: string, category?: string): Promise<GameWord | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ difficulty });
      if (category && category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`/api/words?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch word');
      }

      return data.word;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch word';
      setError(errorMessage);
      console.error('Error fetching word:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (difficulty?: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const body: { difficulty?: string } = {};
      if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
        body.difficulty = difficulty;
      }

      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      return data.categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getRandomWord,
    getCategories,
  };
}

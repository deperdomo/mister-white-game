import { NextRequest, NextResponse } from 'next/server';

// Función para verificar si Supabase está configurado
function isSupabaseConfigured() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Importar supabase solo si está configurado
async function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const { supabase } = await import('../../lib/supabase');
  return supabase;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar si Supabase está configurado
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty') || 'medium';
    const category = searchParams.get('category');
    const countParam = searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : 1;

    // Validar dificultad
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Validar count
    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('game_words')
      .select('*')
      .eq('difficulty', difficulty);

    // Filtrar por categoría si se especifica
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: words, error } = await query;

    if (error) {
      console.error('Error fetching words:', error);
      return NextResponse.json(
        { error: 'Failed to fetch words' },
        { status: 500 }
      );
    }

    if (!words || words.length === 0) {
      return NextResponse.json(
        { error: 'No words found for the specified criteria' },
        { status: 404 }
      );
    }

    if (count === 1) {
      // Seleccionar una palabra aleatoria (mantener compatibilidad)
      const randomWord = words[Math.floor(Math.random() * words.length)];

      return NextResponse.json({
        success: true,
        word: {
          id: randomWord.id,
          category: randomWord.category,
          civilWord: randomWord.word,
          undercoverWord: randomWord.undercover_word,
          difficulty: randomWord.difficulty
        }
      });
    } else {
      // Seleccionar múltiples palabras aleatorias sin repetición
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const selectedWords = shuffledWords.slice(0, Math.min(count, words.length));

      return NextResponse.json({
        success: true,
        words: selectedWords.map(word => ({
          id: word.id,
          category: word.category,
          civilWord: word.word,
          undercoverWord: word.undercover_word,
          difficulty: word.difficulty
        }))
      });
    }

  } catch (error) {
    console.error('Unexpected error fetching words:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET categories (optionally filtered by difficulty)
export async function POST(request: NextRequest) {
  try {
    // Verificar si Supabase está configurado
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const supabase = await getSupabaseClient();
    
    // Obtener la dificultad del cuerpo de la petición
    let difficulty: string | null = null;
    try {
      const body = await request.json();
      difficulty = body.difficulty;
    } catch {
      // Si no hay body o no es JSON válido, obtener todas las categorías
    }

    let query = supabase
      .from('game_words')
      .select('category')
      .order('category');

    // Filtrar por dificultad si se especifica
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Obtener categorías únicas
    const uniqueCategories = [...new Set(categories?.map((c: { category: string }) => c.category) || [])];

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
      difficulty: difficulty || 'all'
    });

  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

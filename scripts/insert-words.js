#!/usr/bin/env node

/**
 * Script para insertar palabras en la base de datos de Supabase
 * 
 * Uso:
 * node scripts/insert-words.js
 * 
 * O puedes modificar el array WORDS_TO_INSERT directamente en este archivo
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar ruta para variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('Asegúrate de que .env.local contiene:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=tu_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===============================================
// ARRAY DE PALABRAS PARA INSERTAR
// ===============================================
// Modifica este array con las palabras que quieras insertar
// NOTA: Estas son palabras nuevas que NO están en el esquema inicial
const WORDS_TO_INSERT = [
  {category: "Comida", word: "Manzana", undercover_word: "Pera", difficulty: "easy"},
  {category: "Comida", word: "Pan", undercover_word: "Torta", difficulty: "easy"},
  {category: "Comida", word: "Leche", undercover_word: "Jugo", difficulty: "easy"},
  {category: "Comida", word: "Pollo", undercover_word: "Pescado", difficulty: "easy"},
  {category: "Comida", word: "Arroz", undercover_word: "Pasta", difficulty: "easy"},
  {category: "Comida", word: "Sopa", undercover_word: "Caldo", difficulty: "easy"},
  {category: "Comida", word: "Huevo", undercover_word: "Queso", difficulty: "easy"},
  {category: "Comida", word: "Fresa", undercover_word: "Frambuesa", difficulty: "easy"},
  {category: "Comida", word: "Galleta", undercover_word: "Pastel", difficulty: "easy"},
  {category: "Comida", word: "Carne", undercover_word: "Salchicha", difficulty: "easy"},
  {category: "Animales", word: "Perro", undercover_word: "Gato", difficulty: "easy"},
  {category: "Animales", word: "Pájaro", undercover_word: "Gallina", difficulty: "easy"},
  {category: "Animales", word: "Pez", undercover_word: "Tiburón", difficulty: "easy"},
  {category: "Animales", word: "Vaca", undercover_word: "Cabra", difficulty: "easy"},
  {category: "Animales", word: "Caballo", undercover_word: "Burro", difficulty: "easy"},
  {category: "Animales", word: "Conejo", undercover_word: "Liebre", difficulty: "easy"},
  {category: "Animales", word: "Rana", undercover_word: "Sapo", difficulty: "easy"},
  {category: "Animales", word: "Oso", undercover_word: "Lobo", difficulty: "easy"},
  {category: "Animales", word: "Mono", undercover_word: "Chimpancé", difficulty: "easy"},
  {category: "Animales", word: "Tigre", undercover_word: "León", difficulty: "easy"},
  {category: "Transporte", word: "Carro", undercover_word: "Camión", difficulty: "easy"},
  {category: "Transporte", word: "Bicicleta", undercover_word: "Triciclo", difficulty: "easy"},
  {category: "Transporte", word: "Avión", undercover_word: "Helicóptero", difficulty: "easy"},
  {category: "Transporte", word: "Barco", undercover_word: "Yate", difficulty: "easy"},
  {category: "Transporte", word: "Tren", undercover_word: "Metro", difficulty: "easy"},
  {category: "Transporte", word: "Autobús", undercover_word: "Camioneta", difficulty: "easy"},
  {category: "Transporte", word: "Moto", undercover_word: "Scooter", difficulty: "easy"},
  {category: "Colores", word: "Rojo", undercover_word: "Rosa", difficulty: "easy"},
  {category: "Colores", word: "Azul", undercover_word: "Celeste", difficulty: "easy"},
  {category: "Colores", word: "Verde", undercover_word: "Lima", difficulty: "easy"},
  {category: "Colores", word: "Amarillo", undercover_word: "Naranja", difficulty: "easy"},
  {category: "Colores", word: "Blanco", undercover_word: "Gris", difficulty: "easy"},
  {category: "Colores", word: "Negro", undercover_word: "Marrón", difficulty: "easy"},
  {category: "Frutas", word: "Banana", undercover_word: "Plátano", difficulty: "easy"},
  {category: "Frutas", word: "Naranja", undercover_word: "Mandarina", difficulty: "easy"},
  {category: "Frutas", word: "Uva", undercover_word: "Ciruela", difficulty: "easy"},
  {category: "Frutas", word: "Melón", undercover_word: "Sandía", difficulty: "easy"},
  {category: "Frutas", word: "Mango", undercover_word: "Papaya", difficulty: "easy"},
  {category: "Instrumentos", word: "Tambor", undercover_word: "Bongó", difficulty: "easy"},
  {category: "Instrumentos", word: "Flauta", undercover_word: "Clarinete", difficulty: "easy"},
  {category: "Instrumentos", word: "Piano", undercover_word: "Teclado", difficulty: "easy"},
  {category: "Instrumentos", word: "Guitarra", undercover_word: "Bajo", difficulty: "easy"},
  {category: "Instrumentos", word: "Trompeta", undercover_word: "Trombón", difficulty: "easy"},
  {category: "Tecnología", word: "Teléfono", undercover_word: "Celular", difficulty: "easy"},
  {category: "Tecnología", word: "Televisión", undercover_word: "Pantalla", difficulty: "easy"},
  {category: "Tecnología", word: "Computadora", undercover_word: "Laptop", difficulty: "easy"},
  {category: "Tecnología", word: "Cámara", undercover_word: "Video", difficulty: "easy"},
  {category: "Tecnología", word: "Reloj", undercover_word: "Cronómetro", difficulty: "easy"},
  {category: "Lugares", word: "Casa", undercover_word: "Apartamento", difficulty: "easy"},
  {category: "Lugares", word: "Escuela", undercover_word: "Colegio", difficulty: "easy"},
  {category: "Lugares", word: "Parque", undercover_word: "Jardín", difficulty: "easy"},
  {category: "Lugares", word: "Playa", undercover_word: "Mar", difficulty: "easy"},
  {category: "Lugares", word: "Calle", undercover_word: "Avenida", difficulty: "easy"},
  {category: "Lugares", word: "Bosque", undercover_word: "Selva", difficulty: "easy"},
  {category: "Lugares", word: "Río", undercover_word: "Lago", difficulty: "easy"},
  {category: "Lugares", word: "Montaña", undercover_word: "Colina", difficulty: "easy"},
  {category: "Ropa", word: "Camisa", undercover_word: "Camiseta", difficulty: "easy"},
  {category: "Ropa", word: "Pantalón", undercover_word: "Jeans", difficulty: "easy"},
  {category: "Ropa", word: "Zapatos", undercover_word: "Tenis", difficulty: "easy"},
  {category: "Ropa", word: "Sombrero", undercover_word: "Gorra", difficulty: "easy"},
  {category: "Ropa", word: "Chaqueta", undercover_word: "Abrigo", difficulty: "easy"},
  {category: "Ropa", word: "Calcetines", undercover_word: "Medias", difficulty: "easy"},
  {category: "Ropa", word: "Bufanda", undercover_word: "Chal", difficulty: "easy"},
  {category: "Objetos", word: "Mesa", undercover_word: "Silla", difficulty: "easy"},
  {category: "Objetos", word: "Cama", undercover_word: "Sofá", difficulty: "easy"},
  {category: "Objetos", word: "Lápiz", undercover_word: "Pluma", difficulty: "easy"},
  {category: "Objetos", word: "Libro", undercover_word: "Cuaderno", difficulty: "easy"},
  {category: "Objetos", word: "Pelota", undercover_word: "Balón", difficulty: "easy"},
  {category: "Objetos", word: "Cuchara", undercover_word: "Tenedor", difficulty: "easy"},
  {category: "Objetos", word: "Vaso", undercover_word: "Taza", difficulty: "easy"},
  {category: "Objetos", word: "Espejo", undercover_word: "Ventana", difficulty: "easy"},
  {category: "Objetos", word: "Puerta", undercover_word: "Portón", difficulty: "easy"},
  {category: "Objetos", word: "Reloj", undercover_word: "Alarma", difficulty: "easy"},
  {category: "Actividades", word: "Correr", undercover_word: "Caminar", difficulty: "easy"},
  {category: "Actividades", word: "Nadar", undercover_word: "Bucear", difficulty: "easy"},
  {category: "Actividades", word: "Cantar", undercover_word: "Bailar", difficulty: "easy"},
  {category: "Actividades", word: "Jugar", undercover_word: "Cazar", difficulty: "easy"},
  {category: "Actividades", word: "Escribir", undercover_word: "Dibujar", difficulty: "easy"},
  {category: "Actividades", word: "Leer", undercover_word: "Estudiar", difficulty: "easy"},
  {category: "Actividades", word: "Comer", undercover_word: "Cocinar", difficulty: "easy"},
  {category: "Actividades", word: "Dormir", undercover_word: "Descansar", difficulty: "easy"},
  {category: "Actividades", word: "Saltar", undercover_word: "Brincar", difficulty: "easy"},
  {category: "Actividades", word: "Pintar", undercover_word: "Colorear", difficulty: "easy"},
  {category: "Naturaleza", word: "Sol", undercover_word: "Luna", difficulty: "easy"},
  {category: "Naturaleza", word: "Árbol", undercover_word: "Arbusto", difficulty: "easy"},
  {category: "Naturaleza", word: "Flor", undercover_word: "Planta", difficulty: "easy"},
  {category: "Naturaleza", word: "Cielo", undercover_word: "Nube", difficulty: "easy"},
  {category: "Naturaleza", word: "Roca", undercover_word: "Piedra", difficulty: "easy"},
  {category: "Naturaleza", word: "Lluvia", undercover_word: "Nieve", difficulty: "easy"},
  {category: "Naturaleza", word: "Viento", undercover_word: "Tormenta", difficulty: "easy"},
  {category: "Naturaleza", word: "Mar", undercover_word: "Océano", difficulty: "easy"},
  {category: "Cuerpo", word: "Mano", undercover_word: "Brazo", difficulty: "easy"},
  {category: "Cuerpo", word: "Pie", undercover_word: "Pierna", difficulty: "easy"},
  {category: "Cuerpo", word: "Ojo", undercover_word: "Oreja", difficulty: "easy"},
  {category: "Cuerpo", word: "Nariz", undercover_word: "Boca", difficulty: "easy"},
  {category: "Cuerpo", word: "Cabeza", undercover_word: "Cuello", difficulty: "easy"},
  {category: "Cuerpo", word: "Corazón", undercover_word: "Pulmón", difficulty: "easy"},
  {category: "Cuerpo", word: "Mano", undercover_word: "Dedo", difficulty: "easy"}
]
  
// ===============================================
// FUNCIONES DEL SCRIPT
// ===============================================

/**
 * Valida que una palabra tenga todos los campos necesarios
 */
function validateWord(word, index) {
  const required = ['category', 'word', 'undercover_word', 'difficulty'];
  const missing = required.filter(field => !word[field]);
  
  if (missing.length > 0) {
    console.error(`❌ Error en palabra ${index + 1}: faltan campos ${missing.join(', ')}`);
    return false;
  }
  
  if (!['easy', 'medium', 'hard'].includes(word.difficulty)) {
    console.error(`❌ Error en palabra ${index + 1}: dificultad debe ser 'easy', 'medium' o 'hard'`);
    return false;
  }
  
  return true;
}

/**
 * Verifica si una palabra ya existe en la base de datos
 */
async function wordExists(word, undercover_word) {
  try {
    const { data, error } = await supabase
      .from('game_words')
      .select('id')
      .or(`and(word.eq.${word},undercover_word.eq.${undercover_word}),and(word.eq.${undercover_word},undercover_word.eq.${word})`)
      .limit(1);
    
    if (error) {
      console.warn(`⚠️ Error verificando existencia de "${word}": ${error.message}`);
      return false; // En caso de error, intentar insertar
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.warn(`⚠️ Error verificando existencia de "${word}": ${error.message}`);
    return false;
  }
}

/**
 * Inserta un array de palabras en la base de datos
 */
async function insertWords(words) {
  console.log(`🚀 Iniciando inserción de ${words.length} palabras...`);
  
  // Validar todas las palabras primero
  const validWords = [];
  for (let i = 0; i < words.length; i++) {
    if (validateWord(words[i], i)) {
      validWords.push(words[i]);
    }
  }
  
  if (validWords.length === 0) {
    console.error('❌ No hay palabras válidas para insertar');
    return;
  }
  
  console.log(`✅ ${validWords.length} palabras válidas encontradas`);
  console.log('🔍 Verificando palabras existentes...');
  
  // Filtrar palabras que no existen
  const newWords = [];
  const duplicateWords = [];
  
  for (let i = 0; i < validWords.length; i++) {
    const word = validWords[i];
    const exists = await wordExists(word.word, word.undercover_word);
    
    if (exists) {
      duplicateWords.push(word);
      console.log(`⚠️ Saltando "${word.word}" vs "${word.undercover_word}" (ya existe)`);
    } else {
      newWords.push(word);
    }
  }
  
  console.log(`\n📊 ANÁLISIS PRELIMINAR:`);
  console.log(`✅ Palabras nuevas para insertar: ${newWords.length}`);
  console.log(`⚠️ Palabras que ya existen: ${duplicateWords.length}`);
  
  if (newWords.length === 0) {
    console.log('ℹ️ No hay palabras nuevas para insertar. Todas ya existen en la base de datos.');
    return;
  }
  
  try {
    let insertedCount = 0;
    let errorCount = 0;
    const detailedErrors = [];
    
    // Insertar una por una para mejor control de errores
    for (let i = 0; i < newWords.length; i++) {
      const word = newWords[i];
      console.log(`📦 Insertando ${i + 1}/${newWords.length}: "${word.word}" vs "${word.undercover_word}"`);
      
      const { data, error } = await supabase
        .from('game_words')
        .insert([word])
        .select();
      
      if (error) {
        errorCount++;
        const errorInfo = {
          word: word.word,
          undercover_word: word.undercover_word,
          error: error.message
        };
        detailedErrors.push(errorInfo);
        console.log(`❌ Error: ${error.message}`);
      } else {
        insertedCount++;
        console.log(`✅ Insertada correctamente`);
      }
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Palabras insertadas exitosamente: ${insertedCount}`);
    console.log(`⚠️ Palabras duplicadas saltadas: ${duplicateWords.length}`);
    console.log(`❌ Palabras con errores: ${errorCount}`);
    console.log(`📝 Total procesadas: ${validWords.length}`);
    
    // Mostrar errores detallados si los hay
    if (detailedErrors.length > 0) {
      console.log('\n🔍 ERRORES DETALLADOS:');
      detailedErrors.forEach((err, index) => {
        console.log(`${index + 1}. "${err.word}" vs "${err.undercover_word}"`);
        console.log(`   Error: ${err.error}`);
      });
    }
    
    // Mostrar algunas palabras duplicadas si las hay
    if (duplicateWords.length > 0) {
      console.log('\n🔍 ALGUNAS PALABRAS QUE YA EXISTÍAN:');
      duplicateWords.slice(0, 5).forEach((word, index) => {
        console.log(`${index + 1}. "${word.word}" vs "${word.undercover_word}" (${word.category})`);
      });
      if (duplicateWords.length > 5) {
        console.log(`   ... y ${duplicateWords.length - 5} más`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

/**
 * Muestra estadísticas actuales de la base de datos
 */
async function showStats() {
  try {
    const { data, error } = await supabase
      .from('game_words')
      .select('category, difficulty')
      .order('category');
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return;
    }
    
    console.log('\n📈 ESTADÍSTICAS ACTUALES DE LA BASE DE DATOS:');
    
    // Agrupar por categoría
    const byCategory = {};
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    
    data.forEach(word => {
      if (!byCategory[word.category]) {
        byCategory[word.category] = 0;
      }
      byCategory[word.category]++;
      byDifficulty[word.difficulty]++;
    });
    
    console.log('\nPor categoría:');
    Object.entries(byCategory)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        console.log(`  📁 ${category}: ${count} palabras`);
      });
    
    console.log('\nPor dificultad:');
    console.log(`  🟢 Fácil: ${byDifficulty.easy} palabras`);
    console.log(`  🟡 Medio: ${byDifficulty.medium} palabras`);
    console.log(`  🔴 Difícil: ${byDifficulty.hard} palabras`);
    
    console.log(`\n📊 Total de palabras en la base de datos: ${data.length}`);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🎯 SCRIPT DE INSERCIÓN DE PALABRAS - MISTER WHITE GAME');
  console.log('================================================\n');
  
  // Mostrar estadísticas actuales
  await showStats();
  
  // Preguntar al usuario si quiere continuar
  const args = process.argv.slice(2);
  if (!args.includes('--force')) {
    console.log('\n⚠️  ¿Deseas continuar con la inserción?');
    console.log('Ejecuta el script con --force para saltar esta confirmación:');
    console.log('node scripts/insert-words.js --force');
    console.log('\nPresiona Ctrl+C para cancelar o Enter para continuar...');
    
    // Esperar entrada del usuario
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
  }
  
  // Insertar palabras
  await insertWords(WORDS_TO_INSERT);
  
  // Mostrar estadísticas finales
  console.log('\n' + '='.repeat(50));
  await showStats();
  
  console.log('\n🎉 ¡Script completado!');
  process.exit(0);
}

// Ejecutar si es el archivo principal
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

// Exportar funciones para uso como módulo
export { insertWords, showStats, validateWord, wordExists };

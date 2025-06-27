# 🎮 Scripts para Mister White Game

Este directorio contiene scripts de utilidad para gestionar la base de datos de palabras del juego.

## 📂 Archivos

- **`insert-words.js`** - Script de Node.js para insertar palabras programáticamente
- **`insert-words.sql`** - Script SQL para inserción masiva directa
- **`package.json`** - Configuración y dependencias del script
- **`README.md`** - Este archivo de documentación

## 🚀 Uso Rápido

### Opción 1: Script de Node.js (Recomendado)

```bash
# 1. Instalar dependencias (solo la primera vez)
cd scripts
npm install

# 2. Modificar el array WORDS_TO_INSERT en insert-words.js

# 3. Ejecutar el script
npm run insert-words
# o para saltar la confirmación:
npm run insert-words-force

# 4. Ver solo estadísticas
npm run show-stats
```

### Opción 2: Script SQL Directo

```bash
# 1. Abrir Supabase Dashboard > SQL Editor
# 2. Copiar y pegar el contenido de insert-words.sql
# 3. Modificar las palabras en el script
# 4. Ejecutar
```

## 📝 Formato de Palabras

Cada palabra debe tener esta estructura:

```javascript
{
  category: 'Nombre de la categoría',
  word: 'Palabra para civiles',
  undercover_word: 'Palabra para undercover',
  difficulty: 'easy|medium|hard'
}
```

### Ejemplo:

```javascript
{
  category: 'Animales',
  word: 'Perro',
  undercover_word: 'Gato',
  difficulty: 'easy'
}
```

## 📊 Características del Script de Node.js

### ✅ Ventajas:
- **Validación automática** de formato de palabras
- **Inserción por lotes** para mejor rendimiento
- **Estadísticas** antes y después de la inserción
- **Manejo de errores** robusto
- **Duplicados automáticamente evitados**
- **Confirmación** antes de insertar

### 📈 Información que muestra:
- Total de palabras por categoría
- Total de palabras por dificultad
- Progreso de inserción en tiempo real
- Resumen de éxitos y errores

## 🎯 Ejemplos de Uso

### Ejemplo 1: Agregar palabras de una categoría nueva

```javascript
const WORDS_TO_INSERT = [
  {
    category: 'Videojuegos',
    word: 'PlayStation',
    undercover_word: 'Xbox',
    difficulty: 'easy'
  },
  {
    category: 'Videojuegos',
    word: 'Minecraft',
    undercover_word: 'Roblox',
    difficulty: 'medium'
  }
];
```

### Ejemplo 2: Agregar palabras difíciles

```javascript
const WORDS_TO_INSERT = [
  {
    category: 'Filosofía',
    word: 'Existencialismo',
    undercover_word: 'Nihilismo',
    difficulty: 'hard'
  },
  {
    category: 'Ciencia',
    word: 'Mecánica Cuántica',
    undercover_word: 'Relatividad',
    difficulty: 'hard'
  }
];
```

## 🔧 Configuración

### Variables de Entorno Requeridas

El script lee automáticamente desde `../.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Instalación de Dependencias

```bash
cd scripts
npm install
```

## 📋 Comandos Disponibles

```bash
# Insertar palabras con confirmación
npm run insert-words

# Insertar palabras sin confirmación
npm run insert-words-force

# Solo mostrar estadísticas de la BD
npm run show-stats

# Mostrar ayuda
npm run help
```

## 🛡️ Características de Seguridad

- **Validación de formato**: Verifica todos los campos antes de insertar
- **Constraint de duplicados**: La BD automáticamente evita palabras duplicadas
- **Transacciones por lotes**: Si falla un lote, los otros continúan
- **Confirmación de usuario**: Evita inserciones accidentales

## 🐛 Solución de Problemas

### Error: "Variables de entorno no encontradas"
```bash
# Verifica que .env.local exista en el directorio padre
ls ../.env.local

# Verifica el contenido
cat ../.env.local
```

### Error: "Cannot find module @supabase/supabase-js"
```bash
# Instala las dependencias
cd scripts
npm install
```

### Error: "duplicate key value violates unique constraint"
- Es normal, significa que la palabra ya existe
- El script continúa con las siguientes palabras

## 📊 Consultas SQL Útiles

```sql
-- Ver estadísticas por categoría
SELECT category, COUNT(*) as total 
FROM game_words 
GROUP BY category 
ORDER BY total DESC;

-- Ver estadísticas por dificultad
SELECT difficulty, COUNT(*) as total 
FROM game_words 
GROUP BY difficulty;

-- Buscar palabras de una categoría específica
SELECT * FROM game_words 
WHERE category = 'Animales' 
ORDER BY difficulty, word;

-- Ver todas las categorías disponibles
SELECT DISTINCT category 
FROM game_words 
ORDER BY category;
```

## 🎉 ¡Listo para usar!

Una vez que hayas agregado tus palabras, el juego las usará automáticamente cuando:
1. El toggle "Usar palabras de la base de datos" esté activado
2. Se seleccione la categoría correspondiente
3. Se elija la dificultad apropiada

¡Diviértete creando nuevas palabras para el juego! 🎮

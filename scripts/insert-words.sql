-- ===============================================
-- SCRIPT SQL PARA INSERCIÓN MASIVA DE PALABRAS
-- Mister White Game - Supabase
-- ===============================================

-- Instrucciones de uso:
-- 1. Modifica la sección de INSERT VALUES con tus palabras
-- 2. Ejecuta este script en el editor SQL de Supabase
-- 3. Revisa los resultados en la tabla game_words

-- ===============================================
-- INSERCIÓN DE PALABRAS PERSONALIZADAS
-- ===============================================

-- Plantilla: (categoria, palabra_civil, palabra_undercover, dificultad)
-- Dificultades válidas: 'easy', 'medium', 'hard'

INSERT INTO game_words (category, word, undercover_word, difficulty) VALUES
-- ========== ANIMALES ==========
('Animales', 'Serpiente', 'Lagarto', 'medium'),
('Animales', 'Delfín', 'Ballena', 'medium'),
('Animales', 'Mariposa', 'Abeja', 'easy'),
('Animales', 'Cocodrilo', 'Caimán', 'hard'),
('Animales', 'Pingüino', 'Foca', 'easy'),

-- ========== INSTRUMENTOS ==========
('Instrumentos', 'Guitarra', 'Violín', 'medium'),
('Instrumentos', 'Piano', 'Teclado', 'easy'),
('Instrumentos', 'Batería', 'Percusión', 'medium'),
('Instrumentos', 'Saxofón', 'Trompeta', 'hard'),
('Instrumentos', 'Flauta', 'Clarinete', 'hard'),

-- ========== TECNOLOGÍA ==========
('Tecnología', 'Smartphone', 'Tablet', 'easy'),
('Tecnología', 'Laptop', 'Desktop', 'medium'),
('Tecnología', 'Auriculares', 'Altavoces', 'easy'),
('Tecnología', 'Router', 'Módem', 'hard'),
('Tecnología', 'Smartwatch', 'Pulsera fitness', 'medium'),

-- ========== LUGARES ==========
('Lugares', 'Playa', 'Piscina', 'easy'),
('Lugares', 'Montaña', 'Colina', 'medium'),
('Lugares', 'Biblioteca', 'Librería', 'medium'),
('Lugares', 'Hospital', 'Clínica', 'easy'),
('Lugares', 'Museo', 'Galería', 'hard'),

-- ========== ROPA ==========
('Ropa', 'Camisa', 'Blusa', 'easy'),
('Ropa', 'Pantalón', 'Vaqueros', 'easy'),
('Ropa', 'Chaqueta', 'Abrigo', 'medium'),
('Ropa', 'Zapatos', 'Zapatillas', 'easy'),
('Ropa', 'Sombrero', 'Gorra', 'easy'),

-- ========== COMIDA ADICIONAL ==========
('Comida', 'Pasta', 'Arroz', 'easy'),
('Comida', 'Pescado', 'Pollo', 'easy'),
('Comida', 'Chocolate', 'Caramelo', 'easy'),
('Comida', 'Café', 'Té', 'medium'),
('Comida', 'Vino', 'Cerveza', 'medium'),

-- ========== DEPORTES ADICIONALES ==========
('Deportes', 'Golf', 'Hockey', 'medium'),
('Deportes', 'Boxeo', 'Karate', 'medium'),
('Deportes', 'Esquí', 'Snowboard', 'medium'),
('Deportes', 'Surf', 'Windsurf', 'hard'),
('Deportes', 'Yoga', 'Pilates', 'hard'),

-- ========== TRABAJOS/OFICIOS ==========
('Trabajos', 'Carpintero', 'Albañil', 'medium'),
('Trabajos', 'Electricista', 'Fontanero', 'medium'),
('Trabajos', 'Piloto', 'Azafata', 'medium'),
('Trabajos', 'Bombero', 'Policía', 'easy'),
('Trabajos', 'Periodista', 'Escritor', 'hard'),

-- ========== MÚSICA ==========
('Música', 'Rock', 'Pop', 'easy'),
('Música', 'Jazz', 'Blues', 'hard'),
('Música', 'Rap', 'Hip-hop', 'medium'),
('Música', 'Clásica', 'Ópera', 'hard'),
('Música', 'Reggae', 'Ska', 'hard'),

-- ========== NATURALEZA ==========
('Naturaleza', 'Río', 'Lago', 'easy'),
('Naturaleza', 'Bosque', 'Selva', 'medium'),
('Naturaleza', 'Desierto', 'Sabana', 'medium'),
('Naturaleza', 'Volcán', 'Géiser', 'hard'),
('Naturaleza', 'Cascada', 'Manantial', 'hard')

-- Nota: Si alguna palabra ya existe, se producirá un error debido al constraint unique_word_pair
-- Esto es normal y ayuda a evitar duplicados

ON CONFLICT (word, undercover_word) DO NOTHING;

-- ===============================================
-- CONSULTAS ÚTILES PARA VERIFICAR
-- ===============================================

-- Ver todas las palabras por categoría
-- SELECT category, COUNT(*) as total 
-- FROM game_words 
-- GROUP BY category 
-- ORDER BY category;

-- Ver todas las palabras por dificultad
-- SELECT difficulty, COUNT(*) as total 
-- FROM game_words 
-- GROUP BY difficulty 
-- ORDER BY difficulty;

-- Ver palabras de una categoría específica
-- SELECT * FROM game_words WHERE category = 'Animales' ORDER BY difficulty;

-- Buscar palabras duplicadas (no debería haber ninguna)
-- SELECT word, undercover_word, COUNT(*) 
-- FROM game_words 
-- GROUP BY word, undercover_word 
-- HAVING COUNT(*) > 1;

-- ===============================================
-- PLANTILLA PARA AGREGAR MÁS PALABRAS
-- ===============================================

/*
-- Copia y modifica esta plantilla para agregar más palabras:

INSERT INTO game_words (category, word, undercover_word, difficulty) VALUES
('TU_CATEGORIA', 'Palabra Civil', 'Palabra Undercover', 'easy'),
('TU_CATEGORIA', 'Otra Palabra', 'Otra Undercover', 'medium'),
('TU_CATEGORIA', 'Palabra Difícil', 'Undercover Difícil', 'hard')
ON CONFLICT (word, undercover_word) DO NOTHING;

*/

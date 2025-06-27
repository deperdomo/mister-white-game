-- ===============================================
-- ESQUEMA DE BASE DE DATOS PARA MISTER WHITE GAME
-- ===============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. TABLA DE SALAS DE JUEGO (game_rooms)
-- ===============================================
CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    current_round INTEGER DEFAULT 1,
    max_players INTEGER DEFAULT 8 CHECK (max_players >= 3 AND max_players <= 20),
    current_word TEXT,
    undercover_word TEXT,
    host_id UUID NOT NULL,
    
    -- Índices para optimización
    CONSTRAINT room_code_format CHECK (room_code ~ '^[A-Z0-9]{6}$')
);

-- Índices para game_rooms
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_created_at ON game_rooms(created_at);

-- ===============================================
-- 2. TABLA DE JUGADORES (game_players)
-- ===============================================
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_name VARCHAR(50) NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) CHECK (role IN ('civil', 'mister_white', 'undercover', 'payaso')),
    is_alive BOOLEAN DEFAULT TRUE,
    description TEXT,
    voted_for VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT player_name_length CHECK (LENGTH(player_name) >= 2 AND LENGTH(player_name) <= 50),
    CONSTRAINT unique_player_per_room UNIQUE(room_id, player_name),
    CONSTRAINT max_one_host_per_room EXCLUDE USING btree (room_id WITH =) WHERE (is_host = true)
);

-- Índices para game_players
CREATE INDEX idx_game_players_room_id ON game_players(room_id);
CREATE INDEX idx_game_players_is_host ON game_players(is_host);
CREATE INDEX idx_game_players_is_alive ON game_players(is_alive);
CREATE INDEX idx_game_players_role ON game_players(role);

-- ===============================================
-- 3. TABLA DE PALABRAS/CATEGORÍAS (game_words)
-- ===============================================
CREATE TABLE game_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    word VARCHAR(100) NOT NULL,
    undercover_word VARCHAR(100) NOT NULL,
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT unique_word_pair UNIQUE(word, undercover_word)
);

-- Índices para game_words
CREATE INDEX idx_game_words_category ON game_words(category);
CREATE INDEX idx_game_words_difficulty ON game_words(difficulty);

-- ===============================================
-- 4. TABLA DE TURNOS/DESCRIPCIONES (game_turns)
-- ===============================================
CREATE TABLE game_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para un turno por jugador por ronda
    CONSTRAINT unique_turn_per_round UNIQUE(room_id, player_id, round_number)
);

-- Índices para game_turns
CREATE INDEX idx_game_turns_room_id ON game_turns(room_id);
CREATE INDEX idx_game_turns_round_number ON game_turns(round_number);
CREATE INDEX idx_game_turns_created_at ON game_turns(created_at);

-- ===============================================
-- 5. TABLA DE VOTOS (game_votes)
-- ===============================================
CREATE TABLE game_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
    target_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT no_self_vote CHECK (voter_id != target_id),
    CONSTRAINT unique_vote_per_round UNIQUE(room_id, voter_id, round_number)
);

-- Índices para game_votes
CREATE INDEX idx_game_votes_room_id ON game_votes(room_id);
CREATE INDEX idx_game_votes_round_number ON game_votes(round_number);
CREATE INDEX idx_game_votes_created_at ON game_votes(created_at);

-- ===============================================
-- 6. TABLA DE ESTADÍSTICAS (game_stats) - OPCIONAL
-- ===============================================
CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(50) NOT NULL,
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    role VARCHAR(20),
    won BOOLEAN DEFAULT FALSE,
    eliminated_round INTEGER,
    total_votes_received INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    game_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para game_stats
CREATE INDEX idx_game_stats_player_name ON game_stats(player_name);
CREATE INDEX idx_game_stats_won ON game_stats(won);
CREATE INDEX idx_game_stats_role ON game_stats(role);

-- ===============================================
-- FUNCIONES Y TRIGGERS
-- ===============================================

-- Función para limpiar salas antiguas (más de 24 horas)
CREATE OR REPLACE FUNCTION cleanup_old_rooms() 
RETURNS void AS $$
BEGIN
    DELETE FROM game_rooms 
    WHERE created_at < NOW() - INTERVAL '24 hours'
    AND status = 'finished';
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el host cuando el host actual se va
CREATE OR REPLACE FUNCTION update_host_on_leave()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el jugador que se va era el host
    IF OLD.is_host = TRUE THEN
        -- Asignar el host al siguiente jugador más antiguo
        UPDATE game_players 
        SET is_host = TRUE 
        WHERE id = (
            SELECT id 
            FROM game_players 
            WHERE room_id = OLD.room_id 
            AND id != OLD.id 
            AND is_alive = TRUE
            ORDER BY created_at ASC 
            LIMIT 1
        );
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar host automáticamente
CREATE TRIGGER trigger_update_host_on_leave
    BEFORE DELETE ON game_players
    FOR EACH ROW
    EXECUTE FUNCTION update_host_on_leave();

-- ===============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ===============================================
-- Si quieres habilitar seguridad a nivel de fila

-- ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_turns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, puedes restringir después)
-- CREATE POLICY "Allow all operations on game_rooms" ON game_rooms FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on game_players" ON game_players FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on game_turns" ON game_turns FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on game_votes" ON game_votes FOR ALL USING (true);

-- ===============================================
-- DATOS INICIALES (PALABRAS DE EJEMPLO)
-- ===============================================

INSERT INTO game_words (category, word, undercover_word, difficulty) VALUES
-- Fácil (20 filas)
('Animales', 'Perro', 'Gato', 'easy'),
('Animales', 'León', 'Tigre', 'easy'),
('Animales', 'Elefante', 'Jirafa', 'easy'),
('Animales', 'Caballo', 'Burro', 'easy'),
('Animales', 'Pájaro', 'Loro', 'easy'),
('Comida', 'Pizza', 'Hamburguesa', 'easy'),
('Comida', 'Helado', 'Pastel', 'easy'),
('Comida', 'Sopa', 'Ensalada', 'easy'),
('Comida', 'Pan', 'Tostada', 'easy'),
('Comida', 'Manzana', 'Pera', 'easy'),
('Transporte', 'Coche', 'Moto', 'easy'),
('Transporte', 'Avión', 'Barco', 'easy'),
('Transporte', 'Bicicleta', 'Patinete', 'easy'),
('Transporte', 'Tren', 'Metro', 'easy'),
('Transporte', 'Autobús', 'Camión', 'easy'),
('Colores', 'Rojo', 'Rosa', 'easy'),
('Colores', 'Azul', 'Turquesa', 'easy'),
('Colores', 'Verde', 'Lima', 'easy'),
('Frutas', 'Plátano', 'Kiwi', 'easy'),
('Frutas', 'Fresa', 'Frambuesa', 'easy'),

-- Medio (20 filas)
('Profesiones', 'Doctor', 'Enfermero', 'medium'),
('Profesiones', 'Profesor', 'Estudiante', 'medium'),
('Profesiones', 'Abogado', 'Juez', 'medium'),
('Profesiones', 'Ingeniero', 'Arquitecto', 'medium'),
('Profesiones', 'Cocinero', 'Panadero', 'medium'),
('Deportes', 'Fútbol', 'Baloncesto', 'medium'),
('Deportes', 'Tenis', 'Ping Pong', 'medium'),
('Deportes', 'Voleibol', 'Balonmano', 'medium'),
('Deportes', 'Natación', 'Waterpolo', 'medium'),
('Deportes', 'Ciclismo', 'Atletismo', 'medium'),
('Objetos', 'Teléfono', 'Tablet', 'medium'),
('Objetos', 'Televisión', 'Monitor', 'medium'),
('Objetos', 'Libro', 'Revista', 'medium'),
('Objetos', 'Reloj', 'Cronómetro', 'medium'),
('Objetos', 'Silla', 'Mesa', 'medium'),
('Herramientas', 'Martillo', 'Destornillador', 'medium'),
('Herramientas', 'Sierra', 'Taladro', 'medium'),
('Países', 'España', 'Portugal', 'medium'),
('Países', 'Francia', 'Italia', 'medium'),
('Países', 'Brasil', 'Argentina', 'medium'),

-- Difícil (20 filas)
('Emociones', 'Felicidad', 'Euforia', 'hard'),
('Emociones', 'Tristeza', 'Melancolía', 'hard'),
('Emociones', 'Amor', 'Pasión', 'hard'),
('Emociones', 'Miedo', 'Terror', 'hard'),
('Emociones', 'Ira', 'Furia', 'hard'),
('Conceptos', 'Libertad', 'Independencia', 'hard'),
('Conceptos', 'Justicia', 'Equidad', 'hard'),
('Conceptos', 'Democracia', 'República', 'hard'),
('Conceptos', 'Paz', 'Armonía', 'hard'),
('Conceptos', 'Ética', 'Moral', 'hard'),
('Abstracciones', 'Tiempo', 'Eternidad', 'hard'),
('Abstracciones', 'Espacio', 'Infinito', 'hard'),
('Abstracciones', 'Belleza', 'Estética', 'hard'),
('Abstracciones', 'Verdad', 'Realidad', 'hard'),
('Abstracciones', 'Destino', 'Azar', 'hard'),
('Filosofía', 'Existencia', 'Esencia', 'hard'),
('Filosofía', 'Ser', 'Estar', 'hard'),
('Ciencia', 'Átomo', 'Molécula', 'hard'),
('Ciencia', 'Energía', 'Materia', 'hard'),
('Ciencia', 'Gravedad', 'Inercia', 'hard');

-- ===============================================
-- COMENTARIOS FINALES
-- ===============================================

-- Este esquema proporciona:
-- 1. Gestión completa de salas y jugadores
-- 2. Sistema de palabras configurable por dificultad
-- 3. Seguimiento de turnos y descripciones
-- 4. Sistema de votación
-- 5. Estadísticas opcionales
-- 6. Funciones de limpieza automática
-- 7. Triggers para manejo automático de hosts
-- 8. Constraints para mantener integridad de datos
-- 9. Índices para optimización de consultas
-- 10. Datos iniciales para pruebas

-- Para usar este esquema:
-- 1. Copia y ejecuta este SQL en el editor SQL de Supabase
-- 2. Configura las variables de entorno en Vercel
-- 3. Las API routes ya están configuradas para usar estas tablas

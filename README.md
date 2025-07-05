# 🎭 Mister White Game

Una implementación moderna del clásico juego de deducción social "Mister White" construida con Next.js 14, TypeScript, Tailwind CSS, Supabase y Pusher.

## 🎮 Sobre el Juego

**Mister White** es un emocionante juego de deducción social donde:

- **3-20 jugadores** participan en cada partida
- **Roles secretos**: Civil, Undercover, Mister White y Payaso
- **Objetivo**: Los civiles deben encontrar a Mister White antes de que él adivine la palabra secreta

### � Roles del Juego

- **👥 Civiles**: Conocen la palabra secreta y deben dar pistas sin revelarla
- **🕵️ Undercover**: Tienen una palabra relacionada pero diferente (opcional)
- **🎭 Mister White**: No conoce la palabra y debe deducirla escuchando las pistas
- **🃏 Payaso**: Conoce la palabra, pero gana si es votado como Mister White (8+ jugadores)

## ✨ Características

### 🎮 Modos de Juego
- **🏠 Modo Local**: Perfecto para reuniones presenciales (3-20 jugadores)
- **🌐 Modo Online**: Juega con amigos desde cualquier lugar (hasta 20 jugadores)

### 🎯 Funcionalidades Principales
- ✅ Sistema de roles dinámico con configuración flexible
- ✅ Base de datos de palabras con diferentes dificultades
- ✅ Comunicación en tiempo real para modo online
- ✅ Interfaz responsive mobile-first
- ✅ Dark mode automático
- ✅ Sistema de salas privadas con códigos únicos
- ✅ Validaciones robustas y manejo de errores
- ✅ Video tutorial explicativo del juego

### � Diseño y UX
- **Mobile-First**: Optimizado para dispositivos móviles
- **Responsive**: Se adapta automáticamente a tablets y desktop
- **Accesibilidad**: Navegación por teclado y alto contraste
- **Animaciones**: Transiciones suaves para mejor experiencia

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Real-time**: Pusher WebSockets
- **UI Components**: Lucide React, shadcn/ui style
- **Hosting**: Vercel

## � Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Pusher

### 1. Clonar e instalar
```bash
git clone <repo-url>
cd mister-white-game
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Pusher 
PUSHER_APP_ID=tu_pusher_app_id
PUSHER_KEY=tu_pusher_key
PUSHER_SECRET=tu_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=tu_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=tu_pusher_cluster
```

### 3. Configurar base de datos
Ejecuta el script SQL en tu proyecto de Supabase:
```bash
# El archivo database-schema.sql contiene las tablas necesarias
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
app/
├── (local-game)/           # Modo local
│   └── local/
├── (online-game)/          # Modo online
│   ├── create-room/
│   ├── join-room/
│   └── room/[roomCode]/
├── api/                    # API Routes
├── components/
│   ├── ui/                 # Componentes base
│   ├── game/               # Componentes del juego
│   ├── layout/             # Header y Footer
│   └── forms/              # Formularios
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── pusher.ts           # Cliente Pusher
│   ├── game-logic.ts       # Lógica del juego
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Utilidades
└── contexts/               # React Contexts
```

## � Cómo Jugar

### Modo Local
1. Ve a "Juego Local"
2. Configura el número de jugadores y reglas
3. Añade los nombres de los jugadores
4. ¡Comienza a jugar!

### Modo Online
1. **Crear sala**: Ve a "Crear Sala Online" y comparte el código
2. **Unirse**: Ve a "Unirse a Sala" e ingresa el código
3. Espera a que todos se unan y ¡comienza la partida!

### Flujo del Juego
1. **Revelación de roles**: Cada jugador ve su rol secreto
2. **Ronda de pistas**: Todos dan una pista relacionada con su palabra
3. **Votación**: Los jugadores votan para eliminar al sospechoso
4. **Resultado**: Se revela si ganaron los civiles o Mister White

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Variables de entorno en producción
Asegúrate de configurar todas las variables de `.env.local` en tu plataforma de hosting.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Reconocimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Supabase](https://supabase.com/) - Backend as a Service
- [Pusher](https://pusher.com/) - Real-time WebSockets
- [Lucide React](https://lucide.dev/) - Iconos
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI

---

**Estado**: ✅ Completamente funcional  
**Última actualización**: Julio 2025

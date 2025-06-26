# 🎭 Mister White Game

Una implementación moderna del clásico juego de deducción social "Mister White" construida con Next.js 14, TypeScript, Tailwind CSS, Supabase y Pusher.

## 🚀 Estado del Desarrollo

### ✅ FASE 1 COMPLETADA: Setup e Infraestructura

**Stack Tecnológico Implementado:**
- ✅ Next.js 14 con App Router y TypeScript
- ✅ Tailwind CSS v4 con variables CSS personalizadas
- ✅ Componentes UI base (shadcn/ui style)
- ✅ Configuración de Supabase
- ✅ Configuración de Pusher
- ✅ Layout responsive con Header y Footer
- ✅ Estructura de carpetas completa
- ✅ Sistema de tipos TypeScript completo
- ✅ Utilidades y helpers implementados
- ✅ Lógica del juego base

**Páginas Implementadas:**
- ✅ Página principal con diseño atractivo
- ✅ Crear sala online (/create-room)
- ✅ Unirse a sala (/join-room)  
- ✅ Modo local (/local)
- ✅ Layout responsive mobile-first

**Características Técnicas:**
- ✅ Diseño mobile-first responsive
- ✅ Dark mode automático
- ✅ Animaciones suaves con CSS
- ✅ Sistema de componentes modular
- ✅ Variables de entorno configuradas
- ✅ Optimización de performance
- ✅ Accesibilidad implementada

## 🎮 Sobre el Juego

**Mister White** es un emocionante juego de deducción social donde:

- **3-8 jugadores** participan en cada partida
- **Roles secretos**: Civil, Undercover, y Mister White
- **Objetivo**: Los civiles deben encontrar a Mister White antes de que él adivine la palabra secreta

### Roles del Juego

1. **Civiles** 👥: Conocen la palabra secreta y deben describir sin revelarla
2. **Undercover** 🕵️: Tienen una palabra relacionada pero diferente
3. **Mister White** 🎭: No conoce la palabra y debe deducirla escuchando

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Pusher

### Configuración

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd mister-white-game
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
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

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
app/
├── globals.css                 # Estilos globales y variables CSS
├── layout.tsx                  # Layout principal con Header/Footer
├── page.tsx                    # Página de inicio
├── (local-game)/
│   └── local/
│       └── page.tsx           # Configuración juego local
├── (online-game)/
│   ├── create-room/
│   │   └── page.tsx           # Crear sala online
│   ├── join-room/
│   │   └── page.tsx           # Unirse a sala
│   └── room/
│       └── [roomCode]/
│           └── page.tsx        # Sala de juego (pendiente)
├── api/                        # API Routes (pendiente)
├── components/
│   ├── ui/                     # Componentes UI base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── loading.tsx
│   ├── game/                   # Componentes del juego (pendiente)
│   ├── layout/
│   │   ├── Header.tsx          # Header responsive
│   │   └── Footer.tsx          # Footer
│   └── forms/                  # Formularios (pendiente)
└── lib/
    ├── supabase.ts            # Cliente Supabase
    ├── pusher.ts              # Cliente Pusher
    ├── game-logic.ts          # Lógica del juego
    ├── utils.ts               # Utilidades
    └── types.ts               # Tipos TypeScript
```

## 🎨 Diseño y UX

### Características del Diseño
- **Mobile-First**: Optimizado primero para dispositivos móviles
- **Responsive**: Se adapta a tablets y desktop automáticamente
- **Dark Mode**: Soporte automático según preferencias del sistema
- **Accesibilidad**: Navegación por teclado y alto contraste
- **Animaciones**: Transiciones suaves para mejor UX

### Paleta de Colores
- **Primary**: Slate 900/100 (dark/light mode)
- **Secondary**: Blue 600/400
- **Accent**: Green, Purple, Orange para estados
- **Destructive**: Red 600/400

## 🔮 Próximas Fases

### FASE 2: Páginas Principales y Navegación
- [ ] Formularios con validación
- [ ] Página de sala de espera
- [ ] Navegación entre estados
- [ ] Gestión de errores

### FASE 3: Lógica del Juego (Modo Local)
- [ ] Asignación de roles
- [ ] Interfaz de descripción
- [ ] Sistema de votación
- [ ] Pantalla de resultados

### FASE 4: Modo Online (Real-time)
- [ ] API Routes completas
- [ ] WebSocket events
- [ ] Sincronización de estado
- [ ] Persistencia en Supabase

### FASE 5: Polish y Optimización
- [ ] Animaciones avanzadas
- [ ] Loading states
- [ ] Error boundaries
- [ ] Testing
- [ ] Deploy a producción

## 🧪 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm start           # Servidor de producción
npm run lint        # Linter ESLint
```

## 🚀 Deploy

El proyecto está configurado para deploy automático en **Vercel**:

1. Conecta tu repositorio GitHub con Vercel
2. Configura las variables de entorno en Vercel
3. El deploy será automático en cada push

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Reconocimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Supabase](https://supabase.com/) - Backend as a Service
- [Pusher](https://pusher.com/) - Real-time WebSockets
- [Lucide React](https://lucide.dev/) - Iconos
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI

---

**Estado actual**: ✅ FASE 1 Completada - Ready para FASE 2
**Última actualización**: Junio 2025

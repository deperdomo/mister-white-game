import { PlayIcon, UsersIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 sm:py-16 lg:py-20">
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-50 mb-6">
            ¡Bienvenido a{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mister White
            </span>
            !
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Un emocionante juego de deducción social donde la astucia y la observación son clave. 
            ¿Podrás descubrir quién es el espía antes de que te descubran?
          </p>
        </div>
        
        {/* Botones de acción principales */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/create-room">
            <Button size="lg" className="w-full sm:w-auto">
              <UsersIcon className="mr-2 h-5 w-5" />
              Crear Sala Online
            </Button>
          </Link>
          <Link href="/join-room">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <PlayIcon className="mr-2 h-5 w-5" />
              Unirse a Sala
            </Button>
          </Link>
          <Link href="/local">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <MonitorIcon className="mr-2 h-5 w-5" />
              Juego Local
            </Button>
          </Link>
        </div>
      </section>

      {/* Características del juego */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-50 mb-8">
          ¿Cómo se juega?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                  <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Roles Secretos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cada jugador recibe un rol: <strong>Civil</strong> (conoce la palabra), 
                <strong> Undercover</strong> (palabra relacionada, opcional), <strong>Mister White</strong> (no conoce la palabra),
                o <strong>Payaso</strong> (conoce la palabra, gana si es votado como Mister White - 8+ jugadores).
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                  <PlayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                Dar Pistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Todos los jugadores dan una pista de una palabra relacionada con su palabra secreta 
                <strong>al mismo tiempo</strong>. Luego se procede a la votación.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
                  <MonitorIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                Votar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Después de las descripciones, todos votan para eliminar al sospechoso. 
                ¡Identifica a Mister White antes de que adivine la palabra!
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modos de juego */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-50 mb-8">
          Modos de Juego
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modo Online */}
          <Card className="animate-fade-in border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
                <UsersIcon className="mr-3 h-8 w-8" />
                Modo Online
              </CardTitle>
              <CardDescription>
                Juega con amigos desde cualquier lugar del mundo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Hasta 20 jugadores simultáneos</li>
                <li>• Salas privadas con código único</li>
                <li>• Sincronización en tiempo real</li>
                <li>• Nuevos roles: Payaso (8+ jugadores)</li>
                <li>• Undercover opcional</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/create-room" className="flex-1">
                  <Button className="w-full">Crear Sala</Button>
                </Link>
                <Link href="/join-room" className="flex-1">
                  <Button variant="outline" className="w-full">Unirse</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Modo Local */}
          <Card className="animate-fade-in border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <MonitorIcon className="mr-3 h-8 w-8" />
                Modo Local
              </CardTitle>
              <CardDescription>
                Perfecto para reuniones presenciales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• De 3 a 20 jugadores en persona</li>
                <li>• No requiere conexión a internet</li>
                <li>• Rol Payaso para 8+ jugadores</li>
                <li>• Undercover opcional</li>
                <li>• Categorías solo en dificultad fácil</li>
                <li>• Ideal para fiestas y reuniones</li>
              </ul>
              <Link href="/local">
                <Button variant="success" className="w-full">
                  <SmartphoneIcon className="mr-2 h-4 w-4" />
                  Empezar Modo Local
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-8">
            ¿Por qué elegir Mister White?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">3-20</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Jugadores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">15min</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Por partida</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">100%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Gratis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">∞</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Diversión</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          ¿Listo para empezar?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Reúne a tus amigos y descubre quién tiene la mejor habilidad de deducción
        </p>
        <Link href="/create-room">
          <Button size="lg">
            <PlayIcon className="mr-2 h-5 w-5" />
            ¡Empezar a Jugar!
          </Button>
        </Link>
      </section>
    </div>
  );
}

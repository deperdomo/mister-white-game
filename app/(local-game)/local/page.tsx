import Link from "next/link";
import { ArrowLeft, Monitor, Users, Play } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function LocalGamePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header con navegación */}
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Modo Local
        </h1>
      </div>

      {/* Configuración del juego local */}
      <Card className="animate-fade-in mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
            <Monitor className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Configurar Juego Local</CardTitle>
          <CardDescription>
            Perfecto para reuniones presenciales. Configura los jugadores y empieza a jugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerCount">Número de jugadores</Label>
              <select
                id="playerCount"
                className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                defaultValue="4"
              >
                <option value="3">3 jugadores</option>
                <option value="4">4 jugadores</option>
                <option value="5">5 jugadores</option>
                <option value="6">6 jugadores</option>
                <option value="7">7 jugadores</option>
                <option value="8">8 jugadores</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <select
                id="difficulty"
                className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                defaultValue="medium"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Lista de jugadores */}
          <div className="space-y-4">
            <Label>Nombres de los jugadores</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-1">
                  <Label htmlFor={`player${num}`} className="text-xs text-slate-500">
                    Jugador {num}
                  </Label>
                  <Input
                    id={`player${num}`}
                    placeholder={`Nombre del jugador ${num}`}
                    maxLength={20}
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <Users className="mr-2 h-4 w-4" />
              Agregar más jugadores
            </Button>
          </div>

          {/* Botón de inicio */}
          <Button className="w-full" size="lg">
            <Play className="mr-2 h-5 w-5" />
            Iniciar Juego Local
          </Button>
        </CardContent>
      </Card>

      {/* Instrucciones para modo local */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona el modo local?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                1. Configurar
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Agrega los nombres de todos los jugadores presentes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                2. Roles secretos
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Cada jugador verá su rol en la pantalla por turnos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg w-fit mx-auto mb-2">
                <Play className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1">
                3. ¡A jugar!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sigue las instrucciones en pantalla para describir y votar
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-sm text-yellow-900 dark:text-yellow-100 mb-2">
              💡 Consejos para el modo local
            </h3>
            <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Asegúrate de que todos puedan ver la pantalla</li>
              <li>• Pasen el dispositivo entre jugadores para ver roles</li>
              <li>• Mantengan el silencio cuando no sea su turno</li>
              <li>• ¡Diviértanse y sean creativos con las descripciones!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

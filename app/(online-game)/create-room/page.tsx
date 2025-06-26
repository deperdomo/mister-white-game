import Link from "next/link";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function CreateRoomPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* Header con navegación */}
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Crear Sala
        </h1>
      </div>

      {/* Formulario de creación */}
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mb-4">
            <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Nueva Sala Online</CardTitle>
          <CardDescription>
            Configura tu sala y comparte el código con tus amigos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Tu nombre</Label>
              <Input
                id="playerName"
                placeholder="Escribe tu nombre"
                maxLength={20}
                className="w-full"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Máximo 20 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Número máximo de jugadores</Label>
              <select
                id="maxPlayers"
                className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                defaultValue="6"
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
              <Label htmlFor="difficulty">Dificultad de las palabras</Label>
              <select
                id="difficulty"
                className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                defaultValue="medium"
              >
                <option value="easy">Fácil - Palabras comunes</option>
                <option value="medium">Medio - Variedad equilibrada</option>
                <option value="hard">Difícil - Palabras complejas</option>
              </select>
            </div>
          </div>

          {/* Botón de creación */}
          <Button className="w-full" size="lg">
            <Users className="mr-2 h-5 w-5" />
            Crear Sala
          </Button>

          {/* Información adicional */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              ¿Qué sucede después?
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <li>• Se generará un código único de 6 caracteres</li>
              <li>• Podrás compartirlo con tus amigos</li>
              <li>• Serás el anfitrión de la sala</li>
              <li>• Podrás iniciar el juego cuando todos estén listos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Alternativas */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          ¿Ya tienes un código de sala?
        </p>
        <Link href="/join-room">
          <Button variant="outline" className="w-full">
            Unirse a una sala existente
          </Button>
        </Link>
      </div>
    </div>
  );
}

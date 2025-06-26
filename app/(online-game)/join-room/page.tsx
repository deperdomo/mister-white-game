import Link from "next/link";
import { ArrowLeft, Users, LogIn } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function JoinRoomPage() {
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
          Unirse a Sala
        </h1>
      </div>

      {/* Formulario de unión */}
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mb-4">
            <LogIn className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Unirse a Sala Existente</CardTitle>
          <CardDescription>
            Ingresa el código de sala que te compartió tu amigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomCode">Código de sala</Label>
              <Input
                id="roomCode"
                placeholder="Ej: ABC123"
                maxLength={6}
                className="w-full text-center text-lg font-mono tracking-wider"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Código de 6 caracteres (letras y números)
              </p>
            </div>

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
          </div>

          {/* Botón de unión */}
          <Button className="w-full" size="lg">
            <Users className="mr-2 h-5 w-5" />
            Unirse a la Sala
          </Button>

          {/* Estado de conexión */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-2">
              Estado de la conexión
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Conectado y listo para unirse
              </span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              ¿Qué sucede después?
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <li>• Te unirás automáticamente a la sala</li>
              <li>• Verás a los otros jugadores conectados</li>
              <li>• Esperarás a que el anfitrión inicie el juego</li>
              <li>• ¡La diversión comenzará!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Alternativas */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          ¿No tienes un código de sala?
        </p>
        <Link href="/create-room">
          <Button variant="outline" className="w-full">
            Crear una nueva sala
          </Button>
        </Link>
      </div>

      {/* Ayuda */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
          💡 Consejos para unirse
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Asegúrate de escribir el código correctamente</li>
          <li>• Los códigos distinguen mayúsculas y minúsculas</li>
          <li>• Si hay problemas, pide al anfitrión que verifique el código</li>
        </ul>
      </div>
    </div>
  );
}

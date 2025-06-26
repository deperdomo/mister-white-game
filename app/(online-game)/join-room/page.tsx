'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import JoinRoomForm from "../../components/forms/JoinRoomForm";
import { JoinRoomFormData } from "../../lib/types";

export default function JoinRoomPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async (formData: JoinRoomFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implementar lógica real de unión a sala con Supabase
      console.log('Uniéndose a sala con datos:', formData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirigir a sala de espera
      router.push(`/waiting-room?code=${formData.roomCode}&host=false`);
      
    } catch (error) {
      console.error('Error al unirse a sala:', error);
      throw error; // El formulario manejará el error
    } finally {
      setIsLoading(false);
    }
  };

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
      <JoinRoomForm 
        onSubmit={handleJoinRoom}
        isLoading={isLoading}
      />

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
    </div>
  );
}

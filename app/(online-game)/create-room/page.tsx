'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import CreateRoomForm from "../../components/forms/CreateRoomForm";
import { CreateRoomFormData } from "../../lib/types";

export default function CreateRoomPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async (formData: CreateRoomFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implementar lógica real de creación de sala con Supabase
      console.log('Creando sala con datos:', formData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirigir a sala de espera (mock room code)
      const mockRoomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      router.push(`/waiting-room?code=${mockRoomCode}&host=true`);
      
    } catch (error) {
      console.error('Error al crear sala:', error);
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
          Crear Sala
        </h1>
      </div>

      {/* Formulario de creación */}
      <CreateRoomForm 
        onSubmit={handleCreateRoom}
        isLoading={isLoading}
      />

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

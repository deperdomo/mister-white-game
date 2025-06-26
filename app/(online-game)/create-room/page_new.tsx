'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import CreateRoomForm from "../../components/forms/CreateRoomForm";

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

      {/* Formulario de creación de sala */}
      <CreateRoomForm />

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

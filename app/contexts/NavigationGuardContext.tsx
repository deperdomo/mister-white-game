'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';

interface NavigationGuardValue {
  /** Indica si hay una partida en curso que conviene proteger */
  enabled: boolean;
  /** Activa o desactiva la protección de salida */
  setGuard: (enabled: boolean) => void;
  /**
   * Solicita una navegación. Si la protección está activa, muestra el aviso
   * y solo ejecuta `proceed` si el usuario confirma. Si no, navega directo.
   */
  requestNavigation: (proceed: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardValue>({
  enabled: false,
  setGuard: () => {},
  requestNavigation: (proceed) => proceed(),
});

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const setGuard = useCallback((value: boolean) => {
    setEnabled(value);
  }, []);

  const requestNavigation = useCallback(
    (proceed: () => void) => {
      if (enabled) {
        setPending(() => proceed);
      } else {
        proceed();
      }
    },
    [enabled]
  );

  // Avisar al recargar la página, cerrar la pestaña o navegar a una URL externa
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);

  const confirm = () => {
    const proceed = pending;
    setPending(null);
    setEnabled(false);
    proceed?.();
  };

  const cancel = () => setPending(null);

  return (
    <NavigationGuardContext.Provider value={{ enabled, setGuard, requestNavigation }}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={cancel}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-panel p-6 shadow-float">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-900/20">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium leading-6 text-fg">
                ¿Estás seguro de que quieres salir?
              </h3>
              <p className="mb-6 text-sm text-muted">
                Hay una partida en curso. Si sales ahora se perderán todos los datos y
                tendrás que empezar de nuevo.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={confirm}
                className="flex-1 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              >
                Salir
              </Button>
              <Button onClick={cancel} className="flex-1">
                Seguir jugando
              </Button>
            </div>
          </div>
        </div>
      )}
    </NavigationGuardContext.Provider>
  );
}

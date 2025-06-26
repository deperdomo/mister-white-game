import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Componente de error por defecto
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-900 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">
            ¡Oops! Algo salió mal
          </CardTitle>
          <CardDescription>
            Ha ocurrido un error inesperado. No te preocupes, puedes intentarlo de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200 font-mono">
              {error.message}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={retry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para errores de página específicos
interface PageErrorProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function PageError({ 
  title = "Error", 
  message = "Ha ocurrido un error inesperado",
  error,
  onRetry,
  showHomeButton = true 
}: PageErrorProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-900 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">
            {title}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar de nuevo
              </Button>
            )}
            {showHomeButton && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook para manejar errores
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setError(errorObj);
    console.error('Error manejado:', errorObj);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
  };
}

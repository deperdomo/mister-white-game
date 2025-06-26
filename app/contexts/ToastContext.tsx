'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useToast, Toast as ToastType } from '../hooks/useToast';
import { Toast as ToastComponent } from '../components/ui/toast';

interface ToastContextType {
  addToast: (toast: Omit<ToastType, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastHook = useToast();

  return (
    <ToastContext.Provider value={toastHook}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toastHook.toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => toastHook.removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export function useSimpleToast() {
  const success = useCallback((message: string, title?: string) => {
    toast.success(title || message, {
      description: title ? message : undefined,
    });
  }, []);

  const error = useCallback((message: string, title?: string) => {
    toast.error(title || message, {
      description: title ? message : undefined,
    });
  }, []);

  const warning = useCallback((message: string, title?: string) => {
    toast.warning(title || message, {
      description: title ? message : undefined,
    });
  }, []);

  const info = useCallback((message: string, title?: string) => {
    toast.info(title || message, {
      description: title ? message : undefined,
    });
  }, []);

  return useMemo(() => ({ success, error, warning, info }), [success, error, warning, info]);
}

export function useToast() {
  const simpleToast = useSimpleToast();

  return useMemo(() => ({
    toasts: [] as never[],
    showToast: (opts: { type: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string }) => {
      simpleToast[opts.type](opts.message, opts.title);
    },
    removeToast: (_id: string) => {
      // Sonner manages its own toast lifecycle
    },
  }), [simpleToast]);
}

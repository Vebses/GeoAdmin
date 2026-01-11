'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          classNames: {
            toast: 'bg-background border-border text-foreground',
            title: 'font-semibold',
            description: 'text-muted-foreground',
            success: 'bg-success/10 border-success text-success',
            error: 'bg-destructive/10 border-destructive text-destructive',
            warning: 'bg-warning/10 border-warning text-warning-foreground',
          },
        }}
      />
    </QueryClientProvider>
  );
}

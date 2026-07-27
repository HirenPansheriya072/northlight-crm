'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ApiError } from '@/lib/api';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => {
              // A 401 means the session is gone -- retrying just delays the redirect.
              if (error instanceof ApiError && error.status < 500) return false;
              return count < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '6px',
            border: '1px solid #E3E1DA',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  );
}

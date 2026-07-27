'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useSession } from '@/hooks/use-session';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError } = useSession();

  // Auth guard: the cookie is httpOnly, so the session check is the only source of truth.
  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  if (isLoading || (!data && !isError)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Loading workspace
        </span>
      </div>
    );
  }

  if (isError) return null;

  return <AppShell>{children}</AppShell>;
}

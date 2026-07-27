'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'form' | 'demo' | null>(null);

  async function enter(fn: () => Promise<unknown>, mode: 'form' | 'demo') {
    setError('');
    setLoading(mode);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['session'] });
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong';
      setError(message);
      if (mode === 'demo') toast.error(message);
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="lg:hidden">
        <span className="h-5 w-5 rounded-sm bg-pine" />
      </div>
      <h1 className="mt-4 font-display text-[26px] font-semibold tracking-tight lg:mt-0">
        Sign in
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">Pick up where your pipeline left off.</p>

      <Button
        variant="secondary"
        className="mt-6 w-full"
        loading={loading === 'demo'}
        onClick={() => enter(() => api.post('/auth/demo'), 'demo')}
      >
        Try the demo
      </Button>
      <p className="mt-2 text-center text-[12px] text-ink-faint">
        Opens a seeded studio account. No signup.
      </p>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          enter(() => api.post('/auth/login', { email, password }), 'form');
        }}
      >
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            required
          />
        </Field>
        <Field label="Password" error={error}>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={loading === 'form'}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        New here?{' '}
        <Link href="/register" className="font-medium text-pine hover:underline">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}

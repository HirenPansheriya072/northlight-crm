'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type FieldError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [invitationLoaded, setInvitationLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('token');
      setToken(t);
      if (t) {
        api.get<{ invite: { email: string } }>(`/users/invites/token/${t}`)
          .then((res) => {
            setForm((f) => ({ ...f, email: res.invite.email }));
            setInvitationLoaded(true);
          })
          .catch((err) => {
            setErrors({ email: err.message || 'Invalid or expired invitation link' });
          });
      }
    }
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = token ? { name: form.name, email: form.email, password: form.password, token } : form;
      await api.post('/auth/register', payload);
      await qc.invalidateQueries({ queryKey: ['session'] });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        // Server-side zod issues map straight onto the fields that caused them.
        const mapped: Record<string, string> = {};
        err.details.forEach((d: FieldError) => (mapped[d.field] = d.message));
        setErrors(mapped);
      } else {
        setErrors({ email: err instanceof Error ? err.message : 'Something went wrong' });
      }
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold tracking-tight">
        {token ? 'Join workspace' : 'Create a workspace'}
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        {token
          ? 'Enter details to join your team.'
          : 'You will be the owner. Invite the rest of the team later.'}
      </p>

      <form className="mt-6 space-y-3.5" onSubmit={submit}>
        {!token && (
          <Field label="Business name" error={errors.orgName}>
            <Input value={form.orgName} onChange={set('orgName')} placeholder="Northlight Studio" required />
          </Field>
        )}
        <Field label="Your name" error={errors.name}>
          <Input value={form.name} onChange={set('name')} placeholder="Ada Whitfield" required />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
            disabled={invitationLoaded}
          />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters.">
          <Input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          {token ? 'Join workspace' : 'Create workspace'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Already have one?{' '}
        <Link href="/login" className="font-medium text-pine hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">404</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The link may be out of date, or the record was deleted.
      </p>
      <Link href="/dashboard" className="mt-2 text-sm font-medium text-pine hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}

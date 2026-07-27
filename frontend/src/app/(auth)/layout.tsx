export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      {/* Left panel is the pitch. It only shows on wide screens; the form is the priority. */}
      <section className="relative hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-sm bg-pine" />
          <span className="font-display text-sm font-semibold tracking-tight">Northlight</span>
        </div>

        <div className="max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            Built for small teams
          </p>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] tracking-tight">
            Every lead, every follow-up, on one board.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Drag deals through your pipeline, keep notes where you will find them again, and let the
            reminders chase the work instead of you.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          {[
            ['Pipeline', 'One drag to move'],
            ['Notes', 'Attached to the person'],
            ['Reminders', 'Sent on time'],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine">{term}</dt>
              <dd className="mt-1 text-[13px] text-white/50">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-[340px]">{children}</div>
      </section>
    </main>
  );
}

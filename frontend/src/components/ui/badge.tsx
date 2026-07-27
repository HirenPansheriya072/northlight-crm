import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-slate-soft text-slate',
  pine: 'bg-pine-soft text-pine-dark',
  brass: 'bg-brass-soft text-brass',
  clay: 'bg-clay-soft text-clay',
  sky: 'bg-sky-soft text-sky',
  outline: 'border border-line-strong text-ink-muted',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-4',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

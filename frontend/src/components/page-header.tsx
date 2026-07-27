import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notification-center';

export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('rule bg-surface px-5 py-4 lg:px-7', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow ? <p className="label-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-1 font-display text-[22px] font-semibold leading-none tracking-tight">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          <div className={cn(
            'hidden lg:flex items-center h-8',
            actions && 'border-l border-line pl-3'
          )}>
            <NotificationCenter />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

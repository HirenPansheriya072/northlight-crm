import { AVATAR_TONES, cn, initials } from '@/lib/utils';

export function Avatar({
  name,
  color = 'slate',
  size = 'md',
  className,
}: {
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const sizes = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-[11px]',
  };
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight',
        AVATAR_TONES[color] || AVATAR_TONES.slate,
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

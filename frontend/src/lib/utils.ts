import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, currency = 'USD', compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: compact && Math.abs(value) >= 10000 ? 'compact' : 'standard',
  }).format(value || 0);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value: string | Date) {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** Due-date state drives the colour of every date chip in the app. */
export function dueState(dueDate: string | Date): 'overdue' | 'today' | 'soon' | 'later' {
  const due = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
  if (due < startOfToday) return 'overdue';
  if (due <= endOfToday) return 'today';
  if (due.getTime() - now.getTime() < 3 * 86400000) return 'soon';
  return 'later';
}

export function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export const AVATAR_TONES: Record<string, string> = {
  pine: 'bg-pine-soft text-pine-dark',
  brass: 'bg-brass-soft text-brass',
  sky: 'bg-sky-soft text-sky',
  clay: 'bg-clay-soft text-clay',
  slate: 'bg-slate-soft text-slate',
};

export const STAGE_TONES: Record<string, { dot: string; bar: string; text: string }> = {
  pine: { dot: 'bg-pine', bar: 'bg-pine', text: 'text-pine-dark' },
  brass: { dot: 'bg-brass', bar: 'bg-brass', text: 'text-brass' },
  sky: { dot: 'bg-sky', bar: 'bg-sky', text: 'text-sky' },
  clay: { dot: 'bg-clay', bar: 'bg-clay', text: 'text-clay' },
  amber: { dot: 'bg-brass', bar: 'bg-brass', text: 'text-brass' },
  slate: { dot: 'bg-slate', bar: 'bg-slate', text: 'text-slate' },
};

export function stageTone(color?: string) {
  return STAGE_TONES[color || 'slate'] || STAGE_TONES.slate;
}

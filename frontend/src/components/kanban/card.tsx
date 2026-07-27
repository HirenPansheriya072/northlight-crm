'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock } from 'lucide-react';
import type { Deal, Ref } from '@/lib/types';
import { cn, dueState, formatDate, formatMoney } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

const DUE_TONE: Record<string, string> = {
  overdue: 'text-clay',
  today: 'text-brass',
  soon: 'text-ink-muted',
  later: 'text-ink-faint',
};

export function DealCardBody({ deal, dragging }: { deal: Deal; dragging?: boolean }) {
  const contact = deal.contactId as Ref | undefined;
  const owner = deal.ownerId as Ref | undefined;
  const due = deal.expectedCloseDate ? dueState(deal.expectedCloseDate) : null;

  return (
    <div
      className={cn(
        'group rounded-md border border-line bg-surface p-3 shadow-card transition-shadow',
        dragging ? 'shadow-pop rotate-[1.5deg] cursor-grabbing' : 'hover:shadow-lift'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug text-ink">{deal.title}</p>
        <span className="tnum shrink-0 font-mono text-[12px] font-medium text-ink">
          {formatMoney(deal.value, deal.currency, true)}
        </span>
      </div>

      {contact?.name ? (
        <p className="mt-1 truncate text-[12px] text-ink-muted">
          {contact.name}
          {contact.company ? <span className="text-ink-faint"> · {contact.company}</span> : null}
        </p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {deal.expectedCloseDate ? (
          <span className={cn('flex items-center gap-1 text-[11px]', DUE_TONE[due || 'later'])}>
            <CalendarClock className="h-3 w-3" />
            {formatDate(deal.expectedCloseDate)}
          </span>
        ) : (
          <span className="text-[11px] text-ink-faint">No close date</span>
        )}
        {owner?.name ? <Avatar name={owner.name} color={owner.avatarColor} size="xs" /> : null}
      </div>
    </div>
  );
}

export function SortableDealCard({ deal, onOpen }: { deal: Deal; onOpen: (deal: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal._id,
    data: { type: 'card', deal },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(deal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(deal);
      }}
    >
      <DealCardBody deal={deal} />
    </div>
  );
}

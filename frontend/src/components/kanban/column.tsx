'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Column, Deal } from '@/lib/types';
import { cn, formatMoney, stageTone } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SortableDealCard } from './card';

export function BoardColumn({
  column,
  pipelineTotal,
  currency,
  onOpen,
  onAdd,
}: {
  column: Column;
  pipelineTotal: number;
  currency: string;
  onOpen: (deal: Deal) => void;
  onAdd: (stageId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } });
  const tone = stageTone(column.color);
  // The signature: each header carries the stage's share of total pipeline value,
  // so the board reads as a funnel at a glance instead of just a list of lists.
  const share = pipelineTotal > 0 ? (column.total / pipelineTotal) * 100 : 0;

  return (
    <div className="flex w-[272px] shrink-0 flex-col">
      <div className="rounded-t-lg border border-b-0 border-line bg-surface px-3 pb-2.5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.dot)} />
            <h3 className="truncate text-[13px] font-semibold text-ink">{column.name}</h3>
            <span className="tnum shrink-0 font-mono text-[11px] text-ink-faint">
              {column.cards.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAdd(column.id)}
            aria-label={`Add a deal to ${column.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="tnum mt-2 font-mono text-[12px] font-medium text-ink">
          {formatMoney(column.total, currency, true)}
        </p>
        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-line">
          <div
            className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)}
            style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[10px] tracking-[0.06em] text-ink-faint">
          {share.toFixed(0)}% of pipeline
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[140px] flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-line p-2 transition-colors',
          isOver ? 'bg-pine-soft/60' : 'bg-paper/70'
        )}
      >
        <SortableContext items={column.cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((deal) => (
            <SortableDealCard key={deal._id} deal={deal} onOpen={onOpen} />
          ))}
        </SortableContext>

        {column.cards.length === 0 && (
          <button
            onClick={() => onAdd(column.id)}
            className="flex flex-1 items-center justify-center rounded border border-dashed border-line-strong text-[12px] text-ink-faint transition-colors hover:border-pine hover:text-pine"
          >
            Drop a deal here
          </button>
        )}
      </div>
    </div>
  );
}

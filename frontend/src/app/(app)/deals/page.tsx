'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useBoard, useTeam } from '@/lib/queries';
import type { Deal } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { KanbanBoard } from '@/components/kanban/board';
import { DealDialog } from '@/components/deal-dialog';
import { Input, Select } from '@/components/ui/input';

export default function DealsPage() {
  const { data, isLoading, isError, error } = useBoard();
  const { data: team } = useTeam();

  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState('all');

  const [dialog, setDialog] = useState<{ open: boolean; deal?: Deal | null; stageId?: string }>({
    open: false,
  });

  const openCount = data?.columns.reduce((n, c) => n + c.cards.length, 0) ?? 0;

  const filteredColumns = data?.columns.map((col) => ({
    ...col,
    cards: col.cards.filter((deal) => {
      if (search && !deal.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter !== 'all') {
        const ownerId = (deal.ownerId as any)?._id || deal.ownerId;
        if (String(ownerId) !== ownerFilter) return false;
      }
      if (valueFilter !== 'all') {
        if (valueFilter === '10k+' && deal.value < 10000) return false;
        if (valueFilter === '50k+' && deal.value < 50000) return false;
        if (valueFilter === '100k+' && deal.value < 100000) return false;
      }
      return true;
    }),
  })) || [];

  const filteredData = data ? { ...data, columns: filteredColumns } : null;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow={data ? `${openCount} open · ${formatMoney(data.pipelineTotal, data.currency)} in play` : 'Pipeline'}
        title="Pipeline"
        actions={
          <Button variant="primary" size="sm" onClick={() => setDialog({ open: true, deal: null })}>
            <Plus className="h-3.5 w-3.5" />
            New deal
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-line bg-paper/20 lg:px-7">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="pl-8 h-10"
          />
        </div>
        <div className="w-[160px]">
          <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="h-10">
            <option value="all">All Owners</option>
            {team?.items.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[160px]">
          <Select value={valueFilter} onChange={(e) => setValueFilter(e.target.value)} className="h-10">
            <option value="all">All Values</option>
            <option value="10k+">&gt; $10,000</option>
            <option value="50k+">&gt; $50,000</option>
            <option value="100k+">&gt; $100,000</option>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex gap-3 px-5 pt-5 lg:px-7">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[440px] w-[272px] shrink-0" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-5 lg:p-7">
            <EmptyState
              title="The board could not load"
              body={(error as Error).message}
              action={
                <Button size="sm" onClick={() => location.reload()}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : data && data.columns.length === 0 ? (
          <div className="p-5 lg:p-7">
            <EmptyState
              title="No stages yet"
              body="A pipeline needs at least one stage before deals have somewhere to sit."
              action={
                <Button size="sm" variant="primary" asChild>
                  <a href="/settings">Set up stages</a>
                </Button>
              }
            />
          </div>
        ) : filteredData ? (
          <KanbanBoard
            data={filteredData}
            onOpen={(deal) => setDialog({ open: true, deal })}
            onAdd={(stageId) => setDialog({ open: true, deal: null, stageId })}
          />
        ) : null}
      </div>

      <DealDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        deal={dialog.deal}
        defaultStageId={dialog.stageId}
      />
    </div>
  );
}

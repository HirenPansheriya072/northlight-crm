'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { TaskRow } from '@/components/task-row';
import { TaskDialog } from '@/components/task-dialog';
import { TasksCalendar } from './calendar';

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
] as const;

const EMPTY: Record<string, { title: string; body: string }> = {
  today: { title: 'Nothing due today', body: 'The board is clear. Check upcoming to get ahead.' },
  overdue: { title: 'Nothing overdue', body: 'Every follow-up is on time. Keep it that way.' },
  upcoming: { title: 'Nothing scheduled', body: 'Add a follow-up so the next step does not get lost.' },
  done: { title: 'Nothing finished yet', body: 'Completed follow-ups collect here.' },
  all: { title: 'No follow-ups yet', body: 'Add one from a deal, a contact, or right here.' },
};

export default function TasksPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('today');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const { data, isLoading } = useTasks(viewMode === 'calendar' ? 'all' : tab);

  const badge = (id: string) => {
    if (!data || viewMode === 'calendar') return null;
    const n = data.counts[id as 'today' | 'overdue' | 'upcoming'];
    if (!n) return null;
    return (
      <span
        className={cn(
          'tnum ml-1.5 rounded-sm px-1 font-mono text-[10px]',
          id === 'overdue' ? 'bg-clay-soft text-clay' : 'bg-line text-ink-muted'
        )}
      >
        {n}
      </span>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow="Follow-ups"
        title="Follow-ups"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded border border-line p-0.5 bg-surface shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                  viewMode === 'list' ? 'bg-pine-soft text-pine font-semibold' : 'text-ink-muted hover:text-ink'
                )}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                  viewMode === 'calendar' ? 'bg-pine-soft text-pine font-semibold' : 'text-ink-muted hover:text-ink'
                )}
              >
                Calendar
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New follow-up
            </Button>
          </div>
        }
      >
        {viewMode === 'list' && (
          <div className="mt-4 flex gap-1 border-b border-line" style={{ marginBottom: '-1rem' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative -mb-px flex items-center border-b-2 px-2.5 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
                  tab === t.id
                    ? 'border-pine text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                )}
              >
                {t.label}
                {badge(t.id)}
              </button>
            ))}
          </div>
        )}
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-5 py-5 lg:px-7">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <TasksCalendar tasks={data?.items || []} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title={EMPTY[tab].title}
            body={EMPTY[tab].body}
            action={
              <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
                Add a follow-up
              </Button>
            }
          />
        ) : (
          <ul className="card overflow-hidden">
            {data.items.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </ul>
        )}
      </div>

      <TaskDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

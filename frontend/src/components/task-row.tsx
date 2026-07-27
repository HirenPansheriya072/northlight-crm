'use client';

import { CheckSquare, Square, Trash2 } from 'lucide-react';
import type { Ref, Task } from '@/lib/types';
import { cn, dueState, formatDateTime } from '@/lib/utils';
import { useDeleteTask, useToggleTask } from '@/lib/queries';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const DUE_LABEL: Record<string, { tone: 'clay' | 'brass' | 'neutral'; text: string }> = {
  overdue: { tone: 'clay', text: 'Overdue' },
  today: { tone: 'brass', text: 'Today' },
  soon: { tone: 'neutral', text: 'Soon' },
  later: { tone: 'neutral', text: 'Later' },
};

export function TaskRow({ task, showDelete = true }: { task: Task; showDelete?: boolean }) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const assignee = task.assigneeId as Ref | undefined;
  const state = dueState(task.dueDate);
  const label = DUE_LABEL[state];

  return (
    <li className="group flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0 hover:bg-paper/60">
      <button
        onClick={() => toggle.mutate({ id: task._id, done: !task.done })}
        className="shrink-0 text-ink-faint transition-colors hover:text-pine"
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        {task.done ? <CheckSquare className="h-4 w-4 text-pine" /> : <Square className="h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[13px]', task.done ? 'text-ink-faint line-through' : 'text-ink')}>
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="tnum font-mono">{formatDateTime(task.dueDate)}</span>
          {task.entityLabel ? (
            <>
              <span>·</span>
              <span className="truncate">{task.entityLabel}</span>
            </>
          ) : null}
        </p>
      </div>

      {!task.done ? <Badge tone={label.tone}>{label.text}</Badge> : null}
      {assignee?.name ? <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" /> : null}

      {showDelete ? (
        <button
          onClick={() => remove.mutate(task._id)}
          className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition-opacity hover:bg-clay-soft hover:text-clay focus:opacity-100 group-hover:opacity-100"
          aria-label="Delete follow-up"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}

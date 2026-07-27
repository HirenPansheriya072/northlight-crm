'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Square, CheckSquare, Trash2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToggleTask, useDeleteTask } from '@/lib/queries';

export function TasksCalendar({
  tasks,
}: {
  tasks: Task[];
}) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayIndex },
    (_, i) => prevMonthTotalDays - firstDayIndex + 1 + i
  );
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  const totalSlots = Math.ceil((firstDayIndex + totalDays) / 7) * 7;
  const nextMonthDays = Array.from(
    { length: totalSlots - (firstDayIndex + totalDays) },
    (_, i) => i + 1
  );

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const isToday = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <div className="card flex flex-col h-full bg-surface">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex h-7.5 w-7.5 items-center justify-center rounded border border-line hover:bg-paper transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-7.5 w-7.5 items-center justify-center rounded border border-line hover:bg-paper transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 border-b border-line text-center bg-paper/20">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            {d}
          </div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-[420px] divide-x divide-y divide-line select-none border-b border-r border-line -mr-[1px] -mb-[1px]">
        {/* Previous Month Days */}
        {prevMonthDays.map((day) => (
          <div key={`prev-${day}`} className="bg-paper/10 p-2 text-ink-faint">
            <span className="text-[11px] font-medium opacity-50">{day}</span>
          </div>
        ))}

        {/* Current Month Days */}
        {currentMonthDays.map((day) => {
          const dayTasks = tasks.filter((t) => {
            const taskDate = new Date(t.dueDate);
            return (
              taskDate.getFullYear() === year &&
              taskDate.getMonth() === month &&
              taskDate.getDate() === day
            );
          });

          return (
            <div
              key={`curr-${day}`}
              className={cn(
                'p-1.5 flex flex-col gap-1 min-h-[80px] overflow-hidden transition-colors',
                isToday(day, true) ? 'bg-pine-soft/10' : 'hover:bg-paper/30'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[11px] font-semibold h-5 w-5 rounded-full flex items-center justify-center',
                    isToday(day, true)
                      ? 'bg-pine text-white'
                      : 'text-ink-muted'
                  )}
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] font-mono text-ink-faint px-1">
                    {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 scroll-thin max-h-[75px]">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    className={cn(
                      'group w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center justify-between gap-1 transition-colors',
                      task.done
                        ? 'bg-line/40 text-ink-faint border-transparent'
                        : 'bg-pine-soft text-pine-dark border-pine/10 hover:bg-pine-soft/80'
                    )}
                  >
                    <button
                      onClick={() => toggle.mutate({ id: task._id, done: !task.done })}
                      className="flex items-center gap-1 min-w-0 flex-1 text-left"
                    >
                      {task.done ? (
                        <CheckSquare className="h-3 w-3 shrink-0 text-pine" />
                      ) : (
                        <Square className="h-3 w-3 shrink-0 text-ink-faint" />
                      )}
                      <span className={cn('truncate', task.done && 'line-through')}>{task.title}</span>
                    </button>
                    <button
                      onClick={() => remove.mutate(task._id)}
                      className="shrink-0 text-ink-faint opacity-0 group-hover:opacity-100 hover:text-clay transition-opacity"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Next Month Days */}
        {nextMonthDays.map((day) => (
          <div key={`next-${day}`} className="bg-paper/10 p-2 text-ink-faint">
            <span className="text-[11px] font-medium opacity-50">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

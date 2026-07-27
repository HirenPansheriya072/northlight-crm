'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { keys } from '@/lib/queries';
import type { BoardResponse, Column, Deal } from '@/lib/types';
import { BoardColumn } from './column';
import { DealCardBody } from './card';

interface MoveArgs {
  id: string;
  stageId: string;
  beforeId: string | null;
  afterId: string | null;
}

export function KanbanBoard({
  data,
  onOpen,
  onAdd,
}: {
  data: BoardResponse;
  onOpen: (deal: Deal) => void;
  onAdd: (stageId: string) => void;
}) {
  const qc = useQueryClient();
  const [columns, setColumns] = useState<Column[]>(data.columns);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Server data wins whenever we are not mid-drag, so a background refetch cannot
  // yank a card out from under the cursor.
  useEffect(() => {
    if (!activeId) setColumns(data.columns);
  }, [data.columns, activeId]);

  const sensors = useSensors(
    // 5px of slop means a click still opens the deal instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const move = useMutation({
    mutationFn: ({ id, ...body }: MoveArgs) => api.patch(`/deals/${id}/move`, body),
    onError: (err: Error) => {
      toast.error(err.message);
      // The drop was already painted, so roll the board back to the server's truth.
      setColumns(data.columns);
      qc.invalidateQueries({ queryKey: keys.board });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.board });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });

  const activeDeal = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const hit = col.cards.find((c) => c._id === activeId);
      if (hit) return hit;
    }
    return null;
  }, [activeId, columns]);

  const pipelineTotal = useMemo(
    () => columns.reduce((sum, c) => sum + c.cards.reduce((s, d) => s + (d.value || 0), 0), 0),
    [columns]
  );

  function columnOf(id: string) {
    return columns.find((c) => c.id === id || c.cards.some((card) => card._id === id));
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  // Cross-column moves happen while hovering so the placeholder is honest about where it lands.
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const from = columnOf(String(active.id));
    const to = columnOf(String(over.id));
    if (!from || !to || from.id === to.id) return;

    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const source = next.find((c) => c.id === from.id)!;
      const target = next.find((c) => c.id === to.id)!;
      const index = source.cards.findIndex((c) => c._id === active.id);
      if (index === -1) return prev;

      const [card] = source.cards.splice(index, 1);
      const overIndex = target.cards.findIndex((c) => c._id === over.id);
      target.cards.splice(overIndex >= 0 ? overIndex : target.cards.length, 0, card);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const target = columnOf(String(over.id));
    if (!target) return;

    let finalColumns = columns;
    const currentIndex = target.cards.findIndex((c) => c._id === active.id);
    const overIndex = target.cards.findIndex((c) => c._id === over.id);

    if (currentIndex !== -1 && overIndex !== -1 && currentIndex !== overIndex) {
      finalColumns = columns.map((c) =>
        c.id === target.id ? { ...c, cards: arrayMove(c.cards, currentIndex, overIndex) } : c
      );
      setColumns(finalColumns);
    }

    const column = finalColumns.find((c) => c.id === target.id)!;
    const index = column.cards.findIndex((c) => c._id === active.id);
    if (index === -1) return;

    // The server does fractional ordering, so it only needs the two neighbours.
    const beforeId = index > 0 ? column.cards[index - 1]._id : null;
    const afterId = index < column.cards.length - 1 ? column.cards[index + 1]._id : null;

    const original = data.columns.find((c) => c.cards.some((d) => d._id === active.id));
    const originalIndex = original?.cards.findIndex((d) => d._id === active.id) ?? -1;
    const unchanged = original?.id === column.id && originalIndex === index;
    if (unchanged) return;

    move.mutate({ id: String(active.id), stageId: column.id, beforeId, afterId });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="scroll-thin flex h-full gap-3 overflow-x-auto px-5 pb-6 pt-5 lg:px-7">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={{
              ...column,
              total: column.cards.reduce((s, d) => s + (d.value || 0), 0),
            }}
            pipelineTotal={pipelineTotal}
            currency={data.currency}
            onOpen={onOpen}
            onAdd={onAdd}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeDeal ? (
          <div className="w-[256px]">
            <DealCardBody deal={activeDeal} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

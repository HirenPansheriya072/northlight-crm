'use client';

import { useEffect, useState } from 'react';
import { useSaveTask, useTeam } from '@/lib/queries';
import { useSession } from '@/hooks/use-session';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/input';

function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  // datetime-local wants local time, not the UTC that toISOString hands back.
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function TaskDialog({
  open,
  onOpenChange,
  entity,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity?: { type: 'contact' | 'deal'; id: string; label?: string };
}) {
  const { data: session } = useSession();
  const { data: team } = useTeam();
  const [form, setForm] = useState({ title: '', dueDate: defaultDue(), assigneeId: '' });
  const save = useSaveTask();

  useEffect(() => {
    if (open) setForm({ title: '', dueDate: defaultDue(), assigneeId: session?.user.id || '' });
  }, [open, session]);

  function submit() {
    save.mutate(
      {
        title: form.title,
        dueDate: new Date(form.dueDate).toISOString(),
        assigneeId: form.assigneeId || undefined,
        entityType: entity?.type || 'none',
        entityId: entity?.id,
      } as Partial<Task>,
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title="New follow-up"
          description={entity?.label ? `On ${entity.label}` : 'A reminder lands in the assignee’s inbox.'}
        />
        <DialogBody>
          <Field label="What needs doing">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Call to confirm scope"
              autoFocus
            />
          </Field>
          <Field label="Due">
            <Input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </Field>
          <Field label="Assignee">
            <Select
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
            >
              {team?.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.title.trim()}>
            Add follow-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

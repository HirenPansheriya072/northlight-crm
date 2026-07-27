'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePlaybooks, useSavePlaybook, useDeletePlaybook } from '@/lib/queries';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/input';

interface NewTask {
  title: string;
  dueDaysAfter: number;
}

export function PlaybooksSettings() {
  const { data: session } = useSession();
  const { data: playbooks, isLoading } = usePlaybooks();
  const save = useSavePlaybook();
  const remove = useDeletePlaybook();

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'contact_created' | 'deal_stage_entered'>('contact_created');
  const [triggerValue, setTriggerValue] = useState('');
  const [tasks, setTasks] = useState<NewTask[]>([{ title: '', dueDaysAfter: 1 }]);

  const canEdit = session?.user.role !== 'rep';

  function addTask() {
    setTasks((prev) => [...prev, { title: '', dueDaysAfter: 1 }]);
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTask(index: number, patch: Partial<NewTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function submitPlaybook(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || tasks.some((t) => !t.title.trim())) return;

    save.mutate(
      {
        name,
        triggerType,
        triggerValue: triggerType === 'deal_stage_entered' ? triggerValue : '',
        tasks,
      },
      {
        onSuccess: () => {
          setName('');
          setTriggerType('contact_created');
          setTriggerValue('');
          setTasks([{ title: '', dueDaysAfter: 1 }]);
        },
      }
    );
  }

  if (isLoading) {
    return <p className="text-[13px] text-ink-faint">Loading playbooks...</p>;
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <section className="card p-5">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">Create Automation Playbook</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Automatically trigger set tasks when events occur.
          </p>

          <form onSubmit={submitPlaybook} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Playbook Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lead Nurture Playbook"
                  required
                />
              </Field>

              <Field label="Trigger Event">
                <Select
                  value={triggerType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTriggerType(val);
                    if (val === 'deal_stage_entered') {
                      setTriggerValue(session?.org?.pipelineStages[0]?.id || '');
                    } else {
                      setTriggerValue('');
                    }
                  }}
                >
                  <option value="contact_created">New Contact Created</option>
                  <option value="deal_stage_entered">Deal Entered Stage</option>
                </Select>
              </Field>

              {triggerType === 'deal_stage_entered' && (
                <Field label="Pipeline Stage">
                  <Select
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                  >
                    {session?.org?.pipelineStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            <div className="space-y-2">
              <label className="label-eyebrow block">Tasks to schedule</label>
              {tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(i, { title: e.target.value })}
                    placeholder="e.g. Schedule introductory call"
                    className="flex-1"
                    required
                  />
                  <div className="flex shrink-0 items-center gap-1.5 text-[12px] text-ink-muted">
                    <span>due in</span>
                    <Input
                      type="number"
                      min={0}
                      value={task.dueDaysAfter}
                      onChange={(e) => updateTask(i, { dueDaysAfter: Number(e.target.value) })}
                      className="w-[70px] text-center font-mono"
                      required
                    />
                    <span>days</span>
                  </div>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(i)}
                      aria-label="Remove task template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" onClick={addTask} className="mt-2">
                <Plus className="h-3.5 w-3.5" />
                Add task step
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={save.isPending}
              disabled={!name.trim() || tasks.some((t) => !t.title.trim())}
            >
              Create Playbook
            </Button>
          </form>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="rule px-5 py-3">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">Active Automation Playbooks</h2>
        </div>
        {playbooks?.items.length === 0 ? (
          <p className="p-5 text-[13px] text-ink-faint">No playbooks set up yet.</p>
        ) : (
          <ul>
            {playbooks?.items.map((pb) => (
              <li key={pb._id} className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-0">
                <div>
                  <h3 className="text-[13px] font-medium text-ink">{pb.name}</h3>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Triggered by:{' '}
                    <span className="font-semibold text-pine">
                      {pb.triggerType === 'contact_created'
                        ? 'New Contact Created'
                        : `Deal Entered Stage "${
                            session?.org?.pipelineStages.find((s) => s.id === pb.triggerValue)?.name || 'Unknown Stage'
                          }"`}
                    </span>
                    {' · '}
                    {pb.tasks.length} task{pb.tasks.length === 1 ? '' : 's'} scheduled
                  </p>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate(pb._id)}
                    loading={remove.isPending}
                    aria-label="Delete playbook"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-clay" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

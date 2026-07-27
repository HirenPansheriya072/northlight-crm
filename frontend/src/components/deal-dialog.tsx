'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { keys, useDeleteDeal, useSaveDeal, useTeam } from '@/lib/queries';
import { useSession } from '@/hooks/use-session';
import type { Contact, Deal, Note, Ref, Task, Interaction } from '@/lib/types';
import { formatMoney, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { NotesTimeline } from '@/components/notes-timeline';
import { AttachmentsList } from '@/components/attachments-list';

const BLANK = {
  title: '',
  value: '',
  stageId: '',
  contactId: '',
  ownerId: '',
  expectedCloseDate: '',
  status: 'open' as Deal['status'],
  lostReasonCategory: '',
  lostReason: '',
};

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function DealDialog({
  open,
  onOpenChange,
  deal,
  defaultStageId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal?: Deal | null;
  defaultStageId?: string;
}) {
  const { data: session } = useSession();
  const { data: team } = useTeam();
  const [form, setForm] = useState(BLANK);
  const [confirming, setConfirming] = useState(false);
  const [rightTab, setRightTab] = useState<'notes' | 'files'>('notes');

  const save = useSaveDeal(deal?._id);
  const remove = useDeleteDeal();

  // Only pull contacts once the dialog is actually open.
  const { data: contacts } = useQuery({
    queryKey: ['contacts', 'picker'],
    queryFn: () => api.get<{ items: Contact[] }>('/contacts?limit=100'),
    enabled: open,
  });

  const { data: detail } = useQuery({
    queryKey: keys.deal(deal?._id || ''),
    queryFn: () =>
      api.get<{ deal: Deal; notes: Note[]; tasks: Task[]; interactions: Interaction[] }>(
        `/deals/${deal!._id}`
      ),
    enabled: open && Boolean(deal?._id),
  });

  useEffect(() => {
    if (!open) return;
    setRightTab('notes');
    if (deal) {
      setForm({
        title: deal.title,
        value: String(deal.value ?? ''),
        stageId: deal.stageId,
        contactId: (deal.contactId as Ref)?._id || (deal.contactId as string) || '',
        ownerId: (deal.ownerId as Ref)?._id || (deal.ownerId as string) || '',
        expectedCloseDate: toDateInput(deal.expectedCloseDate),
        status: deal.status,
        lostReasonCategory: deal.lostReasonCategory || '',
        lostReason: deal.lostReason || '',
      });
    } else {
      setForm({
        ...BLANK,
        stageId: defaultStageId || session?.org?.pipelineStages[0]?.id || '',
        ownerId: session?.user.id || '',
      });
    }
  }, [open, deal, defaultStageId, session]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit() {
    save.mutate(
      {
        title: form.title,
        value: Number(form.value || 0),
        stageId: form.stageId,
        contactId: form.contactId || undefined,
        ownerId: form.ownerId || undefined,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : null,
        status: form.status,
        lostReasonCategory: form.status === 'lost' ? form.lostReasonCategory : '',
        lostReason: form.status === 'lost' ? form.lostReason : '',
      } as Partial<Deal>,
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent wide>
          <DialogHeader
            title={deal ? deal.title : 'New deal'}
            description={deal ? formatMoney(deal.value, deal.currency) : 'Add it to the pipeline.'}
          />

          <DialogBody className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Title">
                <Input value={form.title} onChange={set('title')} placeholder="Website redesign" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Value">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={form.value}
                    onChange={set('value')}
                    placeholder="0"
                    className="tnum font-mono"
                  />
                </Field>
                <Field label="Expected close">
                  <Input type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
                </Field>
              </div>

              <Field label="Stage">
                <Select value={form.stageId} onChange={set('stageId')}>
                  {session?.org?.pipelineStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Contact">
                <Select value={form.contactId} onChange={set('contactId')}>
                  <option value="">No contact</option>
                  {contacts?.items.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Owner">
                  <Select value={form.ownerId} onChange={set('ownerId')}>
                    {team?.items.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={set('status')}>
                    <option value="open">Open</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </Select>
                </Field>
              </div>

              {form.status === 'lost' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lost Category">
                    <Select value={form.lostReasonCategory} onChange={set('lostReasonCategory')}>
                      <option value="">Select reason</option>
                      <option value="Price">Price</option>
                      <option value="Competitor">Competitor</option>
                      <option value="Features">Features</option>
                      <option value="Timing">Timing</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Lost Details" hint="Future you will want to know.">
                    <Input value={form.lostReason} onChange={set('lostReason')} placeholder="Cheaper agency" />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="md:border-l md:border-line md:pl-5">
              <div className="flex border-b border-line mb-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRightTab('notes')}
                  className={cn(
                    'pb-1 text-[11px] font-mono uppercase tracking-[0.14em] border-b-2 -mb-[1px] transition-colors',
                    rightTab === 'notes' ? 'border-pine text-pine font-semibold' : 'border-transparent text-ink-faint hover:text-ink'
                  )}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('files')}
                  className={cn(
                    'pb-1 px-1.5 text-[11px] font-mono uppercase tracking-[0.14em] border-b-2 -mb-[1px] transition-colors',
                    rightTab === 'files' ? 'border-pine text-pine font-semibold' : 'border-transparent text-ink-faint hover:text-ink'
                  )}
                >
                  Files
                </button>
              </div>

              {deal ? (
                rightTab === 'notes' ? (
                  <NotesTimeline
                    notes={detail?.notes || []}
                    interactions={detail?.interactions || []}
                    entityType="deal"
                    entityId={deal._id}
                    invalidate={keys.deal(deal._id)}
                  />
                ) : (
                  <AttachmentsList entityType="deal" entityId={deal._id} />
                )
              ) : (
                <p className="text-[13px] text-ink-faint">Save the deal first, then notes and files go here.</p>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            {deal ? (
              <Button variant="ghost" size="sm" className="mr-auto text-clay" onClick={() => setConfirming(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.title.trim()}>
              {deal ? 'Save changes' : 'Add deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this deal?"
        body="The deal and its notes go away for good. Contacts stay."
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(deal!._id, {
            onSuccess: () => {
              setConfirming(false);
              onOpenChange(false);
            },
          })
        }
      />
    </>
  );
}

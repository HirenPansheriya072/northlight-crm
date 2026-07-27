'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { keys, useContact, useDeleteContact } from '@/lib/queries';
import type { Ref } from '@/lib/types';
import { formatDate, formatMoney, stageTone } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { NotesTimeline } from '@/components/notes-timeline';
import { ContactDialog } from '@/components/contact-dialog';
import { TaskDialog } from '@/components/task-dialog';
import { TaskRow } from '@/components/task-row';
import { AttachmentsList } from '@/components/attachments-list';
import { NotificationCenter } from '@/components/notification-center';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading, isError } = useContact(id);
  const remove = useDeleteContact();
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 p-5 lg:p-7">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-5 lg:p-7">
        <p className="text-sm text-ink-muted">That contact does not exist, or it was deleted.</p>
        <Link href="/contacts" className="mt-2 inline-block text-sm font-medium text-pine hover:underline">
          Back to contacts
        </Link>
      </div>
    );
  }

  const { contact, deals, notes, tasks, interactions } = data;
  const owner = contact.ownerId as Ref | undefined;
  const stages = session?.org?.pipelineStages || [];
  const openValue = deals.filter((d) => d.status === 'open').reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-screen overflow-y-auto scroll-thin">
      <div className="rule bg-surface px-5 py-4 lg:px-7">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" />
          Contacts
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={contact.name} color={owner?.avatarColor} className="h-11 w-11 text-sm" />
            <div>
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
                {contact.name}
              </h1>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {contact.title || 'No title on file'}
                {contact.company ? <span className="text-ink-faint"> · {contact.company}</span> : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="text-clay" onClick={() => setConfirming(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="hidden lg:flex items-center border-l border-line pl-3 h-8">
              <NotificationCenter />
            </div>
          </div>
        </div>

        <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          {contact.email ? (
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Mail className="h-3.5 w-3.5 text-ink-faint" />
              <a href={`mailto:${contact.email}`} className="hover:text-pine hover:underline">
                {contact.email}
              </a>
            </div>
          ) : null}
          {contact.phone ? (
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Phone className="h-3.5 w-3.5 text-ink-faint" />
              <span className="tnum font-mono text-[12px]">{contact.phone}</span>
            </div>
          ) : null}
          {contact.company ? (
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Building2 className="h-3.5 w-3.5 text-ink-faint" />
              {contact.company}
            </div>
          ) : null}
          <Badge tone="outline" className="capitalize">
            {contact.source}
          </Badge>
          {contact.tags.map((t) => (
            <Badge key={t} tone="pine">
              {t}
            </Badge>
          ))}
        </dl>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px] lg:p-7">
        <section className="card p-5">
          <h2 className="label-eyebrow">Notes</h2>
          <div className="mt-3">
            <NotesTimeline
              notes={notes}
              interactions={interactions}
              entityType="contact"
              entityId={contact._id}
              invalidate={keys.contact(id)}
            />
          </div>
        </section>

        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="rule flex items-baseline justify-between px-4 py-3">
              <h2 className="label-eyebrow">Deals</h2>
              <span className="tnum font-mono text-[11px] text-ink-muted">
                {formatMoney(openValue, 'USD', true)} open
              </span>
            </div>
            {deals.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-ink-faint">No deals with this contact yet.</p>
            ) : (
              <ul>
                {deals.map((deal) => {
                  const stage = stages.find((s) => s.id === deal.stageId);
                  const tone = stageTone(stage?.color);
                  return (
                    <li key={deal._id} className="border-b border-line px-4 py-2.5 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">{deal.title}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                            {stage?.name || 'Unknown stage'}
                            {deal.status !== 'open' ? ` · ${deal.status}` : ''}
                          </p>
                        </div>
                        <span className="tnum shrink-0 font-mono text-[12px] text-ink">
                          {formatMoney(deal.value, deal.currency, true)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="rule flex items-center justify-between px-4 py-2.5">
              <h2 className="label-eyebrow">Follow-ups</h2>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingTask(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tasks.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-ink-faint">Nothing scheduled with this contact.</p>
            ) : (
              <ul>
                {tasks.map((task) => (
                  <TaskRow key={task._id} task={task} showDelete={false} />
                ))}
              </ul>
            )}
          </section>

          <section className="card p-4">
            <h2 className="label-eyebrow mb-2.5">Files</h2>
            <AttachmentsList entityType="contact" entityId={contact._id} />
          </section>

          <p className="font-mono text-[10px] text-ink-faint">
            Added {formatDate(contact.createdAt)}
            {owner?.name ? ` · owned by ${owner.name}` : ''}
          </p>
        </div>
      </div>

      <ContactDialog open={editing} onOpenChange={setEditing} contact={contact} />
      <TaskDialog
        open={addingTask}
        onOpenChange={setAddingTask}
        entity={{ type: 'contact', id: contact._id, label: contact.name }}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${contact.name}?`}
        body="Their notes and follow-ups go too. Deals stay on the board, just without a contact attached."
        loading={remove.isPending}
        onConfirm={() => remove.mutate(contact._id, { onSuccess: () => router.push('/contacts') })}
      />
    </div>
  );
}

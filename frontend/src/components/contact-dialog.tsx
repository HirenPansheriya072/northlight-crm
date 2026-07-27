'use client';

import { useEffect, useState } from 'react';
import { useSaveContact, useTeam } from '@/lib/queries';
import type { Contact, Ref } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { api } from '@/lib/api';

const SOURCES = ['referral', 'website', 'cold outreach', 'event', 'social', 'other'];

const BLANK = {
  name: '',
  email: '',
  phone: '',
  company: '',
  title: '',
  source: 'other',
  tags: '',
  ownerId: '',
};

export function ContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact?: Contact | null;
}) {
  const { data: team } = useTeam();
  const [form, setForm] = useState(BLANK);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);
  const save = useSaveContact(contact?._id);

  useEffect(() => {
    if (!open) return;
    setForm(
      contact
        ? {
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            title: contact.title || '',
            source: contact.source || 'other',
            tags: contact.tags?.join(', ') || '',
            ownerId: (contact.ownerId as Ref)?._id || (contact.ownerId as string) || '',
          }
        : BLANK
    );
  }, [open, contact]);

  useEffect(() => {
    if (!open) {
      setDuplicate(null);
      return;
    }
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!email && !phone) {
      setDuplicate(null);
      return;
    }

    const handler = setTimeout(() => {
      let url = `/contacts/check-duplicate?`;
      if (email) url += `email=${encodeURIComponent(email)}&`;
      if (phone) url += `phone=${encodeURIComponent(phone)}&`;

      api.get<{ duplicate: boolean; contact?: { id: string; name: string } }>(url)
        .then((res) => {
          if (res.duplicate && res.contact && res.contact.id !== contact?._id) {
            setDuplicate(res.contact);
          } else {
            setDuplicate(null);
          }
        })
        .catch(() => setDuplicate(null));
    }, 400);

    return () => clearTimeout(handler);
  }, [form.email, form.phone, open, contact]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit() {
    save.mutate(
      {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        ownerId: form.ownerId || undefined,
      } as Partial<Contact>,
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title={contact ? 'Edit contact' : 'New contact'}
          description={contact ? undefined : 'The person, not the company.'}
        />
        <DialogBody>
          <Field label="Name">
            <Input value={form.name} onChange={set('name')} placeholder="Priya Raval" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={form.company} onChange={set('company')} placeholder="Meridian Foods" />
            </Field>
            <Field label="Job title">
              <Input value={form.title} onChange={set('title')} placeholder="Head of Marketing" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
          {duplicate && (
            <div className="mt-1 text-[12px] text-clay bg-clay-soft/60 border border-clay/10 rounded-sm px-3 py-2 flex items-center justify-between shadow-sm">
              <span>⚠️ <strong>{duplicate.name}</strong> is already registered.</span>
              <a
                href={`/contacts/${duplicate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-clay hover:text-clay-dark transition-colors"
              >
                View profile
              </a>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <Select value={form.source} onChange={set('source')}>
                {SOURCES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner">
              <Select value={form.ownerId} onChange={set('ownerId')}>
                <option value="">Unassigned</option>
                {team?.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tags" hint="Separate with commas.">
            <Input value={form.tags} onChange={set('tags')} placeholder="retainer, warm" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.name.trim()}>
            {contact ? 'Save changes' : 'Add contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

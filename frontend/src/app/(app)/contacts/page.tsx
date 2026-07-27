'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Plus, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useContacts } from '@/lib/queries';
import type { Contact, Ref } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { ContactDialog } from '@/components/contact-dialog';

const SOURCES = ['referral', 'website', 'cold outreach', 'event', 'social', 'other'];

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; contact?: Contact | null }>({ open: false });
  const fileRef = useRef<HTMLInputElement>(null);

  // Debounce so a fast typist does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useContacts({ q, source, page });

  async function importCsv(file: File) {
    const text = await file.text();
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    if (!headerLine) return toast.error('That file looks empty');

    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const rows = lines.map((line) => {
      // Handles quoted fields containing commas, which is where naive splits fall over.
      const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [];
      const values = cells.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
    });

    try {
      const res = await api.post<{ imported: number }>('/contacts/import', { rows });
      toast.success(`Imported ${res.imported} contact${res.imported === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow={data ? `${data.total} in the book` : 'Contacts'}
        title="Contacts"
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv(file);
                e.target.value = '';
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <a href={`${api.baseUrl}/contacts/export`}>
                <Download className="h-3.5 w-3.5" />
                Export
              </a>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDialog({ open: true, contact: null })}>
              <Plus className="h-3.5 w-3.5" />
              New contact
            </Button>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email, tag"
              className="pl-8"
            />
          </div>
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="w-[160px]"
          >
            <option value="">Every source</option>
            {SOURCES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-5 py-5 lg:px-7">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title={q || source ? 'Nothing matches that' : 'No contacts yet'}
            body={
              q || source
                ? 'Try a shorter search, or clear the source filter.'
                : 'Add the people you are talking to. Deals and follow-ups hang off them.'
            }
            action={
              q || source ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSource('');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setDialog({ open: true, contact: null })}>
                  Add the first contact
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="rule bg-paper/60">
                    {['Name', 'Company', 'Source', 'Tags', 'Owner', 'Added'].map((h) => (
                      <th key={h} className="label-eyebrow px-4 py-2.5 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => {
                    const owner = c.ownerId as Ref | undefined;
                    return (
                      <tr key={c._id} className="border-b border-line last:border-0 hover:bg-paper/60">
                        <td className="px-4 py-2.5">
                          <Link href={`/contacts/${c._id}`} className="group flex items-center gap-2.5">
                            <Avatar name={c.name} color={owner?.avatarColor} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium text-ink group-hover:text-pine">
                                {c.name}
                              </span>
                              {c.title ? (
                                <span className="block truncate text-[11px] text-ink-faint">{c.title}</span>
                              ) : null}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-ink-muted">{c.company || '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone="outline" className="capitalize">
                            {c.source}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex flex-wrap gap-1">
                            {c.tags.slice(0, 2).map((t) => (
                              <Badge key={t} tone="pine">
                                {t}
                              </Badge>
                            ))}
                            {c.tags.length > 2 ? (
                              <Badge tone="neutral">+{c.tags.length - 2}</Badge>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-ink-muted">{owner?.name || '—'}</td>
                        <td className="tnum px-4 py-2.5 font-mono text-[11px] text-ink-faint">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.pages > 1 ? (
              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono text-[11px] text-ink-faint">
                  Page {data.page} of {data.pages}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ContactDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        contact={dialog.contact}
      />
    </div>
  );
}

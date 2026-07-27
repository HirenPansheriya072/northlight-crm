'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Plus, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';
import { useSaveStages, useTeam, useInvites, useCreateInvite, useAuditLogs } from '@/lib/queries';
import { useSession } from '@/hooks/use-session';
import { cn, stageTone, relativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { PlaybooksSettings } from './playbooks';
import { toast } from 'sonner';

const COLORS = ['pine', 'sky', 'brass', 'clay', 'slate'];

interface EditableStage {
  _id?: string;
  name: string;
  color: string;
  isWon: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: team } = useTeam();
  const save = useSaveStages();
  const invites = useInvites();
  const createInvite = useCreateInvite();

  const [stages, setStages] = useState<EditableStage[]>([]);
  const [tab, setTab] = useState<'general' | 'playbooks' | 'security'>('general');
  const auditLogs = useAuditLogs();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('rep');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.org) {
      setStages(
        session.org.pipelineStages.map((s) => ({
          _id: s.id,
          name: s.name,
          color: s.color,
          isWon: Boolean(s.isWon),
        }))
      );
    }
  }, [session]);

  const canEdit = session?.user.role !== 'rep';

  function update(index: number, patch: Partial<EditableStage>) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...stages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next);
  }

  return (
    <div className="h-screen overflow-y-auto scroll-thin">
      <PageHeader eyebrow={session?.org?.name} title="Settings" />

      <div className="flex border-b border-line px-5 lg:px-7 mt-3 gap-1">
        <button
          onClick={() => setTab('general')}
          className={cn(
            'px-4 py-2 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors',
            tab === 'general' ? 'border-pine text-pine font-semibold' : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          General Settings
        </button>
        <button
          onClick={() => setTab('playbooks')}
          className={cn(
            'px-4 py-2 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors',
            tab === 'playbooks' ? 'border-pine text-pine font-semibold' : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          Automation Playbooks
        </button>
        {canEdit && (
          <button
            onClick={() => setTab('security')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors',
              tab === 'security' ? 'border-pine text-pine font-semibold' : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            Security & Logs
          </button>
        )}
      </div>

      <div className="max-w-3xl space-y-5 p-5 lg:p-7">
        {tab === 'playbooks' ? (
          <PlaybooksSettings />
        ) : tab === 'security' ? (
          <div className="space-y-6">
            <section className="card overflow-hidden">
              <div className="rule px-5 py-3 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-pine" />
                <h2 className="font-display text-[15px] font-semibold tracking-tight">Security & System Logs</h2>
              </div>
              {auditLogs.isLoading ? (
                <p className="p-5 text-[13px] text-ink-faint">Loading system logs...</p>
              ) : auditLogs.data?.items && auditLogs.data.items.length === 0 ? (
                <p className="p-5 text-[13px] text-ink-faint">No audit logs found.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {auditLogs.data?.items.map((log) => (
                    <li key={log._id} className="flex items-start gap-3 px-5 py-3 text-[13px]">
                      <Avatar name={log.actorId?.name} color={log.actorId?.avatarColor} size="sm" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-ink-muted leading-relaxed">
                          <strong className="font-semibold text-ink">{log.actorId?.name || 'System'}</strong>{' '}
                          {log.verb}{' '}
                          <span className="font-medium text-pine">
                            {log.meta?.name || log.meta?.title || log.meta?.fileName || log.meta?.stage || ''}
                          </span>
                        </p>
                        <p className="text-[10px] text-ink-faint mt-0.5">
                          {relativeTime(log.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <>
            <section className="card p-5">
              <h2 className="font-display text-[15px] font-semibold tracking-tight">Pipeline stages</h2>
              <p className="mt-1 text-[13px] text-ink-muted">
                These are the columns on the board, left to right. Marking a stage as won closes any deal
                dropped into it.
              </p>

              {!canEdit ? (
                <p className="mt-4 rounded border border-brass/30 bg-brass-soft px-3 py-2 text-[12px] text-brass">
                  Only an owner or manager can reshape the pipeline.
                </p>
              ) : null}

              <ul className="mt-4 space-y-2">
                {stages.map((stage, i) => {
                  const tone = stageTone(stage.color);
                  return (
                    <li key={stage._id || `new-${i}`} className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={!canEdit || i === 0}
                          className="text-ink-faint hover:text-ink disabled:opacity-30"
                          aria-label="Move stage earlier"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                      <Input
                        value={stage.name}
                        disabled={!canEdit}
                        onChange={(e) => update(i, { name: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={stage.color}
                        disabled={!canEdit}
                        onChange={(e) => update(i, { color: e.target.value })}
                        className="w-[110px]"
                      >
                        {COLORS.map((c) => (
                          <option key={c} value={c} className="capitalize">
                            {c}
                          </option>
                        ))}
                      </Select>
                      <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-ink-muted">
                        <input
                          type="checkbox"
                          checked={stage.isWon}
                          disabled={!canEdit}
                          onChange={(e) => update(i, { isWon: e.target.checked })}
                          className="h-3.5 w-3.5 accent-pine"
                        />
                        Won
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit || stages.length <= 1}
                        onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Remove stage"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>

              {canEdit ? (
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setStages((prev) => [...prev, { name: '', color: 'slate', isWon: false }])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add stage
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={save.isPending}
                    disabled={stages.some((s) => !s.name.trim())}
                    onClick={() => save.mutate(stages)}
                  >
                    Save pipeline
                  </Button>
                  <p className="ml-auto text-[12px] text-ink-faint">
                    A stage holding deals cannot be removed.
                  </p>
                </div>
              ) : null}
            </section>

            <section className="card overflow-hidden">
              <div className="rule px-5 py-3">
                <h2 className="font-display text-[15px] font-semibold tracking-tight">Team</h2>
              </div>
              <ul>
                {team?.items.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                    <Avatar name={u.name} color={u.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{u.name}</p>
                      <p className="text-[11px] text-ink-faint">{u.email}</p>
                    </div>
                    <Badge tone={u.role === 'owner' ? 'pine' : 'neutral'} className="capitalize">
                      {u.role}
                    </Badge>
                  </li>
                ))}
              </ul>

              {canEdit && (
                <div className="border-t border-line p-5 bg-paper/20">
                  <h3 className="text-[13px] font-semibold text-ink">Invite Team Member</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!inviteEmail.trim()) return;
                      createInvite.mutate(
                        { email: inviteEmail, role: inviteRole },
                        {
                          onSuccess: () => {
                            setInviteEmail('');
                            setInviteRole('rep');
                          },
                        }
                      );
                    }}
                    className="mt-3 flex items-end gap-3"
                  >
                    <div className="flex-1">
                      <Field label="Email Address">
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="teammate@company.com"
                          required
                        />
                      </Field>
                    </div>
                    <div className="w-[130px]">
                      <Field label="Role">
                        <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                          <option value="rep">Representative</option>
                          <option value="manager">Manager</option>
                        </Select>
                      </Field>
                    </div>
                    <Button type="submit" variant="primary" loading={createInvite.isPending}>
                      Send Invite
                    </Button>
                  </form>
                </div>
              )}

              {invites?.data?.items && invites.data.items.filter((inv) => !inv.used).length > 0 && (
                <div className="border-t border-line">
                  <div className="rule bg-paper/20 px-5 py-2.5">
                    <h3 className="label-eyebrow">Pending Invites</h3>
                  </div>
                  <ul>
                    {invites.data.items
                      .filter((inv) => !inv.used)
                      .map((inv) => {
                        const inviteUrl = `${window.location.origin}/register?token=${inv.token}`;
                        const isCopied = copiedId === inv._id;
                        return (
                          <li
                            key={inv._id}
                            className="flex items-center justify-between border-b border-line px-5 py-2.5 last:border-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-ink">{inv.email}</p>
                              <p className="text-[10px] text-ink-faint mt-0.5 capitalize">Role: {inv.role}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(inviteUrl);
                                setCopiedId(inv._id);
                                toast.success('Invite link copied to clipboard');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5 text-pine mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                              {isCopied ? 'Copied' : 'Copy link'}
                            </Button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

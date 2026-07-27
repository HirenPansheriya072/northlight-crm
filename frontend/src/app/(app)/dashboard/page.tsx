'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useDashboard } from '@/lib/queries';
import { useSession } from '@/hooks/use-session';
import { cn, formatMoney, relativeTime, stageTone } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { TaskRow } from '@/components/task-row';

const CHART_COLORS = ['#1F6F5C', '#31607F', '#A9761F', '#5A5F6B', '#A73A2E'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useDashboard();

  const firstName = session?.user.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader eyebrow="Today" title="Dashboard" />
        <div className="grid gap-4 p-5 md:grid-cols-4 lg:p-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const { cards, stages, months, lostReasons = [], tasksDueToday, activity, currency } = data;
  const stageData = stages.map((s) => ({ name: s.name, value: s.value, count: s.count }));
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  return (
    <div className="h-screen overflow-y-auto scroll-thin">
      <PageHeader eyebrow={greeting + (firstName ? `, ${firstName}` : '')} title="Dashboard" />

      <div className="space-y-5 p-5 lg:p-7">
        {/* Four numbers a small business owner actually checks in the morning. */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Open pipeline"
            value={formatMoney(cards.openValue, currency)}
            sub={`${cards.openCount} deal${cards.openCount === 1 ? '' : 's'} in play`}
          />
          <Stat
            label="Won this month"
            value={formatMoney(cards.wonValue, currency)}
            sub={`${cards.wonCount} closed`}
            tone="pine"
          />
          <Stat
            label="Win rate"
            value={cards.winRate === null ? '—' : `${cards.winRate}%`}
            sub={cards.winRate === null ? 'Nothing closed yet this month' : 'Of deals closed this month'}
          />
          <Stat
            label="Overdue follow-ups"
            value={String(cards.overdueCount)}
            sub={cards.overdueCount > 0 ? 'Someone is waiting on you' : 'All caught up'}
            tone={cards.overdueCount > 0 ? 'clay' : undefined}
            href="/tasks"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="label-eyebrow">Value by stage</h2>
              <Link href="/deals" className="text-[12px] font-medium text-pine hover:underline">
                Open the board
              </Link>
            </div>

            {stageData.every((s) => s.value === 0) ? (
              <EmptyState
                className="mt-4 border-0 py-8"
                title="Nothing in the pipeline"
                body="Add a deal and this fills in."
              />
            ) : (
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E3E1DA" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6E6A62' }}
                      axisLine={{ stroke: '#E3E1DA' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9C978D', fontFamily: 'var(--font-mono)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatMoney(v, currency, true)}
                    />
                    <Tooltip
                      cursor={{ fill: '#F5F4F0' }}
                      contentStyle={{
                        borderRadius: 6,
                        border: '1px solid #E3E1DA',
                        fontSize: 12,
                        fontFamily: 'var(--font-body)',
                        boxShadow: '0 8px 24px -8px rgba(22,24,29,0.18)',
                      }}
                      formatter={(value: number, _n, item) => [
                        `${formatMoney(value, currency)} · ${item.payload.count} deals`,
                        'Open value',
                      ]}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={54}>
                      {stageData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="space-y-5">
            <section className="card p-5">
              <h2 className="label-eyebrow">Won, last 6 months</h2>
              {/* A sparkline-style ledger strip: six bars, mono labels, no chart chrome needed. */}
              <ul className="mt-4 space-y-2.5">
                {months.map((m) => (
                  <li key={m.label} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                      {m.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-pine transition-[width] duration-700"
                        style={{ width: `${(m.value / maxMonth) * 100}%` }}
                      />
                    </span>
                    <span className="tnum w-16 shrink-0 text-right font-mono text-[11px] text-ink-muted">
                      {m.value ? formatMoney(m.value, currency, true) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5">
              <h2 className="label-eyebrow">Reasons deals were lost</h2>
              {lostReasons.length === 0 ? (
                <p className="mt-4 text-[13px] text-ink-faint">No deals lost yet. Excellent work.</p>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {lostReasons.map((lr) => {
                    const maxCount = Math.max(...lostReasons.map((l) => l.count), 1);
                    return (
                      <li key={lr.category} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 font-medium text-[12px] text-ink">
                          {lr.category || 'Other'}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full bg-clay transition-[width] duration-700"
                            style={{ width: `${(lr.count / maxCount) * 100}%` }}
                          />
                        </span>
                        <span className="tnum w-16 shrink-0 text-right font-mono text-[11px] text-ink-muted">
                          {lr.count} deal{lr.count === 1 ? '' : 's'} ({formatMoney(lr.value, currency, true)})
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card overflow-hidden">
            <div className="rule flex items-center justify-between px-4 py-3">
              <h2 className="label-eyebrow">Due today</h2>
              <Link href="/tasks" className="text-[12px] font-medium text-pine hover:underline">
                All follow-ups
              </Link>
            </div>
            {tasksDueToday.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-ink-faint">
                Nothing due today. Nice place to be.
              </p>
            ) : (
              <ul>
                {tasksDueToday.map((task) => (
                  <TaskRow key={task._id} task={task} showDelete={false} />
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="rule px-4 py-3">
              <h2 className="label-eyebrow">Recent activity</h2>
            </div>
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-ink-faint">Nothing has happened yet.</p>
            ) : (
              <ul className="max-h-[280px] overflow-y-auto scroll-thin">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 last:border-0">
                    <Avatar name={a.actor?.name} color={a.actor?.avatarColor} size="xs" />
                    <p className="min-w-0 flex-1 truncate text-[12px] text-ink-muted">
                      <span className="font-medium text-ink">{a.actor?.name || 'Someone'}</span> {a.verb}
                      {a.meta?.title ? (
                        <span className="text-ink"> {String(a.meta.title)}</span>
                      ) : null}
                      {a.meta?.stage && a.verb === 'moved deal' ? (
                        <span className="text-ink-faint"> to {String(a.meta.stage)}</span>
                      ) : null}
                    </p>
                    <span className="tnum shrink-0 font-mono text-[10px] text-ink-faint">
                      {relativeTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'pine' | 'clay';
  href?: string;
}) {
  const inner = (
    <div className="card group p-4 transition-shadow hover:shadow-lift">
      <p className="label-eyebrow flex items-center gap-1">
        {label}
        {href ? <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /> : null}
      </p>
      <p
        className={cn(
          'tnum mt-2 font-mono text-[26px] font-medium leading-none tracking-tight',
          tone === 'pine' && 'text-pine',
          tone === 'clay' && 'text-clay'
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-ink-faint">{sub}</p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Columns3, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown';
import { NotificationCenter } from '@/components/notification-center';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deals', label: 'Pipeline', icon: Columns3 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/tasks', label: 'Follow-ups', icon: CheckSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await api.post('/auth/logout');
    qc.clear();
    router.push('/login');
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors',
              active ? 'bg-pine-soft text-pine-dark' : 'text-ink-muted hover:bg-line/50 hover:text-ink'
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-pine' : 'text-ink-faint')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail */}
      <aside className="hidden w-[228px] shrink-0 flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <div className="flex items-center gap-2 px-2.5 pb-5">
          <span className="h-5 w-5 rounded-sm bg-pine" />
          <span className="font-display text-sm font-semibold tracking-tight">
            {data?.org?.name || 'Northlight'}
          </span>
        </div>
        {nav}
        <div className="mt-auto border-t border-line pt-3 flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <UserMenu name={data?.user.name} email={data?.user.email} color={data?.user.avatarColor} role={data?.user.role} onSignOut={signOut} />
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/25" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[240px] animate-slide-up border-r border-line bg-surface px-3 py-4">
            <div className="flex items-center justify-between px-2.5 pb-5">
              <span className="font-display text-sm font-semibold">{data?.org?.name || 'Northlight'}</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-semibold">{data?.org?.name || 'Northlight'}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationCenter />
            <UserMenu name={data?.user.name} email={data?.user.email} color={data?.user.avatarColor} role={data?.user.role} onSignOut={signOut} compact />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({
  name,
  email,
  color,
  role,
  onSignOut,
  compact,
}: {
  name?: string;
  email?: string;
  color?: string;
  role?: string;
  onSignOut: () => void;
  compact?: boolean;
}) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-line/50',
            compact && 'w-auto'
          )}
        >
          <Avatar name={name} color={color} size="sm" />
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{name || '—'}</span>
              <span className="block truncate text-[11px] capitalize text-ink-faint">{role}</span>
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent align={compact ? 'end' : 'start'}>
        <DropdownLabel>{email}</DropdownLabel>
        <DropdownSeparator />
        <DropdownItem onSelect={onSignOut}>
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

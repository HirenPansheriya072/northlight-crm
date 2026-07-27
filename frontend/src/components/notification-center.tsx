'use client';

import { Bell, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown';

export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleSelect(id: string, link?: string) {
    markRead.mutate(id);
    if (link) {
      router.push(link);
    }
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-line/50 transition-colors focus:outline-none">
          <Bell className="h-4.5 w-4.5 text-ink-muted hover:text-ink" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-clay animate-pulse" />
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[300px] max-h-[380px] overflow-y-auto scroll-thin">
        <div className="flex items-center justify-between px-3 py-1.5">
          <DropdownLabel>Notifications</DropdownLabel>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-[10px] font-medium text-pine hover:underline flex items-center gap-0.5"
            >
              <Check className="h-2.5 w-2.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownSeparator />

        {notifications.length === 0 ? (
          <p className="px-4 py-5 text-center text-[12px] text-ink-faint">
            All caught up! No notifications.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {notifications.map((n) => (
              <DropdownItem
                key={n._id}
                onSelect={() => handleSelect(n._id, n.link)}
                className={`flex flex-col items-start gap-1 p-3 text-left transition-colors cursor-pointer ${
                  !n.read ? 'bg-pine-soft/20 hover:bg-pine-soft/30' : 'hover:bg-line/30'
                }`}
              >
                <div className="flex w-full items-start justify-between gap-1.5">
                  <span className={`text-[12px] font-semibold text-ink ${!n.read ? 'text-pine-dark' : ''}`}>
                    {n.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-ink-faint mt-0.5">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] leading-snug text-ink-muted w-full break-words">
                  {n.body}
                </p>
                {n.link && (
                  <span className="mt-0.5 flex items-center gap-0.5 text-[9px] text-pine font-medium">
                    View <ExternalLink className="h-2 w-2" />
                  </span>
                )}
              </DropdownItem>
            ))}
          </div>
        )}
      </DropdownContent>
    </Dropdown>
  );
}

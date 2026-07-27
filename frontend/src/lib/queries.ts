'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './api';
import type {
  BoardResponse,
  Contact,
  DashboardSummary,
  Deal,
  Note,
  Stage,
  Task,
  User,
  Invitation,
  Attachment,
  Interaction,
  Playbook,
  Notification,
  AuditLog,
} from './types';

export const keys = {
  board: ['board'] as const,
  contacts: (params: string) => ['contacts', params] as const,
  contact: (id: string) => ['contact', id] as const,
  deal: (id: string) => ['deal', id] as const,
  tasks: (filter: string) => ['tasks', filter] as const,
  dashboard: ['dashboard'] as const,
  users: ['users'] as const,
  stages: ['stages'] as const,
  playbooks: ['playbooks'] as const,
  invites: ['invites'] as const,
  attachments: (entityType: string, entityId: string) => ['attachments', entityType, entityId] as const,
  interactions: (entityType: string, entityId: string) => ['interactions', entityType, entityId] as const,
  notifications: ['notifications'] as const,
  auditLogs: ['auditLogs'] as const,
};

/* ---------- board ---------- */

export function useBoard() {
  return useQuery({ queryKey: keys.board, queryFn: () => api.get<BoardResponse>('/deals/board') });
}

/* ---------- contacts ---------- */

export function useContacts(params: { q?: string; page?: number; source?: string; ownerId?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.source) search.set('source', params.source);
  if (params.ownerId) search.set('ownerId', params.ownerId);
  search.set('page', String(params.page || 1));
  search.set('limit', '15');
  const qs = search.toString();

  return useQuery({
    queryKey: keys.contacts(qs),
    queryFn: () =>
      api.get<{ items: Contact[]; total: number; page: number; pages: number }>(`/contacts?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: keys.contact(id),
    queryFn: () =>
      api.get<{ contact: Contact; deals: Deal[]; notes: Note[]; tasks: Task[]; interactions: Interaction[] }>(`/contacts/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveContact(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Contact>) =>
      id ? api.patch<{ contact: Contact }>(`/contacts/${id}`, body) : api.post<{ contact: Contact }>('/contacts', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      if (id) qc.invalidateQueries({ queryKey: keys.contact(id) });
      qc.invalidateQueries({ queryKey: keys.dashboard });
      toast.success(id ? 'Contact updated' : 'Contact added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: keys.board });
      toast.success('Contact deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- deals ---------- */

export function useSaveDeal(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Deal>) =>
      id ? api.patch<{ deal: Deal }>(`/deals/${id}`, body) : api.post<{ deal: Deal }>('/deals', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.board });
      qc.invalidateQueries({ queryKey: keys.dashboard });
      toast.success(id ? 'Deal updated' : 'Deal added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.board });
      qc.invalidateQueries({ queryKey: keys.dashboard });
      toast.success('Deal deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- notes ---------- */

export function useAddNote(invalidate: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; entityType: 'contact' | 'deal'; entityId: string }) =>
      api.post<{ note: Note }>('/notes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidate }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNote(invalidate: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidate }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- tasks ---------- */

export function useTasks(filter: string) {
  return useQuery({
    queryKey: keys.tasks(filter),
    queryFn: () =>
      api.get<{ items: Task[]; counts: { today: number; overdue: number; upcoming: number } }>(
        `/tasks?filter=${filter}`
      ),
  });
}

export function useSaveTask(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Task>) =>
      id ? api.patch<{ task: Task }>(`/tasks/${id}`, body) : api.post<{ task: Task }>('/tasks', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.patch<{ task: Task }>(`/tasks/${id}`, { done }),
    // Ticking a checkbox has to feel instant, so the cache moves before the server answers.
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshots = qc.getQueriesData<{ items: Task[] }>({ queryKey: ['tasks'] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          items: data.items.map((t) => (t._id === id ? { ...t, done } : t)),
        });
      });
      return { snapshots };
    },
    onError: (e: Error, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Follow-up removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- misc ---------- */

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });
}

export function useTeam() {
  return useQuery({
    queryKey: keys.users,
    queryFn: () => api.get<{ items: User[] }>('/users'),
    staleTime: 5 * 60_000,
  });
}

export function useSaveStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stages: { _id?: string; name: string; color?: string; isWon?: boolean }[]) =>
      api.put<{ stages: Stage[] }>('/stages', { stages }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] });
      qc.invalidateQueries({ queryKey: keys.board });
      toast.success('Pipeline saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePlaybooks() {
  return useQuery({
    queryKey: keys.playbooks,
    queryFn: () => api.get<{ items: Playbook[] }>('/playbooks'),
  });
}

export function useSavePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Playbook>) => api.post<{ playbook: Playbook }>('/playbooks', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.playbooks });
      toast.success('Playbook saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/playbooks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.playbooks });
      toast.success('Playbook deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInvites() {
  return useQuery({
    queryKey: keys.invites,
    queryFn: () => api.get<{ items: Invitation[] }>('/users/invites'),
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: string }) =>
      api.post<{ invite: Invitation }>('/users/invites', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.invites });
      toast.success('Invitation sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAttachments(entityType: string, entityId: string) {
  return useQuery({
    queryKey: keys.attachments(entityType, entityId),
    queryFn: () => api.get<{ items: Attachment[] }>(`/attachments/${entityType}/${entityId}`),
    enabled: Boolean(entityId),
  });
}

export function useDeleteAttachment(entityType: string, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/attachments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.attachments(entityType, entityId) });
      toast.success('File deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInteractions(entityType: string, entityId: string) {
  return useQuery({
    queryKey: keys.interactions(entityType, entityId),
    queryFn: () => api.get<{ items: Interaction[] }>(`/interactions/${entityType}/${entityId}`),
    enabled: Boolean(entityId),
  });
}

export function useCreateInteraction(entityType: string, entityId: string, invalidateKeys: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Interaction>) => api.post<{ interaction: Interaction }>('/interactions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.interactions(entityType, entityId) });
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      qc.invalidateQueries({ queryKey: keys.dashboard });
      toast.success('Interaction logged');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => api.get<{ items: Notification[] }>('/notifications'),
    refetchInterval: 15000, // Poll every 15 seconds for real-time feel
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put<{ notification: Notification }>(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: keys.auditLogs,
    queryFn: () => api.get<{ items: AuditLog[] }>('/audit-logs'),
  });
}

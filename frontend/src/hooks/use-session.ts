'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Org, User } from '@/lib/types';

export interface Session {
  user: User;
  org: Org;
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => api.get<Session>('/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

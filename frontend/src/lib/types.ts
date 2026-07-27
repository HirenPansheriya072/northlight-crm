export type Role = 'owner' | 'manager' | 'rep';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  orgId?: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  isWon?: boolean;
}

export interface Org {
  id: string;
  name: string;
  currency: string;
  pipelineStages: Stage[];
}

export interface Ref {
  _id: string;
  name?: string;
  title?: string;
  company?: string;
  avatarColor?: string;
  email?: string;
}

export interface Contact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source: string;
  tags: string[];
  ownerId?: Ref | string;
  createdAt: string;
}

export interface Deal {
  _id: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  order: number;
  contactId?: Ref | string;
  ownerId?: Ref | string;
  expectedCloseDate?: string;
  status: 'open' | 'won' | 'lost';
  lostReasonCategory?: string;
  lostReason?: string;
  createdAt: string;
}

export interface Invitation {
  _id: string;
  orgId: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface Attachment {
  _id: string;
  orgId: string;
  entityType: 'contact' | 'deal';
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: Ref;
  createdAt: string;
}

export interface Interaction {
  _id: string;
  orgId: string;
  entityType: 'contact' | 'deal';
  entityId: string;
  type: 'call' | 'email' | 'meeting' | 'sms';
  notes: string;
  outcome: 'connected' | 'no-answer' | 'left-voicemail' | 'completed';
  duration: number;
  performedBy: Ref;
  createdAt: string;
}

export interface PlaybookTask {
  title: string;
  dueDaysAfter: number;
}

export interface Playbook {
  _id: string;
  orgId: string;
  name: string;
  triggerType: 'contact_created' | 'deal_stage_entered';
  triggerValue: string;
  tasks: PlaybookTask[];
  createdAt: string;
}

export interface Column extends Stage {
  total: number;
  cards: Deal[];
}

export interface BoardResponse {
  columns: Column[];
  pipelineTotal: number;
  currency: string;
}

export interface Note {
  _id: string;
  body: string;
  entityType: 'contact' | 'deal';
  entityId: string;
  authorId?: Ref;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  dueDate: string;
  done: boolean;
  doneAt?: string;
  assigneeId?: Ref | string;
  entityType: 'contact' | 'deal' | 'none';
  entityId?: string;
  entityLabel?: string | null;
}

export interface DashboardSummary {
  currency: string;
  cards: {
    openValue: number;
    openCount: number;
    wonValue: number;
    wonCount: number;
    contactCount: number;
    overdueCount: number;
    winRate: number | null;
  };
  stages: { stageId: string; name: string; value: number; count: number }[];
  months: { label: string; value: number; count: number }[];
  lostReasons: { category: string; count: number; value: number }[];
  tasksDueToday: Task[];
  activity: {
    id: string;
    verb: string;
    entityType: string;
    entityId: string;
    meta: Record<string, unknown>;
    createdAt: string;
    actor: { name: string; avatarColor: string } | null;
  }[];
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  orgId: string;
  actorId?: Ref;
  verb: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

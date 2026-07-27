'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  FileText,
  CheckCircle,
} from 'lucide-react';
import type { Note, Interaction, Ref } from '@/lib/types';
import { relativeTime } from '@/lib/utils';
import { useAddNote, useDeleteNote, useCreateInteraction } from '@/lib/queries';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea, Input, Select } from '@/components/ui/input';

export function NotesTimeline({
  notes = [],
  interactions = [],
  entityType,
  entityId,
  invalidate,
}: {
  notes: Note[];
  interactions?: Interaction[];
  entityType: 'contact' | 'deal';
  entityId: string;
  invalidate: readonly unknown[];
}) {
  const qc = useQueryClient();
  const [activeMode, setActiveMode] = useState<'note' | 'call' | 'email' | 'meeting' | 'sms'>('note');
  const [body, setBody] = useState('');
  const [duration, setDuration] = useState('0');
  const [outcome, setOutcome] = useState<Interaction['outcome']>('completed');

  const addNote = useAddNote(invalidate);
  const removeNote = useDeleteNote(invalidate);
  const addInteraction = useCreateInteraction(entityType, entityId, invalidate);

  function submit() {
    if (!body.trim()) return;

    if (activeMode === 'note') {
      addNote.mutate(
        { body: body.trim(), entityType, entityId },
        { onSuccess: () => setBody('') }
      );
    } else {
      addInteraction.mutate(
        {
          entityType,
          entityId,
          type: activeMode as Interaction['type'],
          notes: body.trim(),
          outcome: activeMode === 'call' ? outcome : 'completed',
          duration: Number(duration || 0),
        },
        {
          onSuccess: () => {
            setBody('');
            setDuration('0');
            setOutcome('connected');
          },
        }
      );
    }
  }

  // Combine and sort notes + interactions chronologically
  const timelineItems = [
    ...notes.map((n) => ({ ...n, timelineType: 'note' as const })),
    ...interactions.map((i) => ({ ...i, timelineType: 'interaction' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      {/* Logger Mode Selector */}
      <div className="flex border-b border-line mb-3 gap-1 overflow-x-auto pb-1 scroll-thin">
        {[
          { mode: 'note', label: 'Note', icon: FileText },
          { mode: 'call', label: 'Call', icon: Phone },
          { mode: 'email', label: 'Email', icon: Mail },
          { mode: 'meeting', label: 'Meeting', icon: Calendar },
          { mode: 'sms', label: 'SMS', icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => {
                setActiveMode(item.mode as any);
                setOutcome((item.mode === 'call' ? 'connected' : 'completed') as Interaction['outcome']);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium border border-transparent transition-colors ${
                activeMode === item.mode
                  ? 'bg-pine-soft text-pine font-semibold border-pine/10'
                  : 'text-ink-muted hover:bg-paper hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          activeMode === 'note'
            ? 'Write notes about this contact/deal...'
            : `Write summary details about this ${activeMode}...`
        }
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
        }}
      />

      {activeMode !== 'note' && (
        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-muted shrink-0 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Duration:
            </span>
            <Input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Min"
              className="w-[80px] font-mono text-center"
            />
            <span className="text-[11px] text-ink-faint">min</span>
          </div>

          {activeMode === 'call' && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted shrink-0">Outcome:</span>
              <Select value={outcome} onChange={(e) => setOutcome(e.target.value as Interaction['outcome'])}>
                <option value="connected">Connected</option>
                <option value="no-answer">No Answer</option>
                <option value="left-voicemail">Left Voicemail</option>
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-faint">⌘ + Enter to save</span>
        <Button
          size="sm"
          variant="primary"
          onClick={submit}
          loading={addNote.isPending || addInteraction.isPending}
          disabled={!body.trim()}
        >
          {activeMode === 'note' ? 'Add note' : `Log ${activeMode}`}
        </Button>
      </div>

      {timelineItems.length > 0 ? (
        <ol className="mt-5 space-y-4">
          {timelineItems.map((item) => {
            const isNote = item.timelineType === 'note';
            const author = isNote ? (item as Note).authorId : (item as Interaction).performedBy;

            return (
              <li key={item._id} className="group relative flex gap-3">
                <div className="flex flex-col items-center">
                  <Avatar name={author?.name} color={author?.avatarColor} size="sm" />
                  <span className="mt-1 w-px flex-1 bg-line group-last:hidden" />
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-ink">
                      {author?.name || 'Someone'}
                    </span>
                    {!isNote && (
                      <span className="inline-flex items-center gap-1 rounded bg-pine-soft px-1.5 py-0.5 text-[10px] font-medium text-pine capitalize">
                        {item.timelineType === 'interaction' ? (
                          <>
                            {item.type === 'call' && <Phone className="h-2.5 w-2.5 inline" />}
                            {item.type === 'email' && <Mail className="h-2.5 w-2.5 inline" />}
                            {item.type === 'meeting' && <Calendar className="h-2.5 w-2.5 inline" />}
                            {item.type === 'sms' && <MessageSquare className="h-2.5 w-2.5 inline" />}
                            {item.type} ({(item as Interaction).duration}m)
                          </>
                        ) : null}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-ink-faint">
                      {relativeTime(item.createdAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                    {isNote ? (item as Note).body : (item as Interaction).notes}
                  </p>
                  {!isNote && (item as Interaction).type === 'call' && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
                      <CheckCircle className="h-3 w-3 text-pine" /> Outcome: {(item as Interaction).outcome}
                    </p>
                  )}
                </div>
                {isNote && (
                  <button
                    onClick={() => removeNote.mutate(item._id)}
                    className="h-6 w-6 shrink-0 rounded text-ink-faint opacity-0 transition-opacity hover:bg-clay-soft hover:text-clay focus:opacity-100 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-5 text-[13px] text-ink-faint">No history logged yet.</p>
      )}
    </div>
  );
}

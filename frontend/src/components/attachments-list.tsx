'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Paperclip, Download, Trash2, Loader2, FileText } from 'lucide-react';
import { useAttachments, useDeleteAttachment, keys } from '@/lib/queries';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AttachmentsList({
  entityType,
  entityId,
}: {
  entityType: 'contact' | 'deal';
  entityId: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useAttachments(entityType, entityId);
  const remove = useDeleteAttachment(entityType, entityId);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      const res = await fetch(`${api.baseUrl}/attachments`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }
      qc.invalidateQueries({ queryKey: keys.attachments(entityType, entityId) });
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  if (isLoading) {
    return <p className="text-[13px] text-ink-faint">Loading files...</p>;
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink shadow-sm hover:bg-paper transition-colors">
          <Paperclip className="h-3.5 w-3.5" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-pine" />}
      </div>

      {data?.items.length === 0 ? (
        <p className="text-[12px] text-ink-faint">No files uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-surface">
          {data?.items.map((file) => (
            <li
              key={file._id}
              className="flex items-center justify-between px-3 py-2.5 text-[12px]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{file.fileName}</p>
                  <p className="text-[10px] text-ink-faint">
                    {formatBytes(file.fileSize)} · uploaded by {file.uploadedBy?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Download file"
                >
                  <a
                    href={`${api.baseUrl}${file.fileUrl}`}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-3.5 w-3.5 text-pine" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  loading={remove.isPending}
                  onClick={() => remove.mutate(file._id)}
                  aria-label="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5 text-clay" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

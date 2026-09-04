import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Modal({ open, onClose, title, description, children, size = 'md' }: { open: boolean; onClose: () => void; title?: string; description?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const sizes: Record<string, string> = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-xl border border-[#F0E6E2] max-h-[90vh] flex flex-col animate-in', sizes[size])}>
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-[#F5EEEA] flex items-start justify-between gap-4">
            <div>
              {title && <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>}
              {description && <p className="text-sm text-[#6B6B6B] mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F8F5F3] text-[#9A9A9A]"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="overflow-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmText = 'Confirm', variant = 'danger', loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title?: string; description?: string; confirmText?: string; variant?: 'danger' | 'primary'; loading?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

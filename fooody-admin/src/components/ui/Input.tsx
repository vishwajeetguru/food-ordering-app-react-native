import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, id, ...props }, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-[#1A1A1A]">{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={cn('w-full h-11 px-3.5 rounded-xl border bg-white text-sm placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 transition', error ? 'border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]' : 'border-[#F0E6E2] focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D]', className)}
        {...props}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#9A9A9A]">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-[#1A1A1A]">{label}</label>}
        <textarea
          id={inputId}
          ref={ref}
          className={cn('w-full min-h-[96px] px-3.5 py-3 rounded-xl border bg-white text-sm placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 transition resize-y', error ? 'border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#F0E6E2] focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D]', className)}
          {...props}
        />
        {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export function Select({ label, error, children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-[#1A1A1A]">{label}</label>}
      <select
        className={cn('w-full h-11 px-3.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D] transition', error ? 'border-[#DC2626]' : 'border-[#F0E6E2]', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  );
}

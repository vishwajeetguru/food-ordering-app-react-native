import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary: 'bg-[#FF5A3D] hover:bg-[#E94A2E] text-white shadow-sm',
  secondary: 'bg-white border border-[#F0E6E2] hover:bg-[#F8F5F3] text-[#1A1A1A]',
  ghost: 'hover:bg-[#F8F5F3] text-[#6B6B6B] hover:text-[#1A1A1A]',
  danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
};

const sizeCls: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-11 px-5 text-sm rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-xl',
};

export function Button({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed', variantCls[variant], sizeCls[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'; className?: string }) {
  const map: Record<string, string> = {
    default: 'bg-[#FFF2EF] text-[#FF5A3D] border border-[#FFE9E3]',
    success: 'bg-[#E8F5E8] text-[#16A34A] border border-[#C6EBC6]',
    warning: 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]',
    danger: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
    info: 'bg-[#EFF6FF] text-[#0284C7] border border-[#DBEAFE]',
    neutral: 'bg-[#F8F5F3] text-[#6B6B6B] border border-[#F0E6E2]',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', map[variant], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    normalized === 'delivered' || normalized === 'active' ? 'success' :
    normalized === 'pending' ? 'warning' :
    normalized === 'preparing' || normalized === 'out_for_delivery' ? 'info' :
    normalized === 'cancelled' || normalized === 'disabled' ? 'danger' : 'neutral';
  const label = status.replace(/_/g, ' ');
  return <Badge variant={variant as any}>{label}</Badge>;
}

import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-auto rounded-2xl border border-[#F0E6E2] bg-white"><table className={cn('w-full text-sm', className)} {...props} /></div>;
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead className="bg-[#FFFDFB] border-b border-[#F0E6E2]" {...props} />; }
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody className="divide-y divide-[#F5EEEA]" {...props} />; }
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className="hover:bg-[#FFFDFB] transition" {...props} />; }
export function TH({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 text-left text-xs font-semibold tracking-wider text-[#6B6B6B] uppercase', className)} {...props} />;
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-sm text-[#1A1A1A]', className)} {...props} />;
}
export function TH2(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[#6B6B6B] uppercase" {...props} />;
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

const statuses: Order['status'][] = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function Orders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewing, setViewing] = useState<Order | null>(null);

  const { data: orders = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['orders-admin'],
    queryFn: async (): Promise<Order[]> => {
      const res = await api.get('/admin/orders');
      const list = res.data?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 0,
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (dateFilter && !(o.createdAt || '').startsWith(dateFilter)) return false;
      return true;
    });
  }, [orders, search, statusFilter, dateFilter]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data.data),
    onSuccess: async () => {
      toast.success('Status updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders-admin'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
      setViewing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Orders</h1>
        <p className="text-sm text-[#6B6B6B]">{filtered.length} orders • {orders.filter((o) => o.status === 'pending').length} pending</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order ID…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#F0E6E2] bg-[#FFFDFB] text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-[#F0E6E2] bg-white px-3 text-sm">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-10 rounded-xl border border-[#F0E6E2] bg-white px-3 text-sm" />
          {(search || statusFilter || dateFilter) && <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); }}>Clear</Button>}
        </div>
      </Card>

      {isLoading ? <TableSkeleton /> : (
        <>
          <div className="hidden md:block">
            <Table>
              <THead><TR><TH>Order</TH><TH>Customer</TH><TH>Items</TH><TH>Total</TH><TH>Status</TH><TH>Date</TH><TH className="text-right">Action</TH></TR></THead>
              <TBody>
                {filtered.length === 0 ? <TR><TD colSpan={7} className="text-center py-10 text-[#9A9A9A]">No orders</TD></TR> :
                  filtered.map((o) => (
                    <TR key={o.id}>
                      <TD><div className="font-mono text-xs font-semibold">{o.orderNumber}</div><div className="text-[11px] text-[#9A9A9A]">{o.id.slice(0, 8)}</div></TD>
                      <TD><div className="text-xs">{o.userId.slice(0, 10)}…</div></TD>
                      <TD><div className="text-sm">{o.items.length} items</div><div className="text-xs text-[#9A9A9A] truncate max-w-[180px]">{o.items.map((i) => i.name).join(', ')}</div></TD>
                      <TD><div className="font-bold">{formatCurrency(o.total)}</div><div className="text-xs text-[#9A9A9A]">{o.paymentMethod}</div></TD>
                      <TD><StatusBadge status={o.status} /></TD>
                      <TD><div className="text-xs">{formatDate(o.createdAt)}</div></TD>
                      <TD><div className="flex justify-end gap-1"><Button size="sm" variant="secondary" onClick={() => setViewing(o)}><Eye className="h-3.5 w-3.5" /> View</Button></div></TD>
                    </TR>
                  ))}
              </TBody>
            </Table>
          </div>

          <div className="grid md:hidden gap-3">
            {filtered.map((o) => (
              <Card key={o.id} className="p-3">
                <div className="flex items-center justify-between"><span className="font-mono text-xs font-bold">{o.orderNumber}</span><StatusBadge status={o.status} /></div>
                <div className="text-sm mt-1">{o.items.length} items • {formatCurrency(o.total)}</div>
                <div className="text-xs text-[#9A9A9A]">{formatDate(o.createdAt)}</div>
                <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => setViewing(o)}>View details</Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.orderNumber}`} description={viewing ? `Placed ${formatDate(viewing.createdAt, 'long')}` : undefined} size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-[#9A9A9A]">Customer</span><div className="font-mono text-xs">{viewing.userId}</div></div>
              <div><span className="text-[#9A9A9A]">Payment</span><div className="capitalize">{viewing.paymentMethod}</div></div>
              <div><span className="text-[#9A9A9A]">Status</span><div className="mt-1"><StatusBadge status={viewing.status} /></div></div>
              <div><span className="text-[#9A9A9A]">Total</span><div className="font-bold text-lg">{formatCurrency(viewing.total)}</div></div>
            </div>

            <div className="rounded-xl border border-[#F0E6E2] divide-y">
              {viewing.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  {it.image && <img src={it.image} alt={it.name} className="h-10 w-10 rounded-lg object-cover border border-[#F0E6E2]" />}
                  <div className="flex-1"><div className="text-sm font-medium">{it.name}</div><div className="text-xs text-[#9A9A9A]">Qty {it.quantity} × {formatCurrency(it.price)}</div></div>
                  <div className="font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#F8F5F3] rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Subtotal</span><span>{formatCurrency(viewing.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Delivery</span><span>{formatCurrency(viewing.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Tax</span><span>{formatCurrency(viewing.tax)}</span></div>
              {viewing.discount ? <div className="flex justify-between text-[#16A34A]"><span>Discount</span><span>-{formatCurrency(viewing.discount)}</span></div> : null}
              <div className="flex justify-between font-bold border-t border-[#EDE9E6] pt-1.5"><span>Total</span><span>{formatCurrency(viewing.total)}</span></div>
            </div>

            {viewing.address && <div className="rounded-xl border border-[#F0E6E2] p-3 text-sm"><div className="font-semibold">Delivery address</div><div className="text-[#6B6B6B] mt-1">{typeof viewing.address === 'string' ? viewing.address : viewing.address.address || JSON.stringify(viewing.address)}</div></div>}

            <div>
              <label className="text-sm font-medium">Update status</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {statuses.map((s) => (
                  <button key={s} onClick={() => updateStatus.mutate({ id: viewing.id, status: s })} disabled={viewing.status === s || updateStatus.isPending} className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${viewing.status === s ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#F0E6E2] hover:border-[#EDE9E6]'}`}>{s.replace(/_/g, ' ')}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

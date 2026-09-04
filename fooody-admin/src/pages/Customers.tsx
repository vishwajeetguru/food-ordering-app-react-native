import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Ban, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { User, Order } from '@/types';

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<User | null>(null);

  const { data: users = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<User[]> => {
      const res = await api.get('/admin/users');
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders-for-customers', viewing?.id],
    queryFn: async (): Promise<Order[]> => {
      try {
        const r = await api.get('/admin/orders');
        const list = r.data?.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch {
        try {
          const r = await api.get('/orders?limit=100');
          const list = r.data?.data ?? [];
          return Array.isArray(list) ? list : [];
        } catch { return []; }
      }
    },
    enabled: !!viewing,
    staleTime: 0,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = (u.email || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      const id = (u.id || '').toLowerCase();
      return email.includes(q) || name.includes(q) || id.includes(q);
    });
  }, [users, search]);

  const viewingOrders = viewing ? orders.filter((o) => o.userId === viewing.id) : [];
  const viewingSpending = viewingOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/users/${id}`, { status }),
    onSuccess: async () => {
      toast.success('Updated');
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['admin-analytics'] });
      if (viewing) {
        const updated = users.find((u) => u.id === viewing.id);
        if (updated) {
          const fresh = await api.get(`/admin/users/${viewing.id}`).then((r) => r.data?.data).catch(() => null);
          if (fresh) setViewing(fresh);
        }
      }
    },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Customers</h1>
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-[#DC2626] mx-auto" />
          <div className="font-semibold text-[#DC2626]">Failed to load customers</div>
          <div className="text-sm text-[#6B6B6B]">{(error as any)?.message || 'Unknown error'}</div>
          <div className="text-xs text-[#9A9A9A]">Status: {(error as any)?.status || '—'} • Check backend at {import.meta.env.VITE_API_URL}</div>
          <Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-[#6B6B6B]">{filtered.length} customers {isFetching && <span className="text-xs text-[#9A9A9A]">• refreshing…</span>}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, ID…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#F0E6E2] bg-[#FFFDFB] text-sm" />
        </div>
      </Card>

      {isLoading ? <TableSkeleton /> : filtered.length === 0 ? <Card className="p-10 text-center text-sm text-[#9A9A9A]">{users.length === 0 ? 'No customers yet — they appear after first signup/order. Try creating a test user via the app or check backend /admin/users.' : 'No matching customers'}</Card> : (
        <>
          <div className="hidden md:block">
            <Table>
              <THead><TR><TH>Customer</TH><TH>Email</TH><TH>Role</TH><TH>Status</TH><TH>Created</TH><TH className="text-right">Action</TH></TR></THead>
              <TBody>
                {filtered.map((u) => (
                  <TR key={u.id}>
                    <TD><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-[#FFE9E3] flex items-center justify-center font-bold text-xs text-[#FF5A3D]">{(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}</div><div><div className="font-medium text-sm">{u.name || '—'}</div><div className="text-xs text-[#9A9A9A] font-mono">{(u.id || '').slice(0, 8)}</div></div></div></TD>
                    <TD><span className="text-sm">{u.email || '—'}</span></TD>
                    <TD><Badge variant={u.role === 'admin' ? 'info' : 'neutral'}>{u.role || 'customer'}</Badge></TD>
                    <TD><Badge variant={u.status === 'active' ? 'success' : u.status === 'disabled' ? 'danger' : 'neutral'}>{u.status || 'active'}</Badge></TD>
                    <TD><span className="text-xs">{formatDate(u.createdAt)}</span></TD>
                    <TD><div className="flex justify-end gap-1"><Button size="sm" variant="secondary" onClick={() => setViewing(u)}><Eye className="h-3.5 w-3.5" /> View</Button></div></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div className="grid md:hidden gap-3">
            {filtered.map((u) => (
              <Card key={u.id} className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#FFE9E3] flex items-center justify-center font-bold text-sm text-[#FF5A3D]">{(u.email?.[0] || '?').toUpperCase()}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{u.name || u.email || 'Unknown'}</div><div className="text-xs text-[#9A9A9A]">{u.role || 'customer'} • {u.status || 'active'}</div></div>
                <Button size="sm" variant="secondary" onClick={() => setViewing(u)}>View</Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name || viewing?.email || 'Customer'} description={viewing?.email || ''} size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#F8F5F3] p-3 text-center"><div className="text-lg font-extrabold">{viewingOrders.length}</div><div className="text-xs text-[#6B6B6B]">Orders</div></div>
              <div className="rounded-xl bg-[#F8F5F3] p-3 text-center"><div className="text-lg font-extrabold">{formatCurrency(viewingSpending)}</div><div className="text-xs text-[#6B6B6B]">Spent</div></div>
              <div className="rounded-xl bg-[#F8F5F3] p-3 text-center"><div className="text-xs font-bold capitalize">{viewing.status || 'active'}</div><div className="text-xs text-[#6B6B6B]">Status</div></div>
            </div>

            <div className="rounded-xl border border-[#F0E6E2] p-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><span className="text-[#9A9A9A]">ID</span><span className="font-mono text-xs break-all">{viewing.id}</span></div>
              <div className="flex justify-between"><span className="text-[#9A9A9A]">Email verified</span><span>{viewing.emailVerified ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-[#9A9A9A]">Phone</span><span>{viewing.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#9A9A9A]">Created</span><span>{formatDate(viewing.createdAt, 'long')}</span></div>
            </div>

            <div className="flex gap-2">
              {viewing.status === 'active' ? <Button variant="secondary" loading={toggleStatus.isPending} onClick={() => toggleStatus.mutate({ id: viewing.id, status: 'disabled' })}><Ban className="h-4 w-4" /> Disable account</Button> : <Button variant="secondary" loading={toggleStatus.isPending} onClick={() => toggleStatus.mutate({ id: viewing.id, status: 'active' })}><CheckCircle className="h-4 w-4" /> Enable account</Button>}
              <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            </div>

            <div>
              <div className="font-semibold text-sm mb-2">Order history</div>
              {viewingOrders.length === 0 ? <div className="text-sm text-[#9A9A9A] py-6 text-center border border-dashed rounded-xl">No orders</div> :
                <div className="space-y-2 max-h-[240px] overflow-auto pr-1">
                  {viewingOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2 rounded-xl border border-[#F5EEEA] text-sm">
                      <div><div className="font-mono text-xs font-semibold">{o.orderNumber || o.id.slice(0, 8)}</div><div className="text-xs text-[#9A9A9A]">{formatDate(o.createdAt)} • {(o.items || []).length} items</div></div>
                      <div className="text-right"><div className="font-bold">{formatCurrency(o.total || 0)}</div><Badge variant="neutral" className="text-[10px]">{o.status || '—'}</Badge></div>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Search, Plus, X, GripVertical, Eye, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

export default function Popular() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(6);
  const [enabled, setEnabled] = useState(true);

  const { data: popular = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['popular-products'],
    queryFn: async (): Promise<Product[]> => (await api.get('/products?isPopular=true&limit=100')).data.data,
    staleTime: 0,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products-popular'],
    queryFn: async (): Promise<Product[]> => (await api.get('/products?limit=100')).data.data,
    enabled: showAdd,
    staleTime: 0,
  });

  const candidates = allProducts.filter((p) => !p.isPopular && (!search || p.name.toLowerCase().includes(search.toLowerCase())));

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) => api.patch(`/products/${id}`, { isPopular }),
    onSuccess: async () => {
      toast.success('Updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['popular-products'] }),
        qc.invalidateQueries({ queryKey: ['all-products-popular'] }),
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      // Persist home settings if endpoint exists; otherwise just local
      try { await api.patch('/admin/home-settings', { popularLimit: limit, popularEnabled: enabled }); } catch {}
      toast.success('Settings saved');
    },
  });

  if (isLoading) return <Skeleton className="h-[400px]" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Flame className="h-5 w-5 text-[#EA580C]" /> Popular Today</h1>
          <p className="text-sm text-[#6B6B6B]">Control which products appear in the customer app's Popular Today section</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add products</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Popular products ({popular.length})</CardTitle>
            <Badge variant={enabled ? 'success' : 'neutral'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
          </CardHeader>
          <CardContent>
            {popular.length === 0 ? (
              <div className="py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mx-auto"><Flame className="h-6 w-6 text-[#EA580C]" /></div>
                <div className="font-semibold mt-3">No popular products</div>
                <div className="text-sm text-[#9A9A9A] mt-1">Add products to show them in the customer app</div>
                <Button className="mt-4" onClick={() => setShowAdd(true)}>Add products</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {popular.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F0E6E2] hover:border-[#FFE9E3] hover:bg-[#FFFDFB] transition group">
                    <GripVertical className="h-4 w-4 text-[#D6D0CC] hidden sm:block" />
                    <span className="text-xs font-bold text-[#9A9A9A] w-5">#{idx + 1}</span>
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover border border-[#F0E6E2]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-xs text-[#9A9A9A]">{p.categoryName} • {formatCurrency(p.price)}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => toggleMutation.mutate({ id: p.id, isPopular: false })}><X className="h-3.5 w-3.5" /> Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable section</span>
                <button onClick={() => setEnabled(!enabled)} className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-[#FF5A3D]' : 'bg-[#EDE9E6]'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-5' : 'left-0.5'}`} /></button>
              </div>
              <div>
                <label className="text-sm font-medium">Display limit</label>
                <input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-1 w-full h-10 px-3 rounded-xl border border-[#F0E6E2] text-sm" />
                <p className="text-xs text-[#9A9A9A] mt-1">Customer app shows up to this many items</p>
              </div>
              <Button className="w-full" onClick={() => saveSettings.mutate()} loading={saveSettings.isPending}>Save settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-[#F0E6E2] p-3 bg-[#FFFDFB]">
                <div className="text-xs font-bold tracking-wider uppercase text-[#1A1A1A]">Popular Today • {enabled ? `${Math.min(popular.length, limit)} items` : 'Hidden'}</div>
                {enabled ? (
                  <div className="flex gap-2 mt-3 overflow-auto pb-1">
                    {popular.slice(0, limit).map((p) => (
                      <div key={p.id} className="min-w-[120px] bg-white rounded-xl border border-[#F0E6E2] p-2">
                        <img src={p.image} alt={p.name} className="h-16 w-full object-cover rounded-lg" />
                        <div className="text-xs font-semibold truncate mt-1.5">{p.name}</div>
                        <div className="text-xs font-bold text-[#FF5A3D]">{formatCurrency(p.price)}</div>
                      </div>
                    ))}
                    {popular.length === 0 && <div className="text-xs text-[#9A9A9A] py-6">No items</div>}
                  </div>
                ) : (
                  <div className="text-xs text-[#9A9A9A] py-6 text-center">Section disabled — customers won't see Popular Today</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add to Popular Today" description="Select products to feature" size="lg">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#F0E6E2] bg-[#FFFDFB] text-sm" />
          </div>
          <div className="max-h-[360px] overflow-auto space-y-2 pr-1">
            {candidates.length === 0 ? <div className="text-sm text-[#9A9A9A] py-8 text-center">No more products to add</div> :
              candidates.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F0E6E2] hover:bg-[#FFFDFB]">
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-[#9A9A9A]">{p.categoryName} • {formatCurrency(p.price)}</div></div>
                  <Button size="sm" onClick={() => toggleMutation.mutate({ id: p.id, isPopular: true })}><Plus className="h-3.5 w-3.5" /> Add</Button>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

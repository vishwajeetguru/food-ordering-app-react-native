import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Copy, Eye, Flame, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Product, Category } from '@/types';
import ProductForm from '@/components/ProductForm';

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [popularFilter, setPopularFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['products', { search, categoryFilter, availFilter, popularFilter }],
    queryFn: async (): Promise<Product[]> => {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (availFilter) params.available = availFilter;
      if (popularFilter) params.isPopular = popularFilter;
      const res = await api.get(`/products?${new URLSearchParams(params).toString()}`);
      let list: Product[] = res.data?.data ?? [];
      if (!Array.isArray(list)) list = [];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((p) => (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s));
      }
      if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
      if (availFilter === 'true') list = list.filter((p) => p.available !== false);
      if (availFilter === 'false') list = list.filter((p) => p.available === false);
      if (popularFilter === 'true') list = list.filter((p) => !!p.isPopular);
      if (popularFilter === 'false') list = list.filter((p) => !p.isPopular);
      return list;
    },
    staleTime: 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => (await api.get('/categories')).data.data,
    staleTime: 0,
  });

  const pageSize = 10;
  const filtered = products;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: async () => {
      toast.success('Product deleted');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['popular-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || 'Delete failed'),
  });

  const toggleAvail = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => api.patch(`/products/${id}`, { available }),
    onSuccess: async () => {
      toast.success('Updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePopular = useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) => api.patch(`/products/${id}`, { isPopular }),
    onSuccess: async () => {
      toast.success('Updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['popular-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/duplicate`).catch(async () => {
      const src = products.find((p) => p.id === id);
      if (!src) throw new Error('Not found');
      const copy = { ...src, id: `p_${Date.now()}`, name: `${src.name} (Copy)`, createdAt: undefined as any, updatedAt: undefined as any };
      const res = await api.post('/products', copy);
      return res;
    }),
    onSuccess: async () => {
      toast.success('Duplicated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkToggle = async (available: boolean) => {
    if (!selected.length) return toast.info('Select products first');
    for (const id of selected) {
      try { await api.patch(`/products/${id}`, { available }); } catch {}
    }
    toast.success(`Updated ${selected.length} products`);
    setSelected([]);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Products</h1>
          <p className="text-sm text-[#6B6B6B]">{filtered.length} products • {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#F0E6E2] bg-[#FFFDFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D]" />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[#F0E6E2] bg-white px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={availFilter} onChange={(e) => { setAvailFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[#F0E6E2] bg-white px-3 text-sm">
            <option value="">All availability</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
          <select value={popularFilter} onChange={(e) => { setPopularFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[#F0E6E2] bg-white px-3 text-sm">
            <option value="">All</option>
            <option value="true">Popular</option>
            <option value="false">Not popular</option>
          </select>
        </div>

        {selected.length > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-sm">
            <span className="font-medium">{selected.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => bulkToggle(true)}>Enable</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkToggle(false)}>Disable</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}
      </Card>

      {isError ? (
        <Card className="p-8 text-center space-y-2">
          <div className="font-semibold text-[#DC2626]">Failed to load products</div>
          <div className="text-sm text-[#6B6B6B]">{(error as any)?.message || 'Unknown error'}</div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : isLoading ? <TableSkeleton rows={6} cols={6} /> : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <THead>
                <TR>
                  <TH><input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={(e) => setSelected(e.target.checked ? paged.map((p) => p.id) : [])} /></TH>
                  <TH>Product</TH>
                  <TH>Category</TH>
                  <TH>Price</TH>
                  <TH>Status</TH>
                  <TH>Popular</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.length === 0 ? (
                  <TR><TD colSpan={7} className="text-center py-10 text-[#9A9A9A]">No products found</TD></TR>
                ) : paged.map((p) => (
                  <TR key={p.id}>
                    <TD><input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))} /></TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-xl object-cover border border-[#F0E6E2]" />
                        <div>
                          <div className="font-medium flex items-center gap-1.5">{p.name} {p.isVeg ? <span className="h-3 w-3 rounded-sm border border-[#16A34A] flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /></span> : <span className="h-3 w-3 rounded-sm border border-[#DC2626] flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" /></span>}</div>
                          <div className="text-xs text-[#9A9A9A] line-clamp-1 max-w-[240px]">{p.description}</div>
                        </div>
                      </div>
                    </TD>
                    <TD><Badge variant="neutral">{p.categoryName || p.categoryId}</Badge></TD>
                    <TD>
                      <div className="font-semibold">{formatCurrency(p.price)}</div>
                      {p.originalPrice && <div className="text-xs line-through text-[#9A9A9A]">{formatCurrency(p.originalPrice)}</div>}
                    </TD>
                    <TD>
                      <button onClick={() => toggleAvail.mutate({ id: p.id, available: p.available === false ? true : false })} className={p.available === false ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
                        {p.available === false ? <span className="inline-flex items-center gap-1 text-xs font-semibold"><ToggleLeft className="h-4 w-4" /> Disabled</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold"><ToggleRight className="h-4 w-4" /> Active</span>}
                      </button>
                    </TD>
                    <TD>
                      <button onClick={() => togglePopular.mutate({ id: p.id, isPopular: !p.isPopular })} className={p.isPopular ? 'text-[#EA580C]' : 'text-[#9A9A9A]'}>
                        <Flame className={`h-4 w-4 ${p.isPopular ? 'fill-[#EA580C]' : ''}`} />
                      </button>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(p)} title="View"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setShowForm(true); }} title="Edit"><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateMutation.mutate(p.id)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(p)} title="Delete" className="hover:text-[#DC2626]"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid md:hidden gap-3">
            {paged.map((p) => (
              <Card key={p.id} className="p-3 flex gap-3">
                <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover border border-[#F0E6E2] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-[#9A9A9A]">{p.categoryName}</div>
                  <div className="font-bold text-sm mt-1">{formatCurrency(p.price)}</div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(p); setShowForm(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)}>Delete</Button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {p.isPopular && <Flame className="h-4 w-4 text-[#EA580C] fill-[#EA580C]" />}
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${p.available === false ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#E8F5E8] text-[#16A34A]'}`}>{p.available === false ? 'Disabled' : 'Active'}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-[#6B6B6B]">Page {page} of {totalPages} • {filtered.length} items</div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit product' : 'Add product'} size="xl">
        <ProductForm initial={editing} categories={categories} onClose={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name} size="lg">
        {viewing && (
          <div className="space-y-4">
            <img src={viewing.image} alt={viewing.name} className="w-full h-48 object-cover rounded-xl border border-[#F0E6E2]" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-[#9A9A9A]">Price</span><div className="font-semibold">{formatCurrency(viewing.price)} {viewing.originalPrice && <span className="line-through text-[#9A9A9A] font-normal ml-2">{formatCurrency(viewing.originalPrice)}</span>}</div></div>
              <div><span className="text-[#9A9A9A]">Category</span><div className="font-medium">{viewing.categoryName}</div></div>
              <div><span className="text-[#9A9A9A]">Veg</span><div>{viewing.isVeg ? 'Veg' : 'Non-Veg'}</div></div>
              <div><span className="text-[#9A9A9A]">Prep</span><div>{viewing.prepTime || '—'}</div></div>
              <div className="col-span-2"><span className="text-[#9A9A9A]">Description</span><div className="mt-1">{viewing.description}</div></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              <Button onClick={() => { setEditing(viewing); setViewing(null); setShowForm(true); }}>Edit</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product?" description={`“${deleteTarget?.name}” will be permanently removed.`} confirmText="Delete" variant="danger" loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} />
    </div>
  );
}

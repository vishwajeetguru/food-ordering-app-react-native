import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { slugify } from '@/lib/utils';
import type { Category } from '@/types';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url('Valid URL'),
  displayOrder: z.coerce.number().int().min(0).optional(),
  active: z.enum(['true', 'false']).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Categories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => (await api.get('/categories')).data.data,
    staleTime: 0,
  });

  const filtered = categories.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const prodRes = await api.get(`/products?categoryId=${id}&limit=1`);
      const hasProducts = (prodRes.data?.data || []).length > 0;
      if (hasProducts) throw new Error('Cannot delete — products exist in this category. Move or delete products first.');
      return api.delete(`/categories/${id}`);
    },
    onSuccess: async () => {
      toast.success('Category deleted');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-[#6B6B6B]">{filtered.length} categories</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#F0E6E2] bg-[#FFFDFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D]" />
        </div>
      </Card>

      {isLoading ? <TableSkeleton /> : (
        <>
          <div className="hidden md:block">
            <Table>
              <THead><TR><TH>Category</TH><TH>Slug</TH><TH>Image</TH><TH>Order</TH><TH>Status</TH><TH className="text-right">Actions</TH></TR></THead>
              <TBody>
                {filtered.length === 0 ? <TR><TD colSpan={6} className="text-center py-10 text-[#9A9A9A]">No categories</TD></TR> :
                  filtered.map((c) => (
                    <TR key={c.id}>
                      <TD><div className="flex items-center gap-3"><img src={c.image} alt={c.name} className="h-10 w-10 rounded-xl object-cover border border-[#F0E6E2]" /><span className="font-medium">{c.name}</span></div></TD>
                      <TD><code className="text-xs bg-[#F8F5F3] px-2 py-1 rounded-lg border">{c.slug}</code></TD>
                      <TD><a href={c.image} target="_blank" rel="noreferrer" className="text-xs text-[#0284C7] hover:underline truncate max-w-[180px] inline-block">{c.image.slice(0, 40)}…</a></TD>
                      <TD>{c.displayOrder ?? '—'}</TD>
                      <TD>{c.active === false ? <Badge variant="danger">Disabled</Badge> : <Badge variant="success">Active</Badge>}</TD>
                      <TD><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)} className="hover:text-[#DC2626]"><Trash2 className="h-4 w-4" /></Button></div></TD>
                    </TR>
                  ))}
              </TBody>
            </Table>
          </div>

          <div className="grid md:hidden gap-3">
            {filtered.map((c) => (
              <Card key={c.id} className="p-3 flex gap-3 items-center">
                <img src={c.image} alt={c.name} className="h-14 w-14 rounded-xl object-cover border border-[#F0E6E2]" />
                <div className="flex-1"><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-[#9A9A9A]">{c.slug}</div></div>
                <div className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => { setEditing(c); setShowForm(true); }}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>Delete</Button></div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit category' : 'Add category'} size="md">
        <CategoryForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete category?" description={`“${deleteTarget?.name}” will be removed. If products use this category, deletion will be blocked.`} confirmText="Delete" variant="danger" loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} />
    </div>
  );
}

function CategoryForm({ initial, onClose }: { initial: Category | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: initial?.name || '',
      description: (initial as any)?.description || '',
      image: initial?.image || '',
      displayOrder: (initial as any)?.displayOrder || 0,
      active: (initial?.active === false ? 'false' : 'true') as any,
    },
  });

  const image = watch('image');
  const name = watch('name');

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = {
        name: v.name.trim(),
        slug: slugify(v.name),
        image: v.image.trim(),
        description: v.description?.trim(),
        displayOrder: v.displayOrder ? Number(v.displayOrder) : 0,
        active: v.active !== 'false',
      };
      if (initial) return api.patch(`/categories/${initial.id}`, payload);
      const id = Date.now().toString();
      return api.post('/categories', { id, ...payload });
    },
    onSuccess: async () => {
      toast.success(initial ? 'Category updated' : 'Category created');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <Input label="Name *" placeholder="Pizza" error={errors.name?.message} {...register('name')} />
      <div className="text-xs text-[#9A9A9A]">Slug: <code className="bg-[#F8F5F3] px-1.5 py-0.5 rounded">{slugify(name || '') || '—'}</code></div>
      <Textarea label="Description" placeholder="Wood-fired pizzas…" {...register('description')} />
      <Input label="Image URL *" placeholder="https://images.unsplash.com/…" error={errors.image?.message} {...register('image')} />
      {image && <img src={image} alt="preview" className="h-24 w-24 rounded-xl object-cover border border-[#F0E6E2]" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Display order" type="number" placeholder="0" {...register('displayOrder')} />
        <div className="space-y-1.5"><label className="text-sm font-medium">Status</label><select className="w-full h-11 px-3.5 rounded-xl border border-[#F0E6E2] bg-white text-sm" {...register('active')}><option value="true">Active</option><option value="false">Disabled</option></select></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

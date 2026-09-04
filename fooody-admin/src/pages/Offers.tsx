import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Offer } from '@/types';

const schema = z.object({
  title: z.string().min(2),
  subtitle: z.string().min(2),
  code: z.string().min(2).transform((s) => s.toUpperCase().trim()),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  active: z.enum(['true', 'false']).optional(),
  tag: z.string().optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
  bannerImage: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  colors: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Offers() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [editing, setEditing] = useState<Offer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  const { data: offers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offers-admin'],
    queryFn: async (): Promise<Offer[]> => (await api.get('/offers?active=false')).data.data,
    staleTime: 0,
  });

  const now = new Date();
  const filtered = offers.filter((o) => {
    if (filter === 'active') return o.active && (!o.endDate || new Date(o.endDate) >= now);
    if (filter === 'expired') return !!o.endDate && new Date(o.endDate) < now;
    if (filter === 'scheduled') return !!o.startDate && new Date(o.startDate) > now;
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/offers/${id}`),
    onSuccess: async () => {
      toast.success('Offer deleted');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['offers-admin'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
      ]);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/offers/${id}`, { active }),
    onSuccess: async () => {
      toast.success('Updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['offers-admin'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5 text-[#FF5A3D]" /> Offers & Discounts</h1>
          <p className="text-sm text-[#6B6B6B]">{offers.length} offers</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Create Offer</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'scheduled', 'expired'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 h-9 rounded-full text-sm font-medium border capitalize ${filter === f ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#F0E6E2] text-[#6B6B6B] hover:border-[#EDE9E6]'}`}>{f}</button>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={4} /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? <Card className="p-10 text-center text-sm text-[#9A9A9A] col-span-full">No offers in this filter</Card> :
            filtered.map((o) => {
              const isExpired = !!o.endDate && new Date(o.endDate) < now;
              const isScheduled = !!o.startDate && new Date(o.startDate) > now;
              return (
                <Card key={o.id} className="overflow-hidden">
                  <div className="h-24 p-4 flex items-start justify-between text-white" style={{ background: `linear-gradient(135deg, ${o.colors?.[0] || '#FF5A3D'}, ${o.colors?.[1] || '#E94A2E'})` }}>
                    <div>
                      <div className="font-extrabold text-lg leading-none">{o.title}</div>
                      <div className="text-sm opacity-90 mt-1">{o.subtitle}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-2.5 py-1 text-xs font-mono font-bold">{o.code}</div>
                    </div>
                    <span className="text-2xl">{o.emoji}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={isExpired ? 'danger' : isScheduled ? 'warning' : o.active ? 'success' : 'neutral'}>{isExpired ? 'Expired' : isScheduled ? 'Scheduled' : o.active ? 'Active' : 'Inactive'}</Badge>
                      {o.tag && <Badge variant="neutral">{o.tag}</Badge>}
                      {o.discountType && <Badge variant="neutral">{o.discountType === 'percentage' ? `${o.discountValue}% OFF` : formatCurrency(o.discountValue || 0)}</Badge>}
                    </div>
                    {o.description && <p className="text-xs text-[#6B6B6B] line-clamp-2">{o.description}</p>}
                    <div className="text-xs text-[#9A9A9A] space-y-1">
                      {o.minOrderAmount ? <div>Min order: {formatCurrency(o.minOrderAmount)}</div> : null}
                      {o.maxDiscount ? <div>Max discount: {formatCurrency(o.maxDiscount)}</div> : null}
                      {o.startDate && <div>From: {new Date(o.startDate).toLocaleDateString()}</div>}
                      {o.endDate && <div>Until: {new Date(o.endDate).toLocaleDateString()}</div>}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setEditing(o); setShowForm(true); }}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                      <Button size="sm" variant="secondary" onClick={() => toggleActive.mutate({ id: o.id, active: !o.active })}>{o.active ? 'Disable' : 'Enable'}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(o)} className="hover:text-[#DC2626]"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit offer' : 'Create offer'} size="lg">
        <OfferForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete offer?" description={`“${deleteTarget?.title}” will be removed.`} confirmText="Delete" variant="danger" loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} />
    </div>
  );
}

function OfferForm({ initial, onClose }: { initial: Offer | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      title: initial?.title || '',
      subtitle: initial?.subtitle || '',
      code: initial?.code || '',
      discountType: (initial as any)?.discountType || 'percentage',
      discountValue: (initial as any)?.discountValue || '' as any,
      minOrderAmount: (initial as any)?.minOrderAmount || '' as any,
      maxDiscount: (initial as any)?.maxDiscount || '' as any,
      startDate: (initial as any)?.startDate ? String((initial as any).startDate).slice(0, 10) : '',
      endDate: (initial as any)?.endDate ? String((initial as any).endDate).slice(0, 10) : '',
      usageLimit: (initial as any)?.usageLimit || '' as any,
      active: (initial?.active === false ? 'false' : 'true') as any,
      tag: initial?.tag || '',
      emoji: initial?.emoji || '',
      description: (initial as any)?.description || '',
      bannerImage: (initial as any)?.bannerImage || '',
      colors: (initial?.colors || []).join(','),
    },
  });

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      if (v.startDate && v.endDate && new Date(v.startDate) > new Date(v.endDate)) throw new Error('Start date must be before end date');
      const payload: any = {
        title: v.title.trim(),
        subtitle: v.subtitle.trim(),
        code: v.code.trim().toUpperCase(),
        discountType: v.discountType,
        discountValue: v.discountValue ? Number(v.discountValue) : undefined,
        minOrderAmount: v.minOrderAmount ? Number(v.minOrderAmount) : undefined,
        maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : undefined,
        startDate: v.startDate || undefined,
        endDate: v.endDate || undefined,
        usageLimit: v.usageLimit ? Number(v.usageLimit) : undefined,
        active: v.active !== 'false',
        tag: v.tag?.trim(),
        emoji: v.emoji?.trim() || '🎉',
        description: v.description?.trim(),
        bannerImage: v.bannerImage || undefined,
        colors: v.colors ? v.colors.split(',').map((s) => s.trim()).filter(Boolean) : ['#FF5A3D', '#E94A2E'],
      };
      if (payload.discountType === 'percentage' && payload.discountValue > 100) throw new Error('Percentage cannot exceed 100');
      if (initial) return api.patch(`/offers/${initial.id}`, payload);
      const id = `o_${Date.now()}`;
      return api.post('/offers', { id, ...payload });
    },
    onSuccess: async () => {
      toast.success(initial ? 'Offer updated' : 'Offer created');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['offers-admin'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Title *" placeholder="FLAT 20% OFF" error={errors.title?.message} {...register('title')} />
        <Input label="Subtitle *" placeholder="on orders above ₹499" error={errors.subtitle?.message} {...register('subtitle')} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Coupon code *" placeholder="FOODY20" error={errors.code?.message} {...register('code')} />
        <Input label="Tag" placeholder="Most loved" {...register('tag')} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Select label="Discount type" {...register('discountType')}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (₹)</option></Select>
        <Input label="Discount value" type="number" placeholder="20" {...register('discountValue')} />
        <Input label="Max discount (₹)" type="number" placeholder="100" {...register('maxDiscount')} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Input label="Min order amount (₹)" type="number" placeholder="499" {...register('minOrderAmount')} />
        <Input label="Usage limit" type="number" placeholder="100" {...register('usageLimit')} />
        <Input label="Emoji" placeholder="🍕" {...register('emoji')} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Input label="Start date" type="date" {...register('startDate')} />
        <Input label="End date" type="date" {...register('endDate')} />
        <Select label="Active" {...register('active')}><option value="true">Active</option><option value="false">Inactive</option></Select>
      </div>
      <Textarea label="Description" placeholder="Offer details…" {...register('description')} />
      <Input label="Banner image URL" placeholder="https://…" {...register('bannerImage')} />
      <Input label="Colors (comma-separated hex)" placeholder="#FF5A3D,#E94A2E" hint="Two colors for gradient" {...register('colors')} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

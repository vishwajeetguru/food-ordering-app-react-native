import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Image as ImageIcon, Eye } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import type { Banner } from '@/types';

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().min(2),
  buttonText: z.string().optional(),
  couponCode: z.string().optional(),
  image: z.string().url(),
  order: z.coerce.number().int().min(0).optional(),
  active: z.enum(['true', 'false']).optional(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export default function HomeContent() {
  const qc = useQueryClient();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const { data: banners = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['banners'],
    queryFn: async (): Promise<Banner[]> => {
      const r = await api.get('/admin/banners');
      const list = r.data?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 0,
  });

  const { data: homeSettings } = useQuery({
    queryKey: ['home-settings'],
    queryFn: async () => {
      const r = await api.get('/admin/home-settings');
      return r.data?.data ?? null;
    },
    staleTime: 0,
  });

  const sorted = [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: async () => {
      toast.success('Banner deleted');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['banners'] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
      ]);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/admin/banners/${id}`, { active }),
    onSuccess: async () => {
      toast.success('Updated');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['banners'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="h-5 w-5 text-[#FF5A3D]" /> Home Screen Content</h1>
          <p className="text-sm text-[#6B6B6B]">Manage banners and home sections — updates reflect in the customer app without code changes</p>
        </div>
        <Button onClick={() => { setEditingBanner(null); setShowBannerForm(true); }}><Plus className="h-4 w-4" /> Add Banner</Button>
      </div>

      {isLoading ? <Skeleton className="h-[300px]" /> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {sorted.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mx-auto"><ImageIcon className="h-6 w-6 text-[#EA580C]" /></div>
                <div className="font-semibold mt-3">No banners yet</div>
                <div className="text-sm text-[#9A9A9A]">Example: FLAT 20% OFF on orders above ₹499 — Use FOODY20</div>
                <Button className="mt-4" onClick={() => setShowBannerForm(true)}>Add first banner</Button>
              </Card>
            ) : sorted.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <img src={b.image} alt={b.title} className="h-20 w-32 rounded-xl object-cover border border-[#F0E6E2] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{b.title}</div>
                    <div className="text-sm text-[#6B6B6B]">{b.subtitle}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {b.couponCode && <Badge variant="default">{b.couponCode}</Badge>}
                      {b.buttonText && <Badge variant="neutral">{b.buttonText}</Badge>}
                      <Badge variant={b.active === false ? 'danger' : 'success'}>{b.active === false ? 'Inactive' : 'Active'}</Badge>
                      <Badge variant="neutral">Order {b.order ?? 0}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingBanner(b); setShowBannerForm(true); }}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="secondary" onClick={() => toggleMutation.mutate({ id: b.id, active: b.active === false })}>{b.active === false ? 'Enable' : 'Disable'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(b)} className="hover:text-[#DC2626]"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Customer preview</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-[#F0E6E2] overflow-hidden bg-[#FFFDFB]">
                  {sorted.filter((b) => b.active !== false).slice(0, 3).map((b) => (
                    <div key={b.id} className="relative h-28 overflow-hidden border-b border-[#F0E6E2] last:border-0">
                      <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                      <div className="relative p-4 text-white">
                        <div className="font-extrabold">{b.title}</div>
                        <div className="text-sm opacity-90">{b.subtitle}</div>
                        {b.couponCode && <div className="mt-2 inline-flex bg-white text-[#1A1A1A] rounded-full px-2.5 py-1 text-xs font-mono font-bold">{b.couponCode}</div>}
                      </div>
                    </div>
                  ))}
                  {sorted.filter((b) => b.active !== false).length === 0 && <div className="p-6 text-center text-sm text-[#9A9A9A]">No active banners</div>}
                </div>
                <p className="text-xs text-[#9A9A9A] mt-2">Banners appear on the customer app home in order. Toggle active/inactive to control visibility.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Sections</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Popular Today</span><Badge variant={(homeSettings as any)?.popularEnabled === false ? 'danger' : 'success'}>{(homeSettings as any)?.popularEnabled === false ? 'Hidden' : 'Visible'}</Badge></div>
                <div className="flex justify-between"><span>Categories</span><Badge variant={(homeSettings as any)?.categoriesEnabled === false ? 'danger' : 'success'}>{(homeSettings as any)?.categoriesEnabled === false ? 'Hidden' : 'Visible'}</Badge></div>
                <div className="text-xs text-[#9A9A9A]">Manage section toggles from Popular & Categories pages; banners here control the hero area.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Modal open={showBannerForm} onClose={() => setShowBannerForm(false)} title={editingBanner ? 'Edit banner' : 'Add banner'} size="lg">
        <BannerForm initial={editingBanner} onClose={() => { setShowBannerForm(false); setEditingBanner(null); }} />
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete banner?" description={`“${deleteTarget?.title}” will be removed.`} confirmText="Delete" variant="danger" loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} />
    </div>
  );
}

function BannerForm({ initial, onClose }: { initial: Banner | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema as any),
    defaultValues: {
      title: initial?.title || '',
      subtitle: initial?.subtitle || '',
      buttonText: (initial as any)?.buttonText || '',
      couponCode: (initial as any)?.couponCode || '',
      image: initial?.image || '',
      order: (initial?.order as any) || 0,
      active: (initial?.active === false ? 'false' : 'true') as any,
    },
  });

  const image = watch('image');

  const mutation = useMutation({
    mutationFn: async (v: BannerFormValues) => {
      const payload: any = {
        title: v.title.trim(),
        subtitle: v.subtitle.trim(),
        buttonText: v.buttonText?.trim(),
        couponCode: v.couponCode?.trim().toUpperCase(),
        image: v.image.trim(),
        order: v.order ? Number(v.order) : 0,
        active: v.active !== 'false',
      };
      if (initial) return api.patch(`/admin/banners/${initial.id}`, payload);
      const id = `b_${Date.now()}`;
      return api.post('/admin/banners', { id, ...payload });
    },
    onSuccess: async () => {
      toast.success(initial ? 'Banner updated' : 'Banner created');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['banners'] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
      ]);
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <Input label="Title *" placeholder="FLAT 20% OFF" error={errors.title?.message} {...register('title')} />
      <Input label="Subtitle *" placeholder="on orders above ₹499" error={errors.subtitle?.message} {...register('subtitle')} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Button text" placeholder="Order now" {...register('buttonText')} />
        <Input label="Coupon code" placeholder="FOODY20" {...register('couponCode')} />
      </div>
      <Input label="Image URL *" placeholder="https://images.unsplash.com/…" error={errors.image?.message} {...register('image')} />
      {image && <img src={image} alt="preview" className="h-32 w-full object-cover rounded-xl border border-[#F0E6E2]" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Order" type="number" placeholder="0" {...register('order')} />
        <div className="space-y-1.5"><label className="text-sm font-medium">Active</label><select className="w-full h-11 px-3.5 rounded-xl border border-[#F0E6E2] bg-white text-sm" {...register('active')}><option value="true">Active</option><option value="false">Inactive</option></select></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

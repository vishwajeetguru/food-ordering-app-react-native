import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

const schema = z.object({
  name: z.string().min(2),
  about: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  cuisines: z.string().optional(),
  deliveryTime: z.string().optional(),
  priceForTwo: z.coerce.number().min(0).optional(),
  deliveryCharge: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
  isOpen: z.enum(['true', 'false']).optional(),
  image: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  logo: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  rating: z.coerce.number().min(0).max(5).optional(),
  ratingCount: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const qc = useQueryClient();
  const { data: restaurant, isLoading, isError, error } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: async () => (await api.get('/restaurant/default')).data.data,
    staleTime: 0,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
  });

  // sync when loaded
  if (restaurant && !watch('name')) {
    // Use effect-like sync without causing infinite loop — only if pristine
    queueMicrotask(() => {
      const current = watch('name');
      if (!current && restaurant.name) {
        reset({
          name: restaurant.name || '',
          about: (restaurant as any).about || '',
          address: (restaurant as any).address || '',
          phone: (restaurant as any).phone || '',
          email: (restaurant as any).email || '',
          cuisines: (restaurant.cuisines || []).join(', '),
          deliveryTime: restaurant.deliveryTime || '',
          priceForTwo: restaurant.priceForTwo as any,
          deliveryCharge: (restaurant as any).deliveryCharge || 40,
          minOrderAmount: (restaurant as any).minOrderAmount || 0,
          taxRate: (restaurant as any).taxRate || 5,
          openingHours: (restaurant as any).openingHours || '10:00 AM',
          closingHours: (restaurant as any).closingHours || '10:00 PM',
          isOpen: ((restaurant as any).isOpen !== false ? 'true' : 'false') as any,
          image: restaurant.image || '',
          logo: restaurant.logo || '',
          rating: restaurant.rating as any,
          ratingCount: restaurant.ratingCount as any,
        });
      }
    });
  }

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = {
        name: v.name.trim(),
        about: v.about?.trim(),
        address: v.address?.trim(),
        phone: v.phone?.trim(),
        email: v.email?.trim(),
        cuisines: v.cuisines ? v.cuisines.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        deliveryTime: v.deliveryTime?.trim(),
        priceForTwo: v.priceForTwo ? Number(v.priceForTwo) : undefined,
        deliveryCharge: v.deliveryCharge !== undefined ? Number(v.deliveryCharge) : undefined,
        minOrderAmount: v.minOrderAmount !== undefined ? Number(v.minOrderAmount) : undefined,
        taxRate: v.taxRate !== undefined ? Number(v.taxRate) : undefined,
        openingHours: v.openingHours?.trim(),
        closingHours: v.closingHours?.trim(),
        isOpen: v.isOpen === 'true',
        image: v.image?.trim(),
        logo: v.logo?.trim(),
        rating: v.rating ? Number(v.rating) : undefined,
        ratingCount: v.ratingCount ? Number(v.ratingCount) : undefined,
      };
      // Try admin endpoint, fallback to restaurant patch
      try {
        const res = await api.patch('/admin/restaurant', payload);
        return res.data;
      } catch {
        try {
          const res = await api.patch('/admin/settings', payload);
          return res.data;
        } catch {
          const res = await api.patch('/restaurants/default', payload);
          return res.data;
        }
      }
    },
    onSuccess: async () => {
      toast.success('Settings saved');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['restaurant-settings'] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const logo = watch('logo');
  const image = watch('image');

  if (isLoading) return <Skeleton className="h-[600px]" />;

  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => (await api.get('/admin/settings')).data.data,
  });
  const maintenanceMutation = useMutation({
    mutationFn: async (v: { maintenanceMode: boolean; maintenanceMessage?: string }) => (await api.patch('/admin/settings', v)).data.data,
    onSuccess: async () => {
      toast.success('Maintenance mode updated — customer app will update instantly');
      await qc.invalidateQueries({ queryKey: ['app-settings'] });
      await qc.invalidateQueries({ queryKey: ['restaurant-settings'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className={appSettings?.maintenanceMode ? 'border-[#FF5A3D] bg-[#FFF7ED]' : ''}>
        <CardHeader><CardTitle className="flex items-center gap-2">Maintenance Mode {appSettings?.maintenanceMode && <span className="text-xs bg-[#FF5A3D] text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Enable maintenance mode</p>
              <p className="text-xs text-[#6B6B6B]">When on, customer app shows maintenance screen instantly (realtime). Admins bypass.</p>
            </div>
            <button
              onClick={() => maintenanceMutation.mutate({ maintenanceMode: !appSettings?.maintenanceMode })}
              disabled={maintenanceMutation.isPending}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${appSettings?.maintenanceMode ? 'bg-[#FF5A3D]' : 'bg-[#E5E7EB]'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${appSettings?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {appSettings?.maintenanceMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Maintenance message</label>
              <Input
                defaultValue={appSettings?.maintenanceMessage || ''}
                placeholder="We're under maintenance..."
                onBlur={(e: any) => {
                  const v = e.target.value;
                  if (v !== appSettings?.maintenanceMessage) maintenanceMutation.mutate({ maintenanceMode: true, maintenanceMessage: v });
                }}
              />
              <p className="text-xs text-[#9A9A9A]">Realtime — customer app updates within seconds via Firestore listener + 10s REST polling fallback.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h1 className="text-xl font-bold">Restaurant Settings</h1>
        <p className="text-sm text-[#6B6B6B]">Manage restaurant info, delivery and opening hours — reflected in the customer app</p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Restaurant name *" error={errors.name?.message} {...register('name')} />
              <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Email" placeholder="hello@foody.app" {...register('email')} />
              <Input label="Cuisines (comma-separated)" placeholder="Italian, North Indian, Chinese" {...register('cuisines')} />
            </div>
            <Textarea label="About" placeholder="Foody House serves…" {...register('about')} />
            <Input label="Address" placeholder="123 MG Road, Bangalore" {...register('address')} />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input label="Logo URL" placeholder="https://…" error={errors.logo?.message} {...register('logo')} />
                {logo && <img src={logo} alt="logo" className="mt-2 h-16 w-16 rounded-xl object-cover border border-[#F0E6E2]" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
              </div>
              <div>
                <Input label="Cover image URL" placeholder="https://…" error={errors.image?.message} {...register('image')} />
                {image && <img src={image} alt="cover" className="mt-2 h-16 w-full object-cover rounded-xl border border-[#F0E6E2]" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Delivery & Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Input label="Delivery time" placeholder="25-35 min" {...register('deliveryTime')} />
              <Input label="Price for two (₹)" type="number" {...register('priceForTwo')} />
              <Input label="Delivery charge (₹)" type="number" {...register('deliveryCharge')} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Input label="Min order amount (₹)" type="number" {...register('minOrderAmount')} />
              <Input label="Tax rate (%)" type="number" step="0.1" {...register('taxRate')} />
              <div className="space-y-1.5"><label className="text-sm font-medium">Restaurant status</label><select className="w-full h-11 px-3.5 rounded-xl border border-[#F0E6E2] bg-white text-sm" {...register('isOpen')}><option value="true">Open</option><option value="false">Closed</option></select></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hours & Rating</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Input label="Opening" placeholder="10:00 AM" {...register('openingHours')} />
              <Input label="Closing" placeholder="10:00 PM" {...register('closingHours')} />
              <Input label="Rating (0-5)" type="number" step="0.1" {...register('rating')} />
              <Input label="Rating count" type="number" {...register('ratingCount')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={mutation.isPending}>Save settings</Button>
        </div>
      </form>
    </div>
  );
}

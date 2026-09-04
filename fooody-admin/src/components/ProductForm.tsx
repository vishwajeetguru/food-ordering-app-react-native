import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import type { Product, Category } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  description: z.string().min(5, 'Required'),
  categoryId: z.string().min(1, 'Required'),
  price: z.coerce.number().positive('Positive required'),
  originalPrice: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
  image: z.string().url('Valid URL required'),
  images: z.string().optional(),
  isVeg: z.enum(['true', 'false']),
  prepTime: z.string().optional(),
  calories: z.coerce.number().optional().or(z.literal('').transform(() => undefined)),
  available: z.enum(['true', 'false']),
  isPopular: z.enum(['true', 'false']),
  isRecommended: z.enum(['true', 'false']),
  featured: z.enum(['true', 'false']),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProductForm({ initial, categories, onClose }: { initial: Product | null; categories: Category[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: initial?.name || '',
      description: initial?.description || '',
      categoryId: initial?.categoryId || (categories[0]?.id || ''),
      price: initial?.price as any || '' as any,
      originalPrice: (initial?.originalPrice as any) || '' as any,
      image: initial?.image || '',
      images: (initial?.images || []).join(', '),
      isVeg: (initial?.isVeg ? 'true' : 'false') as any,
      prepTime: initial?.prepTime || '',
      calories: (initial as any)?.calories || '' as any,
      available: (initial?.available === false ? 'false' : 'true') as any,
      isPopular: (initial?.isPopular ? 'true' : 'false') as any,
      isRecommended: (initial?.isRecommended ? 'true' : 'false') as any,
      featured: ((initial as any)?.featured ? 'true' : 'false') as any,
      ingredients: ((initial as any)?.ingredients || []).join(', '),
      allergens: ((initial as any)?.allergens || []).join(', '),
      rating: (initial?.rating as any) || 4.5,
    },
  });

  const imageUrl = watch('image');
  const imagesStr = watch('images');

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: any = {
        name: values.name.trim(),
        description: values.description.trim(),
        categoryId: values.categoryId,
        categoryName: categories.find((c) => c.id === values.categoryId)?.name,
        price: Number(values.price),
        originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
        image: values.image.trim(),
        images: values.images ? values.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
        isVeg: values.isVeg === 'true',
        prepTime: values.prepTime || undefined,
        calories: values.calories ? Number(values.calories) : undefined,
        available: values.available === 'true',
        isPopular: values.isPopular === 'true',
        isRecommended: values.isRecommended === 'true',
        featured: values.featured === 'true',
        ingredients: values.ingredients ? values.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : [],
        allergens: values.allergens ? values.allergens.split(',').map((s) => s.trim()).filter(Boolean) : [],
        rating: values.rating ? Number(values.rating) : 4.5,
        ratingCount: initial?.ratingCount ?? 0,
      };
      // discount validation
      if (payload.originalPrice && payload.originalPrice <= payload.price) {
        throw new Error('Original price must be greater than price (for discount display)');
      }
      if (initial) {
        const res = await api.patch(`/products/${initial.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/products', payload);
        return res.data;
      }
    },
    onSuccess: async () => {
      toast.success(initial ? 'Product updated' : 'Product created');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['popular-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-analytics'] }),
        qc.invalidateQueries({ queryKey: ['categories'] }),
      ]);
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });

  const onSubmit = (v: FormValues) => mutation.mutate(v);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Product name *" placeholder="Margherita Supreme" error={errors.name?.message} {...register('name')} />
        <Select label="Category *" error={errors.categoryId?.message} {...register('categoryId')}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      <Textarea label="Description *" placeholder="Fresh mozzarella, basil…" error={errors.description?.message} {...register('description')} />

      <div className="grid md:grid-cols-3 gap-4">
        <Input label="Price (₹) *" type="number" step="0.01" placeholder="349" error={errors.price?.message} {...register('price')} />
        <Input label="Original price (₹)" type="number" step="0.01" placeholder="399" hint="Must be > price" error={errors.originalPrice?.message} {...register('originalPrice')} />
        <Input label="Rating (0-5)" type="number" step="0.1" placeholder="4.5" error={errors.rating?.message} {...register('rating')} />
      </div>

      <div className="space-y-2">
        <Input label="Main image URL *" placeholder="https://images.unsplash.com/…" error={errors.image?.message} {...register('image')} />
        {imageUrl && (
          <div className="flex gap-3 items-center p-3 rounded-xl bg-[#F8F5F3] border border-[#F0E6E2]">
            <img src={imageUrl} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-[#F0E6E2] bg-white" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div className="text-xs text-[#6B6B6B]">Preview — ensure URL is publicly accessible. The customer app will show this image immediately.</div>
          </div>
        )}
      </div>

      <Input label="Additional images (comma-separated URLs)" placeholder="https://… , https://…" hint="Optional" {...register('images')} />
      {imagesStr && (
        <div className="flex flex-wrap gap-2">
          {imagesStr.split(',').map((u) => u.trim()).filter(Boolean).map((u, i) => (
            <img key={i} src={u} alt={`img-${i}`} className="h-14 w-14 rounded-xl object-cover border border-[#F0E6E2]" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Select label="Food type" {...register('isVeg')}><option value="true">Veg</option><option value="false">Non-Veg</option></Select>
        <Input label="Prep time" placeholder="25-30 min" {...register('prepTime')} />
        <Input label="Calories" type="number" placeholder="320" {...register('calories')} />
        <Select label="Availability" {...register('available')}><option value="true">Available</option><option value="false">Unavailable</option></Select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Select label="Popular Today" {...register('isPopular')}><option value="false">No</option><option value="true">Yes — show in Popular</option></Select>
        <Select label="Recommended" {...register('isRecommended')}><option value="false">No</option><option value="true">Yes</option></Select>
        <Select label="Featured" {...register('featured')}><option value="false">No</option><option value="true">Yes</option></Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Ingredients (comma-separated)" placeholder="Mozzarella, basil, tomato" {...register('ingredients')} />
        <Input label="Allergens (comma-separated)" placeholder="Dairy, gluten" {...register('allergens')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update product' : 'Create product'}</Button>
      </div>
    </form>
  );
}

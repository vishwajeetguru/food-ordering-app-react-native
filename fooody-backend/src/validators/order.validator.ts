import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1).max(128),
      quantity: z.number().int().min(1).max(99),
      // price/name/image are ignored server-side (server fetches product price) but allow for backward compat
      price: z.number().optional(),
      name: z.string().optional(),
      image: z.string().url().optional(),
    })
  ).min(1).max(50),
  deliveryFee: z.number().min(0).max(200).optional(),
  tax: z.number().min(0).max(10000).optional(),
  discount: z.number().min(0).max(10000).optional(),
  subtotal: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  paymentMethod: z.enum(['cod','online']).optional().default('cod'),
  address: z.object({
    label: z.enum(['Home','Work','Other']).optional(),
    address: z.string().min(5).max(300).optional(),
    details: z.string().max(300).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).passthrough().nullable().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending','preparing','out_for_delivery','delivered','cancelled']),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});

export const orderListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

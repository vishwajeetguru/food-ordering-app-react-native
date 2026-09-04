import { z } from 'zod';

export const productQuerySchema = z.object({
  categoryId: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(100).optional(),
  isPopular: z.enum(['true','false']).optional(),
  isRecommended: z.enum(['true','false']).optional(),
  isVeg: z.enum(['true','false']).optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});

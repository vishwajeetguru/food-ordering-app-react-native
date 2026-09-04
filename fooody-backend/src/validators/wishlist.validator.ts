import { z } from 'zod';
export const addWishlistSchema = z.object({
  productId: z.string().min(1).max(128),
});
export const wishlistProductIdParamSchema = z.object({
  productId: z.string().min(1).max(128),
});

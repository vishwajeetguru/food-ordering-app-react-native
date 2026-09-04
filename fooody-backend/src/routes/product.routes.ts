import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import { productQuerySchema, productIdParamSchema } from '../validators/product.validator';
import { cacheControl } from '../middleware/cache.middleware';

const router = Router();

// Public reads — validated query/params, cached 60s (public, stale 30s)
router.get('/', validate(productQuerySchema, 'query'), cacheControl(60), productController.list);
router.get('/:id', validate(productIdParamSchema, 'params'), cacheControl(60), productController.getById);

// Admin writes — protected. Accepts full frontend Product shape (see fooody-frontend/src/services/mock/products.ts)
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  image: z.string().url(),
  images: z.array(z.string().url()).optional(),
  rating: z.number().min(0).max(5).optional().default(4.5),
  ratingCount: z.number().int().min(0).optional().default(0),
  isVeg: z.boolean().optional().default(true),
  categoryId: z.string().min(1),
  categoryName: z.string().optional(),
  prepTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  calories: z.number().int().min(0).optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
});

router.post('/', authenticate, requireRole('admin'), validate(productSchema), productController.create);
router.patch('/:id', authenticate, requireRole('admin'), validate(productIdParamSchema, 'params'), validate(productSchema.partial().strip()), productController.update);
router.delete('/:id', authenticate, requireRole('admin'), validate(productIdParamSchema, 'params'), productController.delete);
router.post('/:id/duplicate', authenticate, requireRole('admin'), validate(productIdParamSchema, 'params'), productController.duplicate);

export default router;

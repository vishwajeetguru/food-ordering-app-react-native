import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { cacheControl } from '../middleware/cache.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
const router = Router();
const idParam = z.object({ id: z.string().min(1).max(128) });
router.get('/', cacheControl(120), categoryController.list);
router.get('/:id', validate(idParam, 'params'), cacheControl(120), categoryController.getById);

// Admin writes
const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  image: z.string().url(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

router.post('/', authenticate, requireRole('admin'), validate(categorySchema), categoryController.create);
router.patch('/:id', authenticate, requireRole('admin'), validate(idParam, 'params'), validate(categorySchema.partial().strip()), categoryController.update);
router.delete('/:id', authenticate, requireRole('admin'), validate(idParam, 'params'), categoryController.delete);
export default router;

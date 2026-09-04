import { Router } from 'express';
import { offerController } from '../controllers/offer.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { cacheControl } from '../middleware/cache.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const idParam = z.object({ id: z.string().min(1).max(128) });

router.get('/', cacheControl(120), offerController.list);
router.get('/:id', validate(idParam, 'params'), cacheControl(120), offerController.getById);

// Admin writes
const offerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().min(2),
  code: z.string().min(2),
  colors: z.array(z.string()).optional(),
  emoji: z.string().optional(),
  tag: z.string().optional(),
  active: z.boolean().optional(),
  discountType: z.enum(['percentage','fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.number().int().min(0).optional(),
  bannerImage: z.string().url().optional(),
  description: z.string().optional(),
});

router.post('/', authenticate, requireRole('admin'), validate(offerSchema), offerController.create);
router.patch('/:id', authenticate, requireRole('admin'), validate(idParam, 'params'), validate(offerSchema.partial().strip()), offerController.update);
router.delete('/:id', authenticate, requireRole('admin'), validate(idParam, 'params'), offerController.delete);

export default router;

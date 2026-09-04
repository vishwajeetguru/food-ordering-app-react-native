import { Router } from 'express';
import { restaurantController } from '../controllers/restaurant.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { cacheControl } from '../middleware/cache.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const idParam = z.object({ id: z.string().min(1).max(128) });

// NOTE: mounted at BOTH /restaurants and /restaurant in routes/index.ts — cache 2min
router.get('/', cacheControl(120), restaurantController.list);
router.get('/default', cacheControl(120), restaurantController.getDefault);
router.get('/:id', validate(idParam, 'params'), cacheControl(120), restaurantController.getById);

// Admin writes — update default restaurant
router.patch('/default', authenticate, requireRole('admin'), restaurantController.updateDefault);
router.patch('/:id', authenticate, requireRole('admin'), validate(idParam, 'params'), restaurantController.update);

export default router;

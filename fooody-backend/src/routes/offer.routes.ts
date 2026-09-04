import { Router } from 'express';
import { offerController } from '../controllers/offer.controller';
import { cacheControl } from '../middleware/cache.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
const idParam = z.object({ id: z.string().min(1).max(128) });

router.get('/', cacheControl(120), offerController.list);
router.get('/:id', validate(idParam, 'params'), cacheControl(120), offerController.getById);

export default router;

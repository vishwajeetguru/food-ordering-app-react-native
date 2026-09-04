import { Router } from 'express';
import { homeController } from '../controllers/home.controller';
import { cacheControl } from '../middleware/cache.middleware';

const router = Router();

router.get('/', cacheControl(30), homeController.get);

export default router;

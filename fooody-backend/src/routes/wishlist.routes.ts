import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { addWishlistSchema, wishlistProductIdParamSchema } from '../validators/wishlist.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);
router.get('/', wishlistController.list);
router.get('/check/:productId', validate(wishlistProductIdParamSchema, 'params'), wishlistController.check);
router.post('/', validate(addWishlistSchema), wishlistController.add);
router.post('/toggle', validate(addWishlistSchema), wishlistController.toggle);
router.delete('/:productId', validate(wishlistProductIdParamSchema, 'params'), wishlistController.remove);
export default router;

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/user.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();

router.use(authenticate, noCache);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

export default router;

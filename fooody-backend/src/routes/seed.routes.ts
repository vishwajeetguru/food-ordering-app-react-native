import { Router } from 'express';
import { seedController } from '../controllers/seed.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Public idempotent seed — rate-limited; force=true requires admin
const forceAuth: any = (req: any, _res: any, next: any) => {
  if (req.query.force === 'true' || req.body?.force === true) return authenticate(req, _res, next);
  return next();
};

router.get('/', forceAuth, authLimiter, seedController.run);
router.post('/', forceAuth, authLimiter, seedController.run);
router.post('/force', authenticate, requireRole('admin'), authLimiter, seedController.run);

export default router;

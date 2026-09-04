import { Request, Response, NextFunction } from 'express';
import { seedDatabase } from '../utils/seed';
import { sendSuccess } from '../utils/response';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const seedController = {
  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const force = req.query.force === 'true' || req.body?.force === true;
      if (force) {
        const user = (req as any).user;
        if (!user) throw new UnauthorizedError('Authentication required for forced seed', ERROR_CODES.UNAUTHORIZED);
        if (user.role !== 'admin') throw new ForbiddenError('Admin role required for forced seed', ERROR_CODES.FORBIDDEN);
      }
      const counts = await seedDatabase({ force });
      sendSuccess(res, counts, 'Database seeded (idempotent)');
    } catch (err) { next(err); }
  },
};

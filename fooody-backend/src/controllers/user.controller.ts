import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      const user = await userService.getById(uid);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      const updates = req.body;
      const user = await userService.updateProfile(uid, updates);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      await userService.deleteAccount(uid);
      sendSuccess(res, null, 'Account deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};

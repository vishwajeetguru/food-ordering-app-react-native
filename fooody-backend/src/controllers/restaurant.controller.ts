import { Request, Response, NextFunction } from 'express';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const restaurantController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const restaurants = await restaurantRepository.list();
      sendSuccess(res, restaurants, 'Restaurants retrieved');
    } catch (err) { next(err); }
  },
  async getDefault(_req: Request, res: Response, next: NextFunction) {
    try {
      const restaurant = await restaurantRepository.getDefault();
      sendSuccess(res, restaurant, 'Restaurant retrieved');
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurant = await restaurantRepository.getById(req.params.id);
      if (!restaurant) throw new NotFoundError('Restaurant not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, restaurant, 'Restaurant retrieved');
    } catch (err) { next(err); }
  },
};

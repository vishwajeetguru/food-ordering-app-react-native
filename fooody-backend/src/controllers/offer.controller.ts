import { Request, Response, NextFunction } from 'express';
import { offerRepository } from '../repositories/offer.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const offerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active !== 'false';
      const offers = await offerRepository.list(activeOnly);
      sendSuccess(res, offers, 'Offers retrieved');
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await offerRepository.getById(req.params.id);
      if (!offer) throw new NotFoundError('Offer not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, offer, 'Offer retrieved');
    } catch (err) { next(err); }
  },
};

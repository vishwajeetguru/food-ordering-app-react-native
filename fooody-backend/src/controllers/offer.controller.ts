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
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      if (!data.id) data.id = `o_${Date.now()}`;
      const created = await offerRepository.create(data);
      sendSuccess(res, created, 'Offer created', 201);
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await offerRepository.update(req.params.id, req.body);
      if (!updated) throw new NotFoundError('Offer not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Offer updated');
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await offerRepository.delete(req.params.id);
      if (!ok) throw new NotFoundError('Offer not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, null, 'Offer deleted');
    } catch (err) { next(err); }
  },
};

import { Request, Response, NextFunction } from 'express';
import { bannerRepository } from '../repositories/banner.repository';
import { settingsRepository } from '../repositories/settings.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const bannerController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannerRepository.list();
      sendSuccess(res, banners, 'Banners retrieved');
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const b = await bannerRepository.getById(req.params.id);
      if (!b) throw new NotFoundError('Banner not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, b, 'Banner retrieved');
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      if (!data.id) data.id = `b_${Date.now()}`;
      const created = await bannerRepository.create(data);
      sendSuccess(res, created, 'Banner created', 201);
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await bannerRepository.update(req.params.id, req.body);
      if (!updated) throw new NotFoundError('Banner not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Banner updated');
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await bannerRepository.delete(req.params.id);
      if (!ok) throw new NotFoundError('Banner not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, null, 'Banner deleted');
    } catch (err) { next(err); }
  },
  // Home settings
  async getHomeSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsRepository.get();
      sendSuccess(res, settings.home, 'Home settings retrieved');
    } catch (err) { next(err); }
  },
  async updateHomeSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await settingsRepository.updateHome(req.body);
      sendSuccess(res, updated.home, 'Home settings updated');
    } catch (err) { next(err); }
  },
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const s = await settingsRepository.get();
      sendSuccess(res, s, 'Settings retrieved');
    } catch (err) { next(err); }
  },
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await settingsRepository.update(req.body);
      sendSuccess(res, updated, 'Settings updated');
    } catch (err) { next(err); }
  },
};

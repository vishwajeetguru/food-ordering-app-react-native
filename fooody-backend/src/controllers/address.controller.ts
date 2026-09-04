import { Request, Response, NextFunction } from 'express';
import { addressRepository } from '../repositories/address.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';

export const addressController = {
  async list(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const addrs = await addressRepository.listForUser(userId);
      sendSuccess(res, addrs, 'Addresses retrieved');
    }catch(err){ next(err); }
  },
  async getDefault(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const addr = await addressRepository.getDefault(userId);
      if(!addr) throw new NotFoundError('No default address found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, addr, 'Default address retrieved');
    }catch(err){ next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const addr = await addressRepository.create(userId, req.body);
      sendSuccess(res, addr, 'Address created', 201);
    }catch(err){ next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const updated = await addressRepository.update(req.params.id, userId, req.body);
      if(!updated) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Address updated');
    }catch(err){ next(err); }
  },
  async setDefault(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const updated = await addressRepository.setDefault(req.params.id, userId);
      if(!updated) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, updated, 'Default address updated');
    }catch(err){ next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction){
    try{
      const userId = (req as any).user.id;
      const ok = await addressRepository.delete(req.params.id, userId);
      if(!ok) throw new NotFoundError('Address not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, null, 'Address deleted');
    }catch(err){ next(err); }
  },
  async reverseGeocode(req: Request, res: Response, next: NextFunction){
    try{
      const { lat, lng } = req.body;
      if(typeof lat !== 'number' || typeof lng !== 'number'){
        throw new BadRequestError('lat and lng are required numbers');
      }
      // Proxy to OpenStreetMap Nominatim (no API key, free)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      try{
        const r = await fetch(url, { headers: { 'User-Agent': 'FoodyApp/1.0 (contact@foody.app)' } });
        if(!r.ok) throw new Error(`Nominatim ${r.status}`);
        const data: any = await r.json();
        const addr = data.address || {};
        const display = data.display_name || '';
        const formatted = {
          displayName: display,
          houseNumber: addr.house_number || '',
          road: addr.road || addr.street || '',
          neighbourhood: addr.neighbourhood || addr.suburb || addr.quarter || '',
          city: addr.city || addr.town || addr.village || addr.county || '',
          state: addr.state || '',
          postcode: addr.postcode || '',
          country: addr.country || '',
          formattedAddress: display,
          lat, lng,
        };
        sendSuccess(res, formatted, 'Reverse geocoded');
      }catch(e:any){
        logger.warn('reverseGeocode proxy failed', { error: e.message, lat, lng });
        // Fallback minimal
        sendSuccess(res, { formattedAddress: `${lat}, ${lng}`, lat, lng, city:'', postcode:'' }, 'Reverse geocoded (fallback)');
      }
    }catch(err){ next(err); }
  },
  async geocodeSearch(req: Request, res: Response, next: NextFunction){
    try{
      const q = (req.query.q as string) || '';
      if(!q || q.length < 2) throw new BadRequestError('Query q min 2 chars');
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
      try{
        const r = await fetch(url, { headers: { 'User-Agent': 'FoodyApp/1.0' } });
        if(!r.ok) throw new Error(`Nominatim ${r.status}`);
        const data: any = await r.json();
        const results = (data as any[]).map(d=> ({
          displayName: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          city: d.address?.city || d.address?.town || '',
          postcode: d.address?.postcode || '',
        }));
        sendSuccess(res, results, 'Search results');
      }catch(e:any){
        logger.warn('geocodeSearch failed', { error: e.message, q });
        sendSuccess(res, [], 'Search results (fallback)');
      }
    }catch(err){ next(err); }
  }
};

import { Request, Response, NextFunction } from 'express';
import { categoryRepository } from '../repositories/category.repository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

export const categoryController = {
  async list(_req: Request, res: Response, next: NextFunction){
    try{
      const cats = await categoryRepository.list();
      sendSuccess(res, cats, 'Categories retrieved');
    }catch(err){ next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try{
      const cat = await categoryRepository.getById(req.params.id);
      if(!cat) throw new NotFoundError('Category not found', ERROR_CODES.NOT_FOUND);
      sendSuccess(res, cat, 'Category retrieved');
    }catch(err){ next(err); }
  }
};

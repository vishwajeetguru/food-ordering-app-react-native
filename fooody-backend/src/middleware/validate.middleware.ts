import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function validate(schema: any, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // Overwrite with validated/coerced data
      (req as any)[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

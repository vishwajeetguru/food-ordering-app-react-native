import { Request, Response, NextFunction } from 'express';

// Public GET caching: Cache-Control for CDN/browser, no cache for authenticated
export function cacheControl(maxAgeSeconds: number, opts: { publicCache?: boolean; staleWhileRevalidate?: number } = {}) {
  const { publicCache = true, staleWhileRevalidate = 30 } = opts;
  return (req: Request, res: Response, next: NextFunction) => {
    // If request has Authorization (admin browsing), don't cache — ensures fresh data after mutations
    if (req.headers.authorization) {
      res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return next();
    }
    const visibility = publicCache ? 'public' : 'private';
    res.setHeader('Cache-Control', `${visibility}, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}

// No-cache for authenticated/private endpoints
export function noCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
}

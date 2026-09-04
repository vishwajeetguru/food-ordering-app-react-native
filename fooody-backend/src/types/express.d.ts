import { User } from './user.types';
import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      firebaseUser?: DecodedIdToken;
      id?: string;
    }
  }
}

export {};

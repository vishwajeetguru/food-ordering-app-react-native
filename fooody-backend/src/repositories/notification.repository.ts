import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export type NotificationType = 'promo' | 'order' | 'system' | 'support' | 'general';
export interface AppNotification {
  id: string;
  userId: string | null; // null = broadcast to all
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

const memory = new Map<string, AppNotification>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }

export const notificationRepository = {
  _clearMemory(){ memory.clear(); },
  async create(input: Omit<AppNotification, 'id'|'createdAt'|'read'|'readAt'> & { read?: boolean }): Promise<AppNotification>{
    const id = crypto.randomUUID();
    const n: AppNotification = {
      id,
      userId: input.userId ?? null,
      title: input.title,
      body: input.body,
      type: input.type || 'general',
      data: input.data,
      read: input.read ?? false,
      readAt: null,
      createdAt: nowISO(),
    };
    memory.set(id, n);
    if(shouldUseMemory()) return n;
    try{
      const toSave: any = { ...n };
      if(toSave.data === undefined) delete toSave.data;
      if(toSave.readAt === null) delete toSave.readAt;
      await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).doc(id).set(toSave);
      return n;
    }catch(e:any){
      logger.warn('notification.create fallback', {error:e.message});
      return n;
    }
  },
  async createForUsers(userIds: string[], payload: { title:string; body:string; type?: NotificationType; data?: any }): Promise<AppNotification[]>{
    const results: AppNotification[] = [];
    for(const uid of userIds){
      const n = await this.create({ userId: uid, title: payload.title, body: payload.body, type: (payload.type as any) || 'general', data: payload.data });
      results.push(n);
    }
    return results;
  },
  async listForUser(userId: string, limit=50): Promise<AppNotification[]>{
    const all = Array.from(memory.values()).filter(n=> n.userId===userId || n.userId===null).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
    if(shouldUseMemory()) return all;
    try{
      // Firestore: we need two queries: user-specific + broadcast, then merge. For simplicity, query all and filter (small scale). In prod add composite index.
      const snap = await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).orderBy('createdAt','desc').limit(100).get();
      const firestore = snap.docs.map(d=> d.data() as AppNotification).filter(n=> n.userId===userId || n.userId===null);
      const mergedIds = new Set(firestore.map(f=>f.id));
      const memExtra = all.filter(m=> !mergedIds.has(m.id));
      const merged = [...firestore, ...memExtra].sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
      // sync memory for fallback
      merged.forEach(m=> memory.set(m.id, m));
      return merged;
    }catch(e:any){
      logger.warn('notification.list fallback', {error:e.message});
      return all;
    }
  },
  async listAll(limit=100): Promise<AppNotification[]>{
    const all = Array.from(memory.values()).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
    if(shouldUseMemory()) return all;
    try{
      const snap = await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).orderBy('createdAt','desc').limit(limit).get();
      const list = snap.docs.map(d=> d.data() as AppNotification);
      const ids = new Set(list.map(i=>i.id));
      const extra = all.filter(m=> !ids.has(m.id));
      return [...list, ...extra].slice(0,limit);
    }catch(e:any){
      logger.warn('notification.listAll fallback', {error:e.message});
      return all;
    }
  },
  async getById(id:string): Promise<AppNotification|null>{
    if(memory.has(id)) return memory.get(id)!;
    if(shouldUseMemory()) return null;
    try{
      const snap = await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).doc(id).get();
      if(!snap.exists) return null;
      const data = snap.data() as AppNotification;
      memory.set(id, data);
      return data;
    }catch{ return memory.get(id)||null; }
  },
  async markRead(id:string, userId:string): Promise<AppNotification|null>{
    const n = await this.getById(id);
    if(!n) return null;
    // user can mark own or broadcast
    if(n.userId !== null && n.userId !== userId) return null;
    const updated = { ...n, read: true, readAt: nowISO() } as AppNotification;
    memory.set(id, updated);
    if(shouldUseMemory()) return updated;
    try{
      await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).doc(id).update({ read: true, readAt: updated.readAt });
      return updated;
    }catch(e:any){
      logger.warn('notification.markRead fallback', {error:e.message});
      return updated;
    }
  },
  async markAllRead(userId:string): Promise<number>{
    const list = await this.listForUser(userId, 100);
    let count=0;
    for(const n of list.filter(x=>!x.read)){
      await this.markRead(n.id, userId);
      count++;
    }
    return count;
  },
  async delete(id:string): Promise<boolean>{
    memory.delete(id);
    if(shouldUseMemory()) return true;
    try{
      await getFirestore().collection(COLLECTIONS.NOTIFICATIONS).doc(id).delete();
      return true;
    }catch{ return true; }
  },
  async unreadCount(userId:string): Promise<number>{
    const list = await this.listForUser(userId, 100);
    return list.filter(n=>!n.read).length;
  }
};

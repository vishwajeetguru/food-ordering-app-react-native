import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending'|'preparing'|'out_for_delivery'|'delivered'|'cancelled';
  paymentMethod: 'cod'|'online';
  address?: any;
  createdAt: string;
  updatedAt: string;
}

const memoryOrders = new Map<string, Order>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }
function genOrderNumber(){ return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase(); }

export const orderRepository = {
  _clearMemory(){ memoryOrders.clear(); },
  async create(input: Omit<Order, 'id'|'orderNumber'|'createdAt'|'updatedAt'|'status'> & { status?: Order['status']}): Promise<Order>{
    const id = crypto.randomUUID();
    const order: Order = {
      id,
      orderNumber: genOrderNumber(),
      status: input.status || 'pending',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      ...input,
    } as Order;
    if(shouldUseMemory()){ memoryOrders.set(id, order); return order; }
    try{
      await getFirestore().collection(COLLECTIONS.ORDERS).doc(id).set(order);
      memoryOrders.set(id, order);
      return order;
    }catch(e:any){
      logger.warn('orderRepository.create fallback', {error:e.message});
      memoryOrders.set(id, order);
      return order;
    }
  },
  async listForUser(userId: string, limit=20): Promise<Order[]>{
    if(shouldUseMemory()){
      return Array.from(memoryOrders.values()).filter(o=>o.userId===userId).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0, limit);
    }
    try{
      const snap = await getFirestore().collection(COLLECTIONS.ORDERS).where('userId','==',userId).orderBy('createdAt','desc').limit(limit).get();
      if(snap.empty) return Array.from(memoryOrders.values()).filter(o=>o.userId===userId).slice(0,limit);
      const firestoreOrders = snap.docs.map(d=> d.data() as Order);
      // merge memory fallback for consistency
      const mem = Array.from(memoryOrders.values()).filter(o=>o.userId===userId);
      const merged = [...firestoreOrders, ...mem.filter(m=> !firestoreOrders.find(f=> f.id===m.id))];
      return merged.sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
    }catch(e:any){
      logger.warn('orderRepository.listForUser fallback', {error:e.message});
      return Array.from(memoryOrders.values()).filter(o=>o.userId===userId).slice(0,limit);
    }
  },
  async getById(id:string): Promise<Order|null>{
    if(memoryOrders.has(id)) return memoryOrders.get(id)!;
    if(shouldUseMemory()) return null;
    try{
      const snap= await getFirestore().collection(COLLECTIONS.ORDERS).doc(id).get();
      if(!snap.exists) return null;
      const data = snap.data() as Order;
      memoryOrders.set(id, data);
      return data;
    }catch(e:any){
      logger.warn('orderRepository.getById fallback', {error:e.message});
      return memoryOrders.get(id)||null;
    }
  },
  async updateStatus(id:string, status: Order['status']): Promise<Order|null>{
    const existing = await this.getById(id);
    if(!existing) return null;
    const updated = { ...existing, status, updatedAt: nowISO() } as Order;
    if(shouldUseMemory()){ memoryOrders.set(id, updated); return updated; }
    try{
      await getFirestore().collection(COLLECTIONS.ORDERS).doc(id).update({ status, updatedAt: updated.updatedAt });
      memoryOrders.set(id, updated);
      return updated;
    }catch(e:any){
      logger.warn('orderRepository.updateStatus fallback', {error:e.message});
      memoryOrders.set(id, updated);
      return updated;
    }
  },
  async listAll(limit=100): Promise<Order[]>{
    if(shouldUseMemory()){
      return Array.from(memoryOrders.values()).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0, limit);
    }
    try{
      const snap = await getFirestore().collection(COLLECTIONS.ORDERS).orderBy('createdAt','desc').limit(limit).get();
      const firestoreOrders = snap.docs.map(d=> d.data() as Order);
      const mem = Array.from(memoryOrders.values());
      const merged = [...firestoreOrders, ...mem.filter(m=> !firestoreOrders.find(f=> f.id===m.id))];
      return merged.sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0, limit);
    }catch(e:any){
      logger.warn('orderRepository.listAll fallback', {error:e.message});
      return Array.from(memoryOrders.values()).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0, limit);
    }
  }
};

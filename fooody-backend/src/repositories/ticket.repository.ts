import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'order' | 'payment' | 'delivery' | 'general' | 'account' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketMessage {
  by: 'user' | 'admin';
  byId: string;
  byName: string | null;
  message: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userPhone?: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  orderId?: string | null;
}

const memory = new Map<string, SupportTicket>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }
function stripUndefined(obj:any){
  const out:any={};
  for(const [k,v] of Object.entries(obj)) if(v!==undefined) out[k]=v;
  return out;
}

export const ticketRepository = {
  _clearMemory(){ memory.clear(); },
  async create(input: { userId:string; userName:string|null; userEmail:string; userPhone?:string|null; subject:string; description:string; category:TicketCategory; priority?:TicketPriority; orderId?:string|null }): Promise<SupportTicket>{
    const id = crypto.randomUUID();
    const ticket: SupportTicket = {
      id,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userPhone: input.userPhone || null,
      subject: input.subject,
      description: input.description,
      category: input.category || 'general',
      status: 'open',
      priority: input.priority || 'medium',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      messages: [],
      orderId: input.orderId || null,
    };
    memory.set(id, ticket);
    if(shouldUseMemory()) return ticket;
    try{
      await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).set(stripUndefined(ticket as any));
      return ticket;
    }catch(e:any){
      logger.warn('ticket.create fallback', {error:e.message});
      return ticket;
    }
  },
  async listForUser(userId:string, limit=50): Promise<SupportTicket[]>{
    const all = Array.from(memory.values()).filter(t=>t.userId===userId).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
    if(shouldUseMemory()) return all;
    try{
      const snap = await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).where('userId','==',userId).orderBy('createdAt','desc').limit(limit).get();
      const list = snap.docs.map(d=> d.data() as SupportTicket);
      const ids = new Set(list.map(i=>i.id));
      const extra = all.filter(m=> !ids.has(m.id));
      const merged = [...list, ...extra].sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
      merged.forEach(m=> memory.set(m.id, m));
      return merged;
    }catch(e:any){
      logger.warn('ticket.listForUser fallback', {error:e.message});
      return all;
    }
  },
  async listAll(limit=100, status?:TicketStatus): Promise<SupportTicket[]>{
    let all = Array.from(memory.values()).sort((a,b)=> new Date(b.createdAt).getTime()- new Date(a.createdAt).getTime()).slice(0,limit);
    if(status) all = all.filter(t=>t.status===status);
    if(shouldUseMemory()) return all;
    try{
      let q:any = getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).orderBy('createdAt','desc').limit(limit);
      if(status) q = getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).where('status','==',status).orderBy('createdAt','desc').limit(limit);
      const snap = await q.get();
      const list = snap.docs.map((d:any)=> d.data() as SupportTicket);
      const ids = new Set(list.map((i:any)=>i.id));
      const extra = all.filter(m=> !ids.has(m.id));
      return [...list, ...extra].slice(0,limit);
    }catch(e:any){
      logger.warn('ticket.listAll fallback', {error:e.message});
      return all;
    }
  },
  async getById(id:string): Promise<SupportTicket|null>{
    if(memory.has(id)) return memory.get(id)!;
    if(shouldUseMemory()) return null;
    try{
      const snap = await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).get();
      if(!snap.exists) return null;
      const data = snap.data() as SupportTicket;
      memory.set(id, data);
      return data;
    }catch{ return memory.get(id)||null; }
  },
  async addMessage(id:string, msg: TicketMessage): Promise<SupportTicket|null>{
    const t = await this.getById(id);
    if(!t) return null;
    const updated = { ...t, messages: [...(t.messages||[]), msg], updatedAt: nowISO() } as SupportTicket;
    memory.set(id, updated);
    if(shouldUseMemory()) return updated;
    try{
      await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).update({ messages: updated.messages, updatedAt: updated.updatedAt });
      return updated;
    }catch(e:any){
      logger.warn('ticket.addMessage fallback', {error:e.message});
      return updated;
    }
  },
  async updateStatus(id:string, status: TicketStatus, adminNote?: string, adminCtx?: { byId:string; byName:string|null }): Promise<SupportTicket|null>{
    const t = await this.getById(id);
    if(!t) return null;
    let messages = t.messages || [];
    if(adminNote && adminCtx){
      messages = [...messages, { by: 'admin', byId: adminCtx.byId, byName: adminCtx.byName, message: adminNote, at: nowISO() } as TicketMessage];
    }
    const updated = { ...t, status, messages, updatedAt: nowISO() } as SupportTicket;
    memory.set(id, updated);
    if(shouldUseMemory()) return updated;
    try{
      const payload:any = { status, updatedAt: updated.updatedAt, messages };
      await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).update(payload);
      return updated;
    }catch(e:any){
      logger.warn('ticket.updateStatus fallback', {error:e.message});
      return updated;
    }
  },
  async delete(id:string): Promise<boolean>{
    memory.delete(id);
    if(shouldUseMemory()) return true;
    try{
      await getFirestore().collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).delete();
      return true;
    }catch{ return true; }
  }
};

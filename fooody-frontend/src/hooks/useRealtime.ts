import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, doc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase';
import { useAuthStore } from '@/store/authStore';
import { settingsApi } from '@/api/catalog.api';

function safeOnSnapshot(q: any, cb: () => void): (() => void) | void {
  try { return onSnapshot(q, cb, () => {}); } catch { return; }
}

// Maintenance: realtime settings/app doc + REST polling fallback
export function useRealtimeMaintenance() {
  const qc = useQueryClient();
  const [state, setState] = React.useState<{ maintenanceMode: boolean; maintenanceMessage: string; loading: boolean }>({
    maintenanceMode: false,
    maintenanceMessage: '',
    loading: true,
  });

  React.useEffect(() => {
    const db = getFirebaseFirestore();
    if (!db) { setState(s => ({ ...s, loading: false })); return; }
    const ref = doc(db, 'settings', 'app');
    let unsub: any = safeOnSnapshot(ref, () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['maintenance'] });
    });
    // also listen for initial load
    const unsub2: any = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d: any = snap.data();
        setState({ maintenanceMode: !!d.maintenanceMode, maintenanceMessage: d.maintenanceMessage || '', loading: false });
      } else setState(s => ({ ...s, loading: false }));
    }, () => setState(s => ({ ...s, loading: false })));
    return () => { try { unsub && (unsub as any)(); } catch {}; try { unsub2 && (unsub2 as any)(); } catch {} };
  }, [qc]);

  return state;
}

export function useMaintenance() {
  const realtime = useRealtimeMaintenance();
  const rest = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => (r.data as any)),
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 1,
  });
  // Prefer realtime when Firestore is available (not loading), otherwise REST
  if (!realtime.loading) return { maintenanceMode: realtime.maintenanceMode, maintenanceMessage: realtime.maintenanceMessage, isLoading: false, isRealtime: true };
  const data: any = rest.data;
  return { maintenanceMode: !!data?.maintenanceMode, maintenanceMessage: data?.maintenanceMessage || '', isLoading: rest.isLoading, isRealtime: false };
}

// Orders: invalidate ['orders'] and ['order', id] when orders change
export function useRealtimeOrders(enabled = true) {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const uid = user?.id;
  const role = (user as any)?.role;

  React.useEffect(() => {
    if (!enabled || !uid) return;
    const db = getFirebaseFirestore();
    if (!db) return;
    let unsub: any;
    if (role === 'admin') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
      unsub = safeOnSnapshot(q, () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['admin-orders'] }); });
    } else {
      const q = query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
      // If composite index missing, fallback to without orderBy
      unsub = safeOnSnapshot(q, () => qc.invalidateQueries({ queryKey: ['orders'] })) as any;
      if (!unsub) {
        const q2 = query(collection(db, 'orders'), where('userId', '==', uid));
        unsub = safeOnSnapshot(q2, () => qc.invalidateQueries({ queryKey: ['orders'] }));
      }
    }
    return () => { try { (unsub as any)?.(); } catch {} };
  }, [enabled, uid, role, qc]);
}

export function useRealtimeOrder(orderId: string | undefined, enabled = true) {
  const qc = useQueryClient();
  React.useEffect(() => {
    if (!enabled || !orderId) return;
    const db = getFirebaseFirestore();
    if (!db) return;
    const unsub = safeOnSnapshot(doc(db, 'orders', orderId), () => qc.invalidateQueries({ queryKey: ['order', orderId] }));
    return () => { try { (unsub as any)?.(); } catch {} };
  }, [orderId, enabled, qc]);
}

// Notifications realtime: any new notification for user or broadcast
export function useRealtimeNotifications(enabled = true) {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const uid = user?.id;
  React.useEffect(() => {
    if (!enabled || !uid) return;
    const db = getFirebaseFirestore();
    if (!db) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    const unsub: any = safeOnSnapshot(q, () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    });
    return () => { try { unsub?.(); } catch {} };
  }, [enabled, uid, qc]);
}

import * as React from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/api/admin.api';
import * as Haptics from 'expo-haptics';

type Tab = 'overview'|'users'|'orders'|'addresses'|'wishlist'|'tickets'|'push';

export default function AdminPanel(){
  const router = useRouter();
  const user = useAuthStore(s=>s.user);
  const [tab, setTab] = React.useState<Tab>('overview');
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(()=>{
    if(user && user.role !== 'admin'){
      Alert.alert('Forbidden','Admin only');
      router.replace('/(tabs)/home' as any);
    }
  }, [user]);

  if(!user || user.role!=='admin'){
    return <SafeAreaView style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl }}><Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Checking admin access...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Admin Panel</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>Manage users, orders, addresses, tickets & push</Text>
        </View>
        <View style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, backgroundColor: colors.errorLight, borderWidth:1, borderColor: colors.error }}>
          <Text style={{ ...typography.captionBold, color: colors.error, fontSize:10 }}>ADMIN</Text>
        </View>
      </View>

      <View style={{ backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.md }}>
          {(['overview','users','orders','addresses','wishlist','tickets','push'] as Tab[]).map(t=>(
            <Pressable key={t} onPress={()=>{ Haptics.selectionAsync().catch(()=>{}); setTab(t); }} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:999, backgroundColor: tab===t ? colors.primary : colors.surfaceMuted, borderWidth:1, borderColor: tab===t ? colors.primary : colors.border }}>
              <Text style={{ ...typography.captionBold, color: tab===t ? colors.textInverse : colors.textSecondary, textTransform:'capitalize' }}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); setTimeout(()=>setRefreshing(false),800);}} />}>
        {tab==='overview' && <Overview />}
        {tab==='users' && <UsersTab />}
        {tab==='orders' && <OrdersTab />}
        {tab==='addresses' && <AddressesTab />}
        {tab==='wishlist' && <WishlistTab />}
        {tab==='tickets' && <TicketsTab />}
        {tab==='push' && <PushTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview(){
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{ adminApi.analytics().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  if(loading) return <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading analytics...</Text>;
  if(!data) return <Text style={{ ...typography.bodySmall, color: colors.error }}>Failed</Text>;
  const cards = [
    { label:'Revenue', value:`₹${data.totalRevenue}`, sub:`Today ₹${data.todayRevenue}` },
    { label:'Orders', value:String(data.totalOrders), sub:`${data.pendingOrders} pending` },
    { label:'Users', value:String(data.totalCustomers), sub:`${data.totalProducts} products` },
  ];
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection:'row', gap: spacing.md }}>
        {cards.map(c=>(
          <View key={c.label} style={{ flex:1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, ...shadows.xs as any }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{c.label}</Text>
            <Text style={{ ...typography.h2, color: colors.textPrimary }}>{c.value}</Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>{c.sub}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
        <Text style={{ ...typography.h4, color: colors.textPrimary }}>Recent Orders</Text>
        {(data.recentOrders||[]).slice(0,5).map((o:any)=>(
          <View key={o.id} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:6, borderBottomWidth:1, borderBottomColor: colors.divider }}>
            <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>{o.orderNumber}</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{o.status} • ₹{o.total}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function UsersTab(){
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(()=>{ setLoading(true); adminApi.listUsers().then(r=>setUsers(r.data)).finally(()=>setLoading(false)); }, []);
  React.useEffect(()=>{ load(); }, [load]);
  const toggleRole = async (u:any)=>{
    const nextRole = u.role==='admin'?'customer':'admin';
    Alert.alert('Change role',`Make ${u.email} ${nextRole}?`,[{text:'Cancel',style:'cancel'},{text:'Confirm',onPress: async()=>{ await adminApi.updateUser(u.id,{role: nextRole}); load(); }}]);
  };
  if(loading) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading users...</Text>;
  return (
    <View style={{ gap: spacing.md }}>
      {users.map(u=>(
        <View key={u.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>{u.name || u.email}</Text>
            <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:999, backgroundColor: u.role==='admin'? colors.errorLight : colors.primaryMuted }}><Text style={{ ...typography.captionBold, color: u.role==='admin'? colors.error : colors.primary, fontSize:10 }}>{u.role}</Text></View>
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{u.email} • {u.phone || 'no phone'} • {u.status}</Text>
          <View style={{ flexDirection:'row', gap: spacing.sm, flexWrap:'wrap' }}>
            <Pressable onPress={()=>toggleRole(u)} style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:999, borderWidth:1, borderColor: colors.border }}><Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Toggle role</Text></Pressable>
            <Pressable onPress={async()=>{ Alert.alert('Delete user',`Soft delete ${u.email}?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress: async()=>{ await adminApi.deleteUser(u.id); load(); }}])}} style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:999, backgroundColor: colors.errorLight, borderWidth:1, borderColor: colors.error }}><Text style={{ ...typography.captionBold, color: colors.error }}>Delete</Text></Pressable>
            <Pressable onPress={async()=>{ const n = await adminApi.listUserAddresses(u.id); Alert.alert('Addresses', `${n.data.length} saved\n` + n.data.map((a:any)=>`${a.label}: ${a.address.slice(0,40)}`).join('\n') || 'None'); }} style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:999, backgroundColor: colors.surfaceMuted, borderWidth:1, borderColor: colors.borderLight }}><Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Addresses</Text></Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function OrdersTab(){
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(()=>{ setLoading(true); adminApi.listOrders(50).then(r=>setOrders(r.data)).finally(()=>setLoading(false)); }, []);
  React.useEffect(()=>{load();},[load]);
  const updateStatus = async (id:string, status:string)=>{
    await adminApi.updateOrderStatus(id, status);
    Alert.alert('Updated', `Status -> ${status}`);
    load();
  };
  if(loading) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading orders...</Text>;
  return (
    <View style={{ gap: spacing.md }}>
      {orders.slice(0,20).map(o=>(
        <View key={o.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>{o.orderNumber}</Text>
            <Text style={{ ...typography.captionBold, color: colors.primary, textTransform:'capitalize' }}>{o.status}</Text>
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{o.userId.slice(0,8)} • ₹{o.total} • {new Date(o.createdAt).toLocaleDateString()}</Text>
          <Text style={{ ...typography.caption, color: colors.textTertiary }} numberOfLines={2}>{o.items?.map((i:any)=>`${i.name} x${i.quantity}`).join(', ')}</Text>
          <View style={{ flexDirection:'row', gap: spacing.sm, flexWrap:'wrap', marginTop: spacing.sm }}>
            {['pending','preparing','out_for_delivery','delivered','cancelled'].map(s=>(
              <Pressable key={s} onPress={()=>updateStatus(o.id, s)} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, backgroundColor: o.status===s ? colors.primary : colors.surfaceMuted, borderWidth:1, borderColor: o.status===s ? colors.primary : colors.border }}>
                <Text style={{ ...typography.captionBold, color: o.status===s ? colors.textInverse : colors.textSecondary, fontSize:10, textTransform:'capitalize' }}>{s.replace('_',' ')}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function AddressesTab(){
  const [list, setList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{ adminApi.listAddresses().then(r=>setList(r.data)).finally(()=>setLoading(false)); }, []);
  if(loading) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading addresses...</Text>;
  if(!list.length) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>No addresses</Text>;
  return (
    <View style={{ gap: spacing.md }}>
      {list.slice(0,30).map((a:any)=>(
        <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth:1, borderColor: a.isDefault ? colors.primaryLight : colors.borderLight }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>{a.label} {a.isDefault?'• Default':''}</Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>{a.userEmail || a.userId.slice(0,8)}</Text>
          </View>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{[a.houseFlat, a.area, a.city, a.pincode].filter(Boolean).join(', ') || a.address}</Text>
          <Pressable onPress={async()=>{ Alert.alert('Delete',`Delete ${a.label}?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress: async()=>{ await adminApi.deleteAddress(a.id); setList(prev=>prev.filter(x=>x.id!==a.id)); }}])}} style={{ alignSelf:'flex-start', marginTop:8 }}><Text style={{ ...typography.captionBold, color: colors.error }}>Delete</Text></Pressable>
        </View>
      ))}
    </View>
  );
}

function WishlistTab(){
  const [list, setList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{ adminApi.listWishlists().then(r=>setList(r.data)).finally(()=>setLoading(false)); }, []);
  if(loading) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading wishlist...</Text>;
  if(!list.length) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>No wishlists</Text>;
  return (
    <View style={{ gap: spacing.sm }}>
      {list.slice(0,30).map((w:any)=>(
        <View key={w.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth:1, borderColor: colors.borderLight, flexDirection:'row', justifyContent:'space-between' }}>
          <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>{w.productId.slice(0,12)}</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{w.userEmail || w.userId.slice(0,8)} • {new Date(w.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

function TicketsTab(){
  const [list, setList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(()=>{ adminApi.listTickets().then(r=>setList(r.data)).finally(()=>setLoading(false)); }, []);
  React.useEffect(()=>{load();},[load]);
  const [reply, setReply] = React.useState<Record<string,string>>({});
  if(loading) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading tickets...</Text>;
  if(!list.length) return <Text style={{ ...typography.caption, color: colors.textSecondary }}>No tickets</Text>;
  return (
    <View style={{ gap: spacing.md }}>
      {list.slice(0,20).map((t:any)=>(
        <View key={t.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }} numberOfLines={1}>{t.subject}</Text>
            <Text style={{ ...typography.captionBold, color: t.status==='open'? colors.warning : t.status==='resolved'? colors.success : colors.textSecondary, textTransform:'capitalize' }}>{t.status}</Text>
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t.category} • {t.userEmail} • {new Date(t.createdAt).toLocaleDateString()}</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{t.description.slice(0,120)}</Text>
          <View style={{ flexDirection:'row', gap: spacing.sm, flexWrap:'wrap' }}>
            {(['open','in_progress','resolved','closed'] as const).map(s=>(
              <Pressable key={s} onPress={async()=>{ await adminApi.updateTicketStatus(t.id, s); load(); }} style={{ paddingHorizontal:8, paddingVertical:5, borderRadius:999, backgroundColor: t.status===s ? colors.primary : colors.surfaceMuted, borderWidth:1, borderColor: t.status===s ? colors.primary : colors.border }}>
                <Text style={{ ...typography.captionBold, color: t.status===s ? colors.textInverse : colors.textSecondary, fontSize:10 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
          {(t.messages||[]).slice(-2).map((m:any,i:number)=>(
            <View key={i} style={{ backgroundColor: m.by==='admin'? colors.primaryMuted : colors.surfaceMuted, borderRadius: radius.md, padding: spacing.sm }}>
              <Text style={{ ...typography.captionBold, color: colors.textPrimary, fontSize:10 }}>{m.by} • {m.byName}</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{m.message}</Text>
            </View>
          ))}
          <View style={{ flexDirection:'row', gap: spacing.sm }}>
            <TextInput value={reply[t.id]||''} onChangeText={v=>setReply(prev=>({...prev,[t.id]:v}))} placeholder="Admin reply..." placeholderTextColor={colors.textTertiary} style={{ flex:1, borderWidth:1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical:8, color: colors.textPrimary }} />
            <Pressable onPress={async()=>{ const msg=reply[t.id]; if(!msg) return; await adminApi.replyToTicket(t.id, msg); setReply(prev=>({...prev,[t.id]:''})); load(); }} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius: radius.md, backgroundColor: colors.primary }}><Text style={{ ...typography.label, color: colors.textInverse }}>Send</Text></Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function PushTab(){
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [target, setTarget] = React.useState(''); // userId or empty for broadcast
  const [broadcast, setBroadcast] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
  React.useEffect(()=>{ adminApi.listUsers().then(r=>setUsers(r.data.slice(0,20))).catch(()=>{}); }, []);
  const send = async()=>{
    if(!title.trim() || !body.trim()){ Alert.alert('Validation','Title & body required'); return; }
    setSending(true);
    try{
      const payload:any = { title: title.trim(), body: body.trim(), type:'promo', broadcast };
      if(!broadcast){
        if(!target.trim()){ Alert.alert('Validation','Provide userId or enable broadcast'); setSending(false); return; }
        payload.userId = target.trim();
      }
      await adminApi.sendNotification(payload);
      Alert.alert('Sent', broadcast ? 'Broadcast sent to all' : `Sent to ${payload.userId}`);
      setTitle(''); setBody('');
    }catch(e:any){ Alert.alert('Failed', e?.message); }
    finally{ setSending(false); }
  };
  return (
    <View style={{ gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight }}>
      <Text style={{ ...typography.h4, color: colors.textPrimary }}>Send push notification</Text>
      <Text style={{ ...typography.caption, color: colors.textSecondary }}>Admin can notify a particular user or all users. Uses FCM if tokens registered via app (expo-notifications), else stored as in-app notification.</Text>
      <Input label="Title *" placeholder="Flat 30% OFF today!" value={title} onChangeText={setTitle} maxLength={120} />
      <Input label="Body *" placeholder="Order now and save big..." value={body} onChangeText={setBody} multiline numberOfLines={3} style={{ minHeight:80, textAlignVertical:'top', paddingTop:12 }} maxLength={500} />
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
        <Pressable onPress={()=>setBroadcast(!broadcast)} style={{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor: broadcast? colors.primary : colors.border, backgroundColor: broadcast? colors.primary : colors.surface, alignItems:'center', justifyContent:'center' }}>
          {broadcast ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
        </Pressable>
        <Text style={{ ...typography.label, color: colors.textPrimary }}>Broadcast to all users</Text>
      </View>
      {!broadcast && (
        <>
          <Input label="Target userId *" placeholder="Paste userId or select below" value={target} onChangeText={setTarget} autoCapitalize="none" />
          <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Pick user:</Text>
          <View style={{ gap: spacing.sm }}>
            {users.slice(0,6).map(u=>(
              <Pressable key={u.id} onPress={()=>setTarget(u.id)} style={{ padding: spacing.md, borderRadius: radius.md, borderWidth:1, borderColor: target===u.id ? colors.primary : colors.borderLight, backgroundColor: target===u.id ? colors.primaryMuted : colors.surface }}>
                <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>{u.name || u.email}</Text>
                <Text style={{ ...typography.caption, color: colors.textTertiary }} numberOfLines={1}>{u.id}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Button title={sending? 'Sending...' : broadcast ? 'Send to all' : 'Send to user'} onPress={send} loading={sending} disabled={sending} />
    </View>
  );
}

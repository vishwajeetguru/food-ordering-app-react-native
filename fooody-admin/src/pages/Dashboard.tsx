import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, ShoppingBag, Users, Flame, Clock, AlertTriangle, Plus, ArrowUpRight, IndianRupee, Eye } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Analytics } from '@/types';

function useAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<Analytics> => {
      const res = await api.get('/admin/analytics');
      const data = res.data?.data ?? res.data;
      // Ensure arrays exist even if backend returns partial
      return {
        totalRevenue: data.totalRevenue ?? 0,
        totalOrders: data.totalOrders ?? 0,
        totalProducts: data.totalProducts ?? 0,
        totalCustomers: data.totalCustomers ?? 0,
        todayOrders: data.todayOrders ?? 0,
        todayRevenue: data.todayRevenue ?? 0,
        pendingOrders: data.pendingOrders ?? 0,
        unavailableProducts: data.unavailableProducts ?? 0,
        revenueLast7Days: data.revenueLast7Days ?? [],
        ordersLast7Days: data.ordersLast7Days ?? [],
        recentOrders: data.recentOrders ?? [],
        popularProducts: data.popularProducts ?? [],
      } as Analytics;
    },
    staleTime: 0,
    retry: 1,
  });
}

export default function Dashboard() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-[320px]" />
      </div>
    );
  }

  if (error) {
    return <div className="card p-8 text-center text-sm text-[#DC2626]">Failed to load analytics. Check backend connection (VITE_API_URL). <br /><span className="text-xs text-[#9A9A9A]">{String((error as any).message)}</span></div>;
  }

  const a = data!;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(a.totalRevenue), sub: `${a.totalOrders} orders`, icon: IndianRupee, color: 'bg-[#FFF2EF] text-[#FF5A3D]' },
    { label: 'Total Orders', value: String(a.totalOrders), sub: `${a.pendingOrders} pending`, icon: ShoppingBag, color: 'bg-[#EFF6FF] text-[#0284C7]' },
    { label: 'Total Products', value: String(a.totalProducts), sub: `${a.unavailableProducts} unavailable`, icon: Package, color: 'bg-[#F0FDF4] text-[#16A34A]' },
    { label: 'Total Customers', value: String(a.totalCustomers), sub: 'Registered users', icon: Users, color: 'bg-[#FFF7ED] text-[#EA580C]' },
    { label: "Today's Orders", value: String(a.todayOrders), sub: "Orders placed today", icon: Clock, color: 'bg-[#F5F3FF] text-[#7C3AED]' },
    { label: "Today's Revenue", value: formatCurrency(a.todayRevenue), sub: 'Earned today', icon: TrendingUp, color: 'bg-[#ECFDF5] text-[#059669]' },
    { label: 'Pending Orders', value: String(a.pendingOrders), sub: 'Needs attention', icon: AlertTriangle, color: 'bg-[#FEF2F2] text-[#DC2626]' },
    { label: 'Popular Products', value: String(a.popularProducts.length), sub: 'In Popular Today', icon: Flame, color: 'bg-[#FFF7ED] text-[#EA580C]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B6B6B]">Overview of your restaurant performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/products/new"><Button><Plus className="h-4 w-4" /> Add Product</Button></Link>
          <Link to="/categories"><Button variant="secondary">Add Category</Button></Link>
          <Link to="/orders"><Button variant="secondary">View Orders <ArrowUpRight className="h-4 w-4" /></Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-[#9A9A9A]">{s.label}</div>
                <div className="text-xl font-extrabold text-[#1A1A1A] mt-1">{s.value}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">{s.sub}</div>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="h-5 w-5" /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Revenue — last 7 days</CardTitle>
            <Badge variant="neutral">{formatCurrency(a.revenueLast7Days.reduce((s, d) => s + d.revenue, 0))} total</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-end gap-1.5">
              {a.revenueLast7Days.map((d) => {
                const max = Math.max(1, ...a.revenueLast7Days.map((x) => x.revenue));
                const h = max ? (d.revenue / max) * 160 + 12 : 12;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-[#FFE9E3] rounded-t-xl relative overflow-hidden" style={{ height: h }}>
                      <div className="absolute inset-x-0 bottom-0 bg-[#FF5A3D]" style={{ height: `${max ? (d.revenue / max) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#9A9A9A]">{d.date}</span>
                    <span className="text-[10px] font-semibold text-[#1A1A1A]">{d.revenue ? `₹${d.revenue}` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Orders — last 7 days</CardTitle>
            <Badge variant="neutral">{a.ordersLast7Days.reduce((s, d) => s + d.count, 0)} orders</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-end gap-1.5">
              {a.ordersLast7Days.map((d) => {
                const max = Math.max(1, ...a.ordersLast7Days.map((x) => x.count));
                const h = max ? (d.count / max) * 160 + 12 : 12;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-[#DBEAFE] rounded-t-xl relative overflow-hidden" style={{ height: h }}>
                      <div className="absolute inset-x-0 bottom-0 bg-[#0284C7]" style={{ height: `${max ? (d.count / max) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#9A9A9A]">{d.date}</span>
                    <span className="text-[10px] font-semibold text-[#1A1A1A]">{d.count || '—'}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link to="/orders" className="text-xs font-semibold text-[#FF5A3D] hover:underline flex items-center gap-1">View all <Eye className="h-3.5 w-3.5" /></Link>
          </CardHeader>
          <CardContent>
            {a.recentOrders.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9A9A9A]">No orders yet</div>
            ) : (
              <div className="space-y-3">
                {a.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F5EEEA] hover:border-[#F0E6E2] transition">
                    <div className="h-10 w-10 rounded-xl bg-[#F8F5F3] flex items-center justify-center font-bold text-xs text-[#6B6B6B]">{o.orderNumber.slice(0, 6)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{o.orderNumber}</div>
                      <div className="text-xs text-[#9A9A9A]">{formatDate(o.createdAt)} • {o.items.length} items</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatCurrency(o.total)}</div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Popular products</CardTitle>
            <Link to="/popular" className="text-xs font-semibold text-[#FF5A3D] hover:underline">Manage</Link>
          </CardHeader>
          <CardContent>
            {a.popularProducts.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9A9A9A]">No popular products</div>
            ) : (
              <div className="space-y-3">
                {a.popularProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F5EEEA]">
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover border border-[#F0E6E2]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-[#9A9A9A]">{p.categoryName || p.categoryId} • ⭐ {p.rating}</div>
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(p.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link to="/products/new"><Button><Plus className="h-4 w-4" /> Add Product</Button></Link>
          <Link to="/categories"><Button variant="secondary">Add Category</Button></Link>
          <Link to="/offers"><Button variant="secondary">Create Offer</Button></Link>
          <Link to="/orders"><Button variant="secondary">View Orders</Button></Link>
        </div>
      </Card>
    </div>
  );
}

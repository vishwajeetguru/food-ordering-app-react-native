import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, Flame, Tag, ShoppingBag, Users, Settings, Image as ImageIcon, User, LogOut, Menu, X, Search, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Categories', to: '/categories', icon: Layers },
  { label: 'Popular Today', to: '/popular', icon: Flame },
  { label: 'Offers & Discounts', to: '/offers', icon: Tag },
  { label: 'Orders', to: '/orders', icon: ShoppingBag },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Banners & Home', to: '/home-content', icon: ImageIcon },
  { label: 'Restaurant Settings', to: '/settings', icon: Settings },
  { label: 'Profile', to: '/profile', icon: User },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const crumbs = location.pathname.split('/').filter(Boolean).map((s) => s.replace(/-/g, ' '));

  return (
    <div className="min-h-screen bg-[#FFFDFB] flex">
      {/* Sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[272px] bg-white border-r border-[#F0E6E2] flex flex-col transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="h-[64px] px-5 flex items-center justify-between border-b border-[#F5EEEA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#FF5A3D] flex items-center justify-center text-white font-extrabold text-sm">F</div>
            <div>
              <div className="font-extrabold text-[15px] leading-none text-[#1A1A1A]">Fooody</div>
              <div className="text-[11px] tracking-widest font-semibold text-[#FF5A3D] uppercase">Admin Panel</div>
            </div>
          </div>
          <button className="lg:hidden p-2 rounded-xl hover:bg-[#F8F5F3]" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition', isActive ? 'bg-[#FFF2EF] text-[#FF5A3D] border border-[#FFE9E3]' : 'text-[#6B6B6B] hover:bg-[#F8F5F3] hover:text-[#1A1A1A]')}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-30" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#F5EEEA] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-[#FFE9E3] flex items-center justify-center text-[#FF5A3D] font-bold text-sm">{user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-[#1A1A1A]">{user?.name || 'Admin'}</div>
              <div className="text-xs text-[#9A9A9A] truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-[#F0E6E2] text-sm font-medium text-[#6B6B6B] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-[272px] min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-[64px] bg-white/80 backdrop-blur border-b border-[#F0E6E2] flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden p-2 rounded-xl hover:bg-[#F8F5F3]" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>

          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <span className="text-[#9A9A9A]">Fooody</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#D6D0CC]" />
            {crumbs.length === 0 ? <span className="font-semibold text-[#1A1A1A]">Dashboard</span> : crumbs.map((c, i) => (
              <span key={i} className={cn('capitalize', i === crumbs.length - 1 ? 'font-semibold text-[#1A1A1A]' : 'text-[#6B6B6B]')}>{c}{i < crumbs.length - 1 && <span className="mx-1.5 text-[#D6D0CC]">/</span>}</span>
            ))}
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 bg-[#F8F5F3] rounded-full px-3 h-9 w-[280px] border border-[#F0E6E2]">
            <Search className="h-4 w-4 text-[#9A9A9A]" />
            <input placeholder="Search products, orders…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9A9A9A]" />
          </div>

          <button className="relative p-2.5 rounded-xl hover:bg-[#F8F5F3] border border-transparent hover:border-[#F0E6E2] transition">
            <Bell className="h-[18px] w-[18px] text-[#6B6B6B]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#FF5A3D] rounded-full border-2 border-white" />
          </button>

          <div className="h-9 w-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">{user?.name?.[0] || 'A'}</div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-4 text-center text-xs text-[#9A9A9A] border-t border-[#F5EEEA]">© {new Date().getFullYear()} Fooody — Restaurant Admin Panel</footer>
      </div>
    </div>
  );
}

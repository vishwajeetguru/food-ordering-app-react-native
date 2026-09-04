import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Primary: POST /auth/admin-login — works with both mock (admin123) and Firebase (Admin123!) modes
      const res = await api.post('/auth/admin-login', values);
      const data: any = res.data?.data || res.data;
      const token: string = data.customToken || data.idToken || data.token;
      const user = data.user;
      if (!token) throw new Error('No token returned');

      if (user?.role && user.role !== 'admin') {
        toast.error('Access denied — admin role required');
        return;
      }

      // If customToken is a Firebase custom token (short with .), admin-login already returned ID token when Firebase verified
      // So token here is already a valid ID token that backend's verifyIdToken accepts
      loginWithToken(token, user);
      toast.success('Welcome back, Admin');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      const code = err?.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS' || msg.includes('Invalid')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FFFDFB]">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-[#FF5A3D] opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-[#FFB020] opacity-10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FF5A3D] flex items-center justify-center font-extrabold">F</div>
            <span className="font-extrabold text-lg">Fooody</span>
            <span className="text-xs tracking-widest font-semibold text-[#FF5A3D] uppercase border border-white/10 rounded-full px-2 py-1">Admin</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">Premium restaurant<br />management,<br /><span className="text-[#FF5A3D]">made simple.</span></h1>
          <p className="text-white/60 max-w-md">Manage products, orders, offers and restaurant settings — all in one modern dashboard connected to your Fooody customer app.</p>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <Shield className="h-4 w-4 text-[#FF5A3D]" /> Secure admin access • Role-based • Production-ready
          </div>
        </div>
        <div className="relative text-sm text-white/40">© {new Date().getFullYear()} Fooody. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#FF5A3D] flex items-center justify-center text-white font-extrabold">F</div>
            <span className="font-extrabold">Fooody Admin</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Admin login</h2>
            <p className="text-sm text-[#6B6B6B] mt-1">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email address" type="email" placeholder="admin@foody.app" error={errors.email?.message} {...register('email')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="••••••••" className="w-full h-11 px-3.5 pr-10 rounded-xl border border-[#F0E6E2] bg-white text-sm placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#FF5A3D]/20 focus:border-[#FF5A3D] transition" {...register('password')} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[#F8F5F3] text-[#9A9A9A]">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors.password && <p className="text-xs text-[#DC2626]">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>

            <div className="rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] p-3 text-xs leading-relaxed text-[#9A4300]">
              <strong>Dev credentials:</strong> <code className="bg-white px-1.5 py-0.5 rounded border">admin@foody.app / admin123</code> <span className="text-[#9A9A9A]">(also accepts Admin123!)</span><br />
              Connected to <code className="bg-white px-1 py-0.5 rounded border text-[11px]">{import.meta.env.VITE_API_URL}</code>
            </div>
          </form>

          <p className="text-center text-sm text-[#9A9A9A]">Need help? <Link to="#" className="text-[#FF5A3D] font-medium hover:underline">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}

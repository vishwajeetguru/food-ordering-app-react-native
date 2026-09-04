import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  if (!user) return <div className="card p-8 text-center">Not authenticated</div>;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Profile / Account</h1>
      <Card>
        <CardHeader><CardTitle>Admin account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#FF5A3D] text-white flex items-center justify-center font-extrabold text-xl">{user.name?.[0] || user.email[0].toUpperCase()}</div>
            <div>
              <div className="font-bold">{user.name || 'Admin'}</div>
              <div className="text-sm text-[#6B6B6B]">{user.email}</div>
              <div className="text-xs text-[#9A9A9A] mt-1">Role: {user.role} • Status: {user.status} • ID: {user.id}</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#F8F5F3] p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-[#9A9A9A]">Email verified</span><span>{user.emailVerified ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-[#9A9A9A]">Providers</span><span>{user.providers.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-[#9A9A9A]">Created</span><span>{new Date(user.createdAt).toLocaleString()}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

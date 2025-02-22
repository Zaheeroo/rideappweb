'use client';

import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function RoleSwitcher() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for admin users
  if (!session?.user?.role || session.user.role !== 'admin') {
    return null;
  }

  const handleRoleSwitch = async () => {
    try {
      setIsLoading(true);
      const currentPath = window.location.pathname;
      const isInAdminDashboard = currentPath.startsWith('/admin');
      const newRole = isInAdminDashboard ? 'customer' : 'admin';

      const result = await signIn('credentials', {
        email: session.user.email,
        password: 'role-switch',
        role: newRole,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Navigate to the appropriate dashboard
      router.push(isInAdminDashboard ? '/dashboard' : '/admin');
      router.refresh();
      
      toast.success(`Switched to ${newRole} view`);
    } catch (error) {
      console.error('Error switching roles:', error);
      toast.error('Failed to switch roles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isInAdminDashboard = currentPath.startsWith('/admin');

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRoleSwitch}
      className="flex items-center gap-2"
      disabled={isLoading}
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span>
        {isLoading ? 'Switching...' : `Switch to ${isInAdminDashboard ? 'Customer' : 'Admin'} View`}
      </span>
    </Button>
  );
} 
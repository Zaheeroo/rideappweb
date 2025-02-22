'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from '@/components/ui/role-switcher';

export function DriverHeader() {
  const { data: session } = useSession();

  useEffect(() => {
    // Store email in localStorage for role switching
    if (session?.user?.email) {
      localStorage.setItem('userEmail', session.user.email);
    }
  }, [session?.user?.email]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            {session?.user?.role === 'admin' && <RoleSwitcher />}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 
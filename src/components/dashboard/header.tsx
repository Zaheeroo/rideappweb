'use client';

import { signOut, useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Bell, Globe, Menu, User, ArrowLeftRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isActuallyAdmin, setIsActuallyAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // More robust check for current view
  const isAdminView = pathname === '/admin' || pathname?.startsWith('/admin/');
  
  // Debug log
  useEffect(() => {
    console.log('Current pathname:', pathname);
    console.log('Is admin view?', isAdminView);
  }, [pathname, isAdminView]);

  useEffect(() => {
    const checkActualRole = async () => {
      if (session?.user?.email) {
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (!error && userProfile) {
          setIsActuallyAdmin(userProfile.role === 'admin');
        }
      }
    };

    checkActualRole();
  }, [session?.user?.email]);

  const handleRoleSwitch = async () => {
    try {
      setIsLoading(true);
      const newRole = isAdminView ? 'customer' : 'admin';

      const result = await signIn('credentials', {
        email: session?.user?.email,
        password: 'role-switch',
        role: newRole,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Navigate to the appropriate dashboard
      const newPath = newRole === 'admin' ? '/admin' : '/dashboard';
      router.push(newPath);
      router.refresh();
      
      toast.success(`Switched to ${newRole} view`);
    } catch (error) {
      console.error('Error switching roles:', error);
      toast.error('Failed to switch roles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified button text logic
  const buttonText = isLoading ? 'Switching...' : 
                    isAdminView ? 'Switch to Customer View' : 'Switch to Admin View';

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href={isAdminView ? '/admin' : '/dashboard'} 
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            RideApp
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Navigation items removed */}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Role Switch Button - Only visible for actual admins */}
            {isActuallyAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRoleSwitch}
                className="flex items-center gap-2 h-9 px-3 text-sm font-medium transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                disabled={isLoading}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{buttonText}</span>
              </Button>
            )}

            {/* Language Switcher */}
            <button className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Globe className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                3
              </span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-9 px-2 flex items-center gap-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">{session?.user?.name}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              {/* Navigation items removed */}
              {/* Role Switch in mobile menu */}
              {isActuallyAdmin && (
                <button
                  onClick={handleRoleSwitch}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-md font-medium"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {buttonText}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 
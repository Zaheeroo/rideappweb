'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { WavyBackground } from '@/components/ui/wavy-background';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      switch (session.user.role) {
        case 'driver':
          router.push('/driver');
          break;
        case 'admin':
          router.push('/admin');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center">
      <WavyBackground className="max-w-4xl mx-auto">
        <div className="relative z-10">
          <LoginForm />
        </div>
      </WavyBackground>
    </div>
  );
} 
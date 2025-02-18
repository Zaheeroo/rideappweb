'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button as MovingButton } from "@/components/ui/moving-border";
import {
  DashboardHeader,
  UpcomingTrips,
  PastTrips,
  AdditionalServices,
  ChatWidget
} from '@/components/dashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">
              Welcome, {session.user?.name}!
            </h1>
            <div className="max-w-sm mx-auto">
              <MovingButton
                onClick={() => router.push('/dashboard/book')}
                className="bg-blue-600 text-white hover:bg-blue-700 w-full text-lg font-medium"
                containerClassName="w-full"
                duration={3000}
                borderClassName="h-5 w-5 opacity-[0.8] bg-[radial-gradient(var(--sky-500)_40%,transparent_60%)]"
              >
                Book a Trip
              </MovingButton>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Trips */}
          <div className="lg:col-span-2">
            <UpcomingTrips />
            <div className="mt-8">
              <PastTrips />
            </div>
          </div>

          {/* Right Column - Additional Services & Chat */}
          <div className="space-y-8">
            <AdditionalServices />
            <ChatWidget />
          </div>
        </div>
      </main>
    </div>
  );
} 